# Professional Study implementation: P2.1–P4.1

Status: source implementation and isolated tests; NOT deployed. Production database migrations have NOT been applied.

## Delivered source

- /study is a lazy-loaded destination with Study, Exam, My Progress and Study Admin. All 17 subjects/77 syllabus areas can be browsed; empty subjects are honest empty states.
- Admin reuses existing authenticated Admin cookies. It manages level/subject/chapter materials, review date/source/session, preview, new revisions, publish and archive. A dedicated shortcut is added to portfolio Admin.
- Structured question editor manages MCQ choices and explanations, written model answers, criterion marks and revisions. Paper builder creates immutable reviewed snapshots, with a separate full-mock rules gate. A source-review tick is an Admin assertion, not independent ICAB certification.
- Teaching attachments use direct private Blob uploads, signatures/size validation, safe attachment downloads and publication-dependent access. This endpoint NEVER accepts student scripts. Student script upload/marking remains P4.2–P5.
- MCQ attempts use server-side guest sessions, hashed opaque tokens, persisted deadlines/responses, flags, stable start keys, answer validation, and owner-scoped submit/results/history. A late answer cannot extend the timer; expiry finalizes on timer callback or next server read. Deadline is enforced even when a closed browser prevents an immediate callback. No scheduler is claimed.
- Immediate MCQ results explain right and wrong choices and show topic-wise evidence/suggestions. No blanket exam-ready/pass claim is made. Result JSON can be downloaded.
- Original seed: four CL Assurance learning cards, one three-question Assurance practice paper and nine PL/AL written focus papers with model answers/rubrics (plus matching written practice study cards). These small papers are NOT full ICAB mocks, official questions or complete syllabus coverage.
- Written focus papers can be read in Exam; model answers/rubrics are in Study practice or authenticated Admin. Written timed submissions remain disabled.

## Storage and migrations

1. Review the target environment and backup/rollback plan. Do not run migrations against production until a release is explicitly authorized.
2. scripts/study-migrate.mjs --apply applies schema versions 1 and 2 explicitly; it is never run during build or by a public request. --seed-pilot opts into the original pilot data. DATABASE_URL is required and is never printed.
3. A separate private Blob store was created on 2026-11-16: name abdulowahab-study-private, ID store_4Ra3oy7WqXyEehue, region iad1, access private. Verified metadata: available, empty, zero connected projects. Do NOT create another copy.
4. The current Vercel connector can create/read stores but exposes no existing-store connection operation; no CLI token is available. Store/project connection and STUDY_BLOB_READ_WRITE_TOKEN remain pending. No existing public BLOB_READ_WRITE_TOKEN was changed. Until configured, file uploads show a clear setup error and text material management still works after the database migration.
5. Use a private store token scoped as STUDY_BLOB_READ_WRITE_TOKEN. Verify an actual private upload/read and anonymous denial before enabling attachments. No token values are committed.
6. /api/study rewrites to the existing content function with workspace=study. Existing /api/content behavior stays unchanged; this avoids adding a thirteenth Vercel function.

## Verification performed

- Real PostgreSQL-compatible PGlite runs both schema migrations and the actual service/API code, not an in-memory score mock.
- Tests cover publication/draft/archive isolation, MCQ start/autosave/resume/submit/results, question-key redaction, expiry, foreign-owner rejection, late edits, idempotent submission, rubric validation, file signature errors and seed re-entry.
- A jsdom React UI test clicks through level/subject browsing, empty states, MCQ answer/flag/submit/result and Admin draft preview/save against those same actual API/service handlers and database. Transport is adapted locally; Blob is not falsely reported as configured.
- Existing portfolio checks run alongside the new tests. Production build passes with pre-existing large-tool-chunk warnings.
- Cloud Browser could not connect to the executor's local preview (connection refused). No desktop/iPhone/Android screenshot or real-device visual sign-off is claimed. DOM tests do not substitute for browser layout checks.

## Remaining release gates

- Apply migrations and confirm database grants in an isolated connected environment, then verify production only after deployment instruction.
- Connect the already-created private store; verify real direct upload callbacks, file validation and draft/public access rules. P2.4's connected-storage acceptance remains OPEN.
- Browser/mobile visual, keyboard and end-to-end connected-service verification (P2.7 acceptance/P7) remain OPEN due local preview connectivity.
- Full subject materials and complete session-reviewed mock banks require content work; only the clearly labelled original pilot has been seeded.
- P4.2 onwards: timed written workflow, 30-minute script window, private learner files, OCR and calibrated marking. Optional student accounts and retention/deletion workers remain P6.

Exact handoff: finish the P2.4 connected-upload and P2.7 browser gates before claiming deployment readiness; then P4.2 written deadlines and upload states. Do not merge/deploy this work without the user's next instruction.

Final source checks: 132 tests passed; production build passed with existing large-chunk warnings. React best-practice review: Study, Exam and Admin chunks are lazy-loaded; effects clean up timers; answers render as text, not injected HTML; controls have labels; answer keys are server-only until finalization. Browser/mobile visual checks remain pending. Full-mock publication additionally requires reviewed question count, total marks, pass rule, zero-negative-marking rule and a session-rule source, validated against the blueprint gate. Nonzero negative marking is rejected rather than silently mis-scored.
