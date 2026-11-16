BEGIN;
-- Admin teaching assets; student scripts never use this table or endpoint.
ALTER TABLE study.material_assets ALTER COLUMN material_id DROP NOT NULL;
ALTER TABLE study.material_assets ALTER COLUMN bytes DROP NOT NULL;
ALTER TABLE study.material_assets RENAME COLUMN filename TO name;
ALTER TABLE study.material_assets ALTER COLUMN state SET DEFAULT 'authorized';
CREATE TABLE study.exam_activity (
 owner_id uuid NOT NULL REFERENCES study.owners(id), bucket timestamptz NOT NULL,
 count integer NOT NULL DEFAULT 0 CHECK(count>=0), PRIMARY KEY(owner_id,bucket)
);
CREATE TABLE study.request_limits (key_hash text NOT NULL,bucket timestamptz NOT NULL,count integer NOT NULL CHECK(count>0),PRIMARY KEY(key_hash,bucket));
-- Published material revisions and reviewed questions cannot be overwritten in place.
CREATE FUNCTION study.protect_content_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Archive content; do not delete revisions'; END IF;
 IF (OLD.state='published' OR OLD.state='reviewed' OR OLD.state='archived') AND
   (to_jsonb(NEW)-'state') IS DISTINCT FROM (to_jsonb(OLD)-'state') THEN
   RAISE EXCEPTION 'Create a new content revision';
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER material_revision_guard BEFORE UPDATE OR DELETE ON study.material_revisions FOR EACH ROW EXECUTE FUNCTION study.protect_content_revision();
CREATE TRIGGER question_revision_guard BEFORE UPDATE OR DELETE ON study.question_revisions FOR EACH ROW EXECUTE FUNCTION study.protect_content_revision();
CREATE FUNCTION study.protect_attempt_deadlines() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.started_at,NEW.exam_deadline,NEW.upload_deadline,NEW.paper_id) IS DISTINCT FROM
    (OLD.started_at,OLD.exam_deadline,OLD.upload_deadline,OLD.paper_id) THEN RAISE EXCEPTION 'Attempt timing and paper are immutable'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER attempt_deadlines_guard BEFORE UPDATE ON study.attempts FOR EACH ROW EXECUTE FUNCTION study.protect_attempt_deadlines();
INSERT INTO study.schema_versions(version) VALUES(2);
COMMIT;
