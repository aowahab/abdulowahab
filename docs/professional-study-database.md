# Professional Study database design (P1.4)

Status: additive PostgreSQL design, not applied to any connected database.
Migration: migrations/study/001_foundation.sql. Schema: study. Existing ERP, leads and public Blob content stay separate.

## Records and access

| Records | Purpose | Access |
|---|---|---|
| owners, sessions | Optional account / server guest identity, hashed opaque credentials | Server identity handlers only |
| syllabus_versions, subjects, chapters | Versioned source-backed navigation | Explicit public projection |
| material_revisions | Draft / published / archived teaching content | Admin writes; published projection only |
| material_assets | Admin-uploaded PDF/DOCX/images linked to a material revision | Private draft; published projection after review |
| question_revisions | Prompts, answer keys, explanations and rubrics | Private Admin/marking access |
| papers | Immutable reviewed blueprint and full question/rubric snapshot | Private; API strips answers before delivery |
| attempts, responses | Owner, deadlines, answers and submission state | Authenticated owner predicates on every query |
| uploads | Private object metadata and receipt state | Owner-authorized upload/read only |
| marking_jobs | Durable job ledger, generation, retries and leases | Background worker only |
| feedback, feedback_overrides | Original assessment and append-only rechecks | Owner read; reviewer writes overrides |
| audit_events | Minimal operational event metadata | Admin/service; no scripts, tokens or raw prompts |

The schema does not implement authentication, a queue worker or storage. No public endpoint is created by this migration. PUBLIC privileges are revoked; the eventual runtime role must receive only necessary grants. A database owner bypasses SQL privileges: server authorization remains mandatory. No claim of row-level-security protection is made.

## Required transactional behavior for later implementation

1. Resolve server session to owner. Never accept an owner ID from the client as authorization. All record queries join attempts.owner_id, including uploads/jobs/feedback.
2. Start an attempt from an immutable reviewed paper, compute both deadlines using the database clock and store them once. Unique owner/start_key makes retried starts idempotent. Do not start from a mutable live question bank.
3. Save MCQ responses inside a transaction that locks the attempt, checks active state and database time before upsert. Validate question IDs against the paper snapshot. Freeze answers at exam deadline.
4. Written attempts enter upload-only state. Mint short-lived private upload authorization bound to attempt, owner, path, allowed bytes/types and cutoff. Finalization validates actual file and trusted server receipt time. Starting upload before the deadline does not guarantee acceptance after it.
5. Lock the attempt on final submission; snapshot accepted uploads and enqueue one marking generation in the same transaction. Retries return the original receipt. No provider call inside this database transaction.
6. Workers claim using SELECT FOR UPDATE SKIP LOCKED, set lease_token and lease_until, commit, then perform bounded work. Completion must compare its lease token so an expired worker cannot overwrite the current worker. Failed work gets bounded retries/backoff; recheck creates a new generation.
7. Validate rubric criteria, per-question bounds and total reconciliation before writing immutable feedback. Store model/rubric versions and input digest. Low-confidence OCR becomes review-required. Reviewer changes are append-only overrides, not edits to the original assessment.
8. Progress is derived from completed authoritative attempts and rubric criteria. Do not treat imported guest/browser scores as verified server results.

## Revision and privacy constraints

Papers and feedback reject UPDATE. Question/material drafts are editable, but published papers already contain their immutable snapshots; no dependency on later question edits. Question revisions and catalogue versions should receive new IDs when their content changes.
Private scripts are stored outside SQL. Store opaque object keys, never public download URLs. API code must redact credentials and private file metadata from public projections. Parameterize SQL and treat document contents as untrusted data.
Guest owners are real server records for exam timing; optional account linkage is an explicit authenticated transaction. User-facing retention, deletion, guest migration and export policy is P1.5, not silently fixed here. External private objects must be deleted via a retryable deletion workflow before purging SQL metadata.

## Apply, verify and rollback

- This file is a design-stage migration. No runtime auto-migration is allowed.
- Before applying: snapshot/backup; record the target environment; inspect for an existing study schema; create a least-privilege migration role; verify on an isolated PostgreSQL branch and run the forthcoming API integration tests.
- One transaction creates only the study namespace and objects. CREATE SCHEMA fails on unexpected prior installation instead of hiding schema drift. schema_versions records successful installation.
- First deploy compatible server code with routes disabled. Apply only after environment verification and explicit release scope, seed reviewed catalogue, verify counts/constraints, then enable routes. Existing portfolio features require regression tests.
- On SQL failure before COMMIT: ROLLBACK leaves no partial installation.
- After successful use: prefer forward fixes. Revert application feature exposure; preserve learner records. Do not automatically DROP SCHEMA or undo completed attempts.
- For a disposable, confirmed-empty test database only, removing the study schema is acceptable cleanup. There is intentionally no destructive production down-migration.

## Verification limits / next work

P1.4 establishes the records, ownership contract, migration and rollback design. It does not prove configured Vercel/Neon permissions, real file privacy or an operational queue. Those require environment integration and end-to-end checks in later phases. Next: P1.5 guest/account retention, deletion and export policy, followed by P1.6 provider capability inspection.

## Additional user requirement: Admin material upload

P2.4 must include authenticated Admin upload of learning PDFs, DOCX and images, with level/subject/chapter selection, title and source/session metadata. Draft upload, preview, publish/archive and replacement create a versioned material record. Reuse the Admin identity boundary, but issue a separate scoped upload token and keep drafts inaccessible to public users. Publishing must validate assets before changing visibility. Material assets never share authorization with student answer scripts. The material_assets table supports this; actual upload UI/API remains P2 work.

## Migration and rollback procedure

Before application: back up the target database, inspect schema privileges and verify study does not already exist. This migration deliberately fails rather than silently reusing a divergent schema. Apply as one transaction with a migration owner; configure a separate restricted runtime role afterward. Seed versioned catalogue only after schema verification. No automatic application at server startup.
If application fails, PostgreSQL rolls back the transaction. After successful application, disable study writes and roll the application back while retaining the schema and learner data. Do not issue DROP SCHEMA CASCADE as routine rollback. Export and verify backups before any separately approved destructive teardown; delete private Blob objects through authorized retention jobs, not SQL alone.
Published paper/feedback updates are rejected; corrections require new versions/override records. Application service must also prevent response writes after expiry and enforce allowed attempt transitions; this migration does not claim those later handlers exist.
