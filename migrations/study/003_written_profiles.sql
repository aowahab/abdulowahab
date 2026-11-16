BEGIN;
ALTER TABLE study.owners ADD COLUMN deleted_at timestamptz;
ALTER TABLE study.attempts ADD COLUMN deleted_at timestamptz;
ALTER TABLE study.attempts ADD COLUMN submission_manifest jsonb;
ALTER TABLE study.attempts ADD COLUMN submission_digest text;
ALTER TABLE study.attempts ADD COLUMN consent jsonb;
ALTER TABLE study.uploads ADD COLUMN authorization_hash text;
ALTER TABLE study.uploads ADD COLUMN filename text NOT NULL DEFAULT 'answer-script';
ALTER TABLE study.uploads ADD COLUMN question_id text;
ALTER TABLE study.uploads ADD COLUMN page_count integer CHECK(page_count>0);
ALTER TABLE study.uploads ADD COLUMN validated_at timestamptz;
ALTER TABLE study.uploads ADD COLUMN error_code text;
ALTER TABLE study.uploads DROP CONSTRAINT uploads_attempt_id_page_order_key;
ALTER TABLE study.uploads ADD CONSTRAINT uploads_attempt_id_page_order_key UNIQUE(attempt_id,page_order) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE study.marking_jobs ADD COLUMN provider_metadata jsonb;
CREATE TABLE study.transcriptions (
 job_id uuid PRIMARY KEY REFERENCES study.marking_jobs(id), body jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), delete_after timestamptz NOT NULL
);
CREATE TABLE study.transfer_receipts (
 request_key uuid PRIMARY KEY, from_owner uuid NOT NULL, to_owner uuid NOT NULL,
 transferred integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE study.unverified_history (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES study.owners(id), body jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), verified boolean NOT NULL DEFAULT false CHECK(verified=false)
);
CREATE TABLE study.deletion_jobs (
 id uuid PRIMARY KEY, attempt_id uuid NOT NULL UNIQUE REFERENCES study.attempts(id),
 state text NOT NULL CHECK(state IN ('queued','running','completed','failed')),
 error_code text, created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE TABLE study.grading_budgets (
 budget_key text NOT NULL, budget_day date NOT NULL,
 limit_units bigint NOT NULL CHECK(limit_units>=0), reserved_units bigint NOT NULL DEFAULT 0 CHECK(reserved_units>=0),
 spent_units bigint NOT NULL DEFAULT 0 CHECK(spent_units>=0), PRIMARY KEY(budget_key,budget_day),
 CHECK(reserved_units+spent_units<=limit_units)
);
CREATE TABLE study.grading_reservations (
 job_id uuid PRIMARY KEY REFERENCES study.marking_jobs(id), budget_day date NOT NULL,
 owner_id uuid NOT NULL REFERENCES study.owners(id), reserved_units bigint NOT NULL CHECK(reserved_units>0),
 spent_units bigint NOT NULL DEFAULT 0 CHECK(spent_units>=0), state text NOT NULL CHECK(state IN ('reserved','settled'))
);
CREATE FUNCTION study.protect_submission() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.submission_manifest IS NOT NULL AND
 (NEW.submission_manifest,NEW.submission_digest,NEW.consent) IS DISTINCT FROM
 (OLD.submission_manifest,OLD.submission_digest,OLD.consent) THEN RAISE EXCEPTION 'Submitted script version is immutable'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER submission_guard BEFORE UPDATE ON study.attempts FOR EACH ROW EXECUTE FUNCTION study.protect_submission();
CREATE FUNCTION study.protect_received_upload() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM study.attempts WHERE id=OLD.attempt_id AND submission_manifest IS NOT NULL) AND
 (NEW.object_key,NEW.attempt_id,NEW.mime_type,NEW.bytes,NEW.page_order,NEW.sha256,NEW.question_id,NEW.received_at) IS DISTINCT FROM
 (OLD.object_key,OLD.attempt_id,OLD.mime_type,OLD.bytes,OLD.page_order,OLD.sha256,OLD.question_id,OLD.received_at)
 THEN RAISE EXCEPTION 'Submitted upload is immutable'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER upload_guard BEFORE UPDATE ON study.uploads FOR EACH ROW EXECUTE FUNCTION study.protect_received_upload();
CREATE INDEX deletion_queue ON study.deletion_jobs(state,created_at);
CREATE INDEX uploads_expiry ON study.uploads(delete_after) WHERE state<>'deleted';
INSERT INTO study.schema_versions(version) VALUES(3);
COMMIT;
