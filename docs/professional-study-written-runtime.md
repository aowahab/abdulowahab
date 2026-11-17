# Written practice, marking and optional profiles — handoff

Updated: 2026-11-17, Asia/Dhaka. Branch: feature/study-catalogue-p13; draft PR #10.
**Do not deploy or apply production migrations.** User's latest instruction overrides previous deployment permissions.

## Implemented source

- `003_written_profiles.sql` is an additive migration, explicitly included by the migration runner. Existing portfolio tables are untouched. It has NOT been applied to Neon. Test databases execute migrations 1–3.
- Written paper start persists immutable server deadlines. Upload opens after exam time and closes exactly 1,800 seconds later. All file upload, validation and final submission must complete before the cutoff; beginning an upload grants no extension. Off-device writing cannot be prevented.
- A dedicated private store is required **before starting the timer**. Upload capability grants contain random secrets hashed in SQL, expire within five minutes and are scoped to one exact path, type, byte count and attempt. The Blob SDK verifies completion callbacks. The owner can retry a lost receipt by independently validating the stored bytes; this cannot bypass the cutoff.
- PDFs, DOCX and JPEG/PNG/WebP are accepted; legacy DOC is explicitly rejected with conversion guidance. Limits: 20 MiB/file, 50 MiB/attempt, 40 files, 60 PDF/image/explicit-break pages, 25 MP/image. DOCX logical pagination cannot verify Word's rendered page count; PDF export is recommended for exact page order/layout. PDF inspection, bounded ZIP expansion, signatures and image dimensions are checked before extraction. Malformed/encrypted/unreadable documents fail or require review.
- UI shows the server timer, file receipts, local image preview, private original-file downloads, file reordering/removal, optional question mapping and explicit AI/Admin review consent. Submission locks the exact ordered manifest and SHA-256 digests. SQL triggers prevent changing submitted versions.
- `study-worker.mjs` executes one durable leased job per invocation. `FOR UPDATE SKIP LOCKED`, a lease UUID, three-claim limit, retry backoff and deletion checks protect recovery. A stale/deleted lease cannot write feedback. This is a real DB-backed worker implementation, **not an installed scheduler**. Run a single worker concurrently until throughput and multiple-worker purge races are independently tested.
- PDF embedded text and DOCX text are extracted locally. Scans/images use local Tesseract English/Bangla models; all OCR pages conservatively require human review, even at high reported confidence. A synthetic printed-image smoke check returned the exact sentence with confidence 95; this is not handwriting calibration.
- AI SDK structured grading uses a configurable Groq model and trusted rubric snapshot, with untrusted script text in a separate data field, no tools or external retrieval. Input/output limits, exact evidence quotes, per-criterion bounds and deterministic sums are validated. The worker never invents marks when configuration, transcription, budget or provider output is insufficient.
- Worst-case call ceilings reserve all three possible dispatches transactionally against owner/global daily budgets. Each dispatch is charged its verified ceiling BEFORE the provider call, so crashes cannot hide spending. Unused reservation is released at final state. This is conservative ceiling accounting; it does not claim measured provider billing. Prices/currency are not invented.
- Private Admin review confirms every original page, cites evidence, awards rubric marks, explains lost marks and supplies corrected/improved answers and focus actions. Original feedback remains immutable; corrections append reviewer/reason/input evidence. Students can request two rechecks. Admin access requires explicit script-review consent, separate from the public portfolio assistant.
- Optional Neon Auth client integration reuses the existing provider. Server verifies fresh EdDSA JWT issuer/expiry/required claims through configured JWKS. Client owner IDs are never trusted. Guest access remains separate. Transfer requires BOTH a valid guest credential and signed-in account, explicit consent, settled attempts and a transactionally idempotent receipt.
- My Progress shows recent 100 attempts, score history, MCQ area coverage/errors/recency, per-attempt timing and written feedback. It makes no whole-syllabus readiness claim. Export pages through all accessible history in ten-attempt batches, including finalized assessment explanations. Private original files download separately; keys, tokens and private storage paths are excluded.
- Deletion immediately tombstones attempts and fences jobs. Physical deletion waits for actual private storage success; failures stay retryable. Retention handles expired 30-day guest data, 180-day originals/OCR and 24-hour abandoned uploads. Scheduled maintenance must be installed before promising automatic expiry. Assessment evidence quotes remain in retained account results until deletion. Study deletion retains the external Neon sign-in account; a deleted Study identity cannot silently resurrect its history.

## Configuration gates — values must never enter Git or logs

| Area | Required configuration / verification |
|---|---|
| Database | DATABASE_URL or POSTGRES_URL; explicitly migrate an isolated target and seed only the labelled pilot |
| Private storage | Connect EXISTING `abdulowahab-study-private` (`store_4Ra3oy7WqXyEehue`) to the appropriate environment; set STUDY_BLOB_READ_WRITE_TOKEN; prove direct upload, callback, private read and anonymous denial; only then set STUDY_PRIVATE_STORAGE_VERIFIED=true |
| Optional account | VITE_NEON_AUTH_URL, NEON_AUTH_BASE_URL and NEON_AUTH_JWKS_URL; verify issuer against real provider tokens, trusted origins, signup, email verification, signout and two-device isolation |
| AI | GROQ_API_KEY and STUDY_GRADING_MODEL selected from a verified current provider catalogue; STUDY_PROVIDER_PRIVACY_APPROVED=true after reviewing provider retention |
| Calibration | STUDY_CALIBRATION_VERSION only after a human-reviewed script corpus and disagreement analysis; OCR remains review-only |
| Costs | STUDY_PRICING_VERSION, STUDY_BUDGET_CURRENCY, STUDY_MAX_CALL_UNITS, STUDY_DAILY_BUDGET_UNITS, STUDY_OWNER_DAILY_BUDGET_UNITS; verified worst-case prices and safe integer micro-units in one currency |
| Operations | Install a durable scheduler for `npm run study:worker` and `npm run study:retention`; verify recovery, storage deletion, function/resource packaging and alerting before release |

No production environment variables were changed. The existing private store remains empty/unconnected. The connector cannot connect an existing store and no CLI token is available; do not create a duplicate store.

## Verification and known limits

Actual PGlite migrations/services/handlers and React/jsdom flows cover MCQ and written receipts, ordering, consent/locked submission, deadlines, late callbacks, privacy, missing configuration, deterministic grade validation, budget settlement, rate-limit retry, lease recovery, human override, account transfer and deletion failure/retry. Signed JWT fixtures test real cryptographic verification. Provider transports and Blob storage are explicit local fixtures; they do not establish real-provider integration or calibration.

Local production build passes. Existing portfolio regression suite passes. Baseline build warnings remain (large tool chunks and duplicate arrow icon key); auth SDK dependency comments also produce non-fatal bundler warnings. UI components are lazy-loaded, controls labelled, text rendered without injected HTML and timers cleaned up.

Browser/device visual acceptance remains OPEN. The attached browser could not reach the local server in the prior attempt; an additional headless Chromium install failed because the browser download was truncated by this environment. No iPhone Safari/Android/desktop screenshot or layout sign-off is claimed.

Official session-specific exam rules and complete full-paper banks remain content gates. Nine written focus pilots and a three-question CL pilot are not complete ICAB mocks.

Next concrete actions: connect and verify the existing private store in an isolated environment; verify real Neon login across devices; install/test the worker and retention schedules; calibrate with permitted human-reviewed scripts; complete browser/mobile accessibility QA. Only then consider a user-authorized release. Previous production rollback target: 65583b787ca73ba581e74553e81dd9d557a87bfa (recheck live target before any future release).

## Runtime setup contract (names only)

| Configuration | Purpose / gate |
|---|---|
| DATABASE_URL or POSTGRES_URL | Existing database; explicit isolated migration before runtime verification |
| STUDY_BLOB_READ_WRITE_TOKEN | Dedicated token for existing private study store; never reuse the public content-store token |
| STUDY_PRIVATE_STORAGE_VERIFIED=true | Set only after real private upload/read, callback and anonymous-denial tests |
| VITE_NEON_AUTH_URL | Existing Neon Auth client URL, public build configuration |
| NEON_AUTH_BASE_URL, NEON_AUTH_JWKS_URL | Existing issuer and trusted HTTPS key endpoint; required for server account verification |
| GROQ_API_KEY, STUDY_GRADING_MODEL | Existing provider credential plus explicitly chosen, verified model; no guessed model default |
| STUDY_CALIBRATION_VERSION | Reference to reviewed permitted calibration corpus and its measured acceptance results |
| STUDY_PROVIDER_PRIVACY_APPROVED=true | Operator has verified provider processing/retention conditions for private scripts |
| STUDY_PRICING_VERSION, STUDY_BUDGET_CURRENCY | Reviewed pricing source/version and single currency for integer micro-unit ceilings |
| STUDY_MAX_CALL_UNITS | Verified worst-case ceiling for one bounded request, positive integer |
| STUDY_DAILY_BUDGET_UNITS, STUDY_OWNER_DAILY_BUDGET_UNITS | Positive integer global/owner daily ceilings; owner covers three calls and stays within global |

Explicit commands: `npm run study:worker` for one marking tick; `npm run study:retention` for one maintenance sweep. Install them in a durable scheduler only after isolated operational tests. Do not start unbounded background work from a public HTTP response. No scheduler, real provider dispatch, production secrets, migration or deployment was configured by this change.

Final local evidence: **144 tests passed**, no skips/failures; `npm run build` passed; `git diff --check` passed. This evidence includes the portfolio regression suite, real local SQL/API/React flows and the signed-JWT tests. Real services and device acceptance remain open as described above.
