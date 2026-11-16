-- PostgreSQL design migration. Apply only after isolated PostgreSQL verification.
-- Intentionally no runtime auto-migration; ERP/public portfolio tables untouched.
BEGIN;
CREATE SCHEMA study;
CREATE TABLE study.schema_versions (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE study.owners (
 id uuid PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('guest','account')),
 identity_subject text UNIQUE, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((kind='guest' AND identity_subject IS NULL) OR (kind='account' AND identity_subject IS NOT NULL))
);
-- Only hashes of high-entropy opaque credentials; never plaintext cookies.
CREATE TABLE study.sessions (
 token_hash text PRIMARY KEY, owner_id uuid NOT NULL REFERENCES study.owners(id),
 expires_at timestamptz NOT NULL, revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), CHECK(expires_at>created_at)
);
CREATE INDEX sessions_owner ON study.sessions(owner_id);
CREATE TABLE study.syllabus_versions (
 id text PRIMARY KEY, sources jsonb NOT NULL CHECK(jsonb_typeof(sources)='array'),
 checked_on date NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE study.subjects (
 syllabus_id text NOT NULL REFERENCES study.syllabus_versions(id), id text NOT NULL,
 level text NOT NULL CHECK(level IN ('CL','PL','AL')), title text NOT NULL,
 PRIMARY KEY(syllabus_id,id)
);
CREATE TABLE study.chapters (
 syllabus_id text NOT NULL, subject_id text NOT NULL, id text NOT NULL,
 title text NOT NULL, ordinal integer NOT NULL CHECK(ordinal>0),
 provenance jsonb NOT NULL CHECK(jsonb_typeof(provenance)='object'),
 PRIMARY KEY(syllabus_id,subject_id,id), UNIQUE(syllabus_id,subject_id,ordinal),
 FOREIGN KEY(syllabus_id,subject_id) REFERENCES study.subjects(syllabus_id,id)
);
CREATE TABLE study.material_revisions (
 id uuid PRIMARY KEY, syllabus_id text NOT NULL, subject_id text NOT NULL, chapter_id text NOT NULL,
 revision integer NOT NULL CHECK(revision>0), logical_id uuid NOT NULL,
 state text NOT NULL CHECK(state IN ('draft','published','archived')),
 title text NOT NULL, body jsonb NOT NULL, provenance jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(logical_id,revision),
 FOREIGN KEY(syllabus_id,subject_id,chapter_id) REFERENCES study.chapters(syllabus_id,subject_id,id)
);
-- Admin learning assets are separate from private student answer scripts.
CREATE TABLE study.material_assets (
 id uuid PRIMARY KEY, material_id uuid NOT NULL REFERENCES study.material_revisions(id),
 object_key text NOT NULL UNIQUE, filename text NOT NULL, mime_type text NOT NULL,
 bytes bigint NOT NULL CHECK(bytes>0),
 state text NOT NULL CHECK(state IN ('authorized','received','validated','rejected','deleted')),
 access_scope text NOT NULL DEFAULT 'private-draft' CHECK(access_scope IN ('private-draft','published-material')),
 uploaded_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE study.question_revisions (
 id uuid PRIMARY KEY, syllabus_id text NOT NULL, subject_id text NOT NULL, chapter_id text NOT NULL,
 logical_id uuid NOT NULL, revision integer NOT NULL CHECK(revision>0),
 state text NOT NULL CHECK(state IN ('draft','reviewed','archived')),
 kind text NOT NULL CHECK(kind IN ('single-choice','written','case')),
 prompt jsonb NOT NULL, answer_key jsonb NOT NULL, explanation jsonb NOT NULL,
 rubric jsonb NOT NULL, max_marks numeric(8,2) NOT NULL CHECK(max_marks>0),
 provenance jsonb NOT NULL, UNIQUE(logical_id,revision),
 FOREIGN KEY(syllabus_id,subject_id,chapter_id) REFERENCES study.chapters(syllabus_id,subject_id,id)
);
-- Immutable versions contain exact private question/rubric snapshots.
CREATE TABLE study.papers (
 id uuid PRIMARY KEY, syllabus_id text NOT NULL, subject_id text NOT NULL,
 logical_id uuid NOT NULL, revision integer NOT NULL CHECK(revision>0),
 session_id text NOT NULL, format text NOT NULL CHECK(format IN ('mcq','written','written-case','online')),
 duration_seconds integer NOT NULL CHECK(duration_seconds>0),
 upload_seconds integer NOT NULL CHECK(upload_seconds IN (0,1800)),
 total_marks numeric(8,2) NOT NULL CHECK(total_marks>0),
 blueprint jsonb NOT NULL, private_snapshot jsonb NOT NULL,
 reviewed_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(logical_id,revision), FOREIGN KEY(syllabus_id,subject_id) REFERENCES study.subjects(syllabus_id,id),
 CHECK((format IN ('written','written-case') AND upload_seconds=1800) OR (format IN ('mcq','online') AND upload_seconds=0))
);
CREATE TABLE study.attempts (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES study.owners(id), paper_id uuid NOT NULL REFERENCES study.papers(id),
 start_key uuid NOT NULL, state text NOT NULL CHECK(state IN ('active','uploading','submitted','expired','marking','review-required','completed','failed')),
 started_at timestamptz NOT NULL, exam_deadline timestamptz NOT NULL, upload_deadline timestamptz NOT NULL,
 submitted_at timestamptz, completed_at timestamptz,
 UNIQUE(owner_id,start_key), CHECK(exam_deadline>started_at), CHECK(upload_deadline>=exam_deadline)
);
CREATE INDEX attempts_owner_recent ON study.attempts(owner_id,started_at DESC);
CREATE TABLE study.responses (
 attempt_id uuid NOT NULL REFERENCES study.attempts(id), question_id text NOT NULL,
 response jsonb NOT NULL, saved_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(attempt_id,question_id)
);
CREATE TABLE study.uploads (
 id uuid PRIMARY KEY, attempt_id uuid NOT NULL REFERENCES study.attempts(id),
 object_key text NOT NULL UNIQUE, mime_type text NOT NULL, bytes bigint NOT NULL CHECK(bytes>0),
 page_order integer NOT NULL CHECK(page_order>0), sha256 text,
 state text NOT NULL CHECK(state IN ('authorized','received','validated','rejected','deleted')),
 authorized_at timestamptz NOT NULL, authorization_expires_at timestamptz NOT NULL,
 received_at timestamptz, delete_after timestamptz,
 UNIQUE(attempt_id,page_order), CHECK(authorization_expires_at>authorized_at)
);
CREATE TABLE study.marking_jobs (
 id uuid PRIMARY KEY, attempt_id uuid NOT NULL REFERENCES study.attempts(id),
 generation integer NOT NULL CHECK(generation>0), state text NOT NULL CHECK(state IN ('queued','running','completed','review-required','failed')),
 retries integer NOT NULL DEFAULT 0 CHECK(retries>=0), available_at timestamptz NOT NULL DEFAULT now(),
 lease_until timestamptz, lease_token uuid, model_version text, rubric_version text,
 input_digest text NOT NULL, error_code text, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(attempt_id,generation)
);
CREATE INDEX jobs_claim ON study.marking_jobs(state,available_at);
CREATE TABLE study.feedback (
 id uuid PRIMARY KEY, job_id uuid NOT NULL UNIQUE REFERENCES study.marking_jobs(id),
 score numeric(8,2) NOT NULL CHECK(score>=0), maximum numeric(8,2) NOT NULL CHECK(maximum>0),
 criteria jsonb NOT NULL, transcription_status text NOT NULL CHECK(transcription_status IN ('readable','review-required')),
 summary jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), CHECK(score<=maximum)
);
CREATE TABLE study.feedback_overrides (
 id uuid PRIMARY KEY, feedback_id uuid NOT NULL REFERENCES study.feedback(id),
 reviewer text NOT NULL, reason text NOT NULL, replacement jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE study.audit_events (
 id uuid PRIMARY KEY, owner_id uuid REFERENCES study.owners(id), attempt_id uuid REFERENCES study.attempts(id),
 action text NOT NULL, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION study.reject_revision_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Immutable revision: create a new version'; END;
$$;
CREATE TRIGGER papers_immutable BEFORE UPDATE ON study.papers FOR EACH ROW EXECUTE FUNCTION study.reject_revision_update();
CREATE TRIGGER feedback_immutable BEFORE UPDATE ON study.feedback FOR EACH ROW EXECUTE FUNCTION study.reject_revision_update();
-- Access is via authenticated server routes, not directly from browser SQL clients.
REVOKE ALL ON SCHEMA study FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA study FROM PUBLIC;
INSERT INTO study.schema_versions(version) VALUES(1);
COMMIT;
