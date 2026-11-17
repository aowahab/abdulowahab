# Professional Study — delivery plan and handoff checklist

Last updated: 2026-11-17 (Asia/Dhaka)
Repository: aowahab/abdulowahab
Canonical checklist: this file on main. PR #10 was merged for the user-authorized 2026-11-17 release.
Scope: a separate Professional Study section within the existing portfolio, with Study, Exam and My Progress.
Status: Study/MCQ foundation released on 2026-11-17. Written uploads, real account verification, marking calibration and device acceptance remain OPEN; this is not full P1–P7 completion.
Owner: Codex. Next task: verify connected private storage, real optional login and worker operations; see latest handoff.
Existing portfolio PHASES.md is a different workstream; do not confuse its completion with this plan.

## Product decisions agreed with Abdul Owahab

- CL / PL / AL filters, then subject and chapter.
- Study contains materials, worked examples, revision, mock practice and written practice.
- Exam provides ICAB-style practice appropriate to the selected subject and session.
- MCQs: immediate result after submission; explanations for BOTH correct and incorrect answers.
- PL and AL written: timed paper, then 30 minutes to upload PDF, Word or multiple images.
- Written feedback: marks per subquestion, workings/alternative valid methods, why marks were lost, correct answer, improved answer and focus areas.
- My Progress records attempts, topic performance, scripts and recommendations.
- Profile is optional. Guests can study and sit exams; account users can retain private history across devices.
- AI marking is practice assessment, not official ICAB grading. Unreadable handwriting requires review, not invented interpretation.
- Separate Study practice mode from Exam mode; exam answers stay hidden until submission.
- Preserve existing live portfolio behavior. User explicitly authorized deployment on 2026-11-17. This authorizes the recorded release, not an automatic deployment schedule.

## How to use this checklist

1. Read this file and current main before starting. Inspect AGENTS.md if present.
2. Claim one item in the handoff log with owner, branch and starting SHA.
3. Work on a focused branch from current main. Keep secrets and student scripts out of Git.
4. Mark an item [x] only after its acceptance evidence is recorded. Partial or blocked work stays [ ].
5. Record tests, preview URL if available, commit, limitations and exact next task before handing over.
6. Recheck current deployment and main before any release. The 2026-11-17 release was explicitly authorized. Verify each later release against the current user instruction.
7. Keep this single document current; link other technical documents rather than creating conflicting checklists.

## Phase overview

| Phase | Deliverable | Depends on | Status |
|---|---|---|---|
| P0 | Scope and handoff register | None | Plan recorded |
| P1 | Verified syllabus and architecture | P0 | Baseline complete; official session gaps open |
| P2 | Study section and content management | P1 | Source implemented; real private upload/visual gates open |
| P3 | Timed MCQ exams and instant feedback | P1, P2 | Released; real connected desktop MCQ flow verified |
| P4 | Written exams and script submission | P1, P2 | Implemented; real storage acceptance open |
| P5 | Written marking and learning feedback | P4 | Worker/review implemented; live AI/calibration open |
| P6 | Optional profiles and progress | P3, P5 | Source implemented; live auth/scheduler acceptance open |
| P7 | Full verification and controlled release | P2–P6 | Automated checks pass; release/device gates open |

## P0 — Scope and continuity

- [x] P0.1 Record user requirements and implementation phases.
- [x] P0.2 Establish one canonical checklist with acceptance criteria and handoff fields.
- [x] P0.3 Link this register from repository README when implementation starts.

## P1 — Verified syllabus, data and architecture

- [x] P1.1 Inspect existing routes, navigation, Admin, auth, Blob and PostgreSQL integration; identify extension points and baseline tests.
- [ ] P1.2 Verify official current ICAB subjects, syllabus, assessment format, duration, marks and permitted resources per subject/session. Record source URLs, checked dates and effective sessions; resolve conflicting older documents.
- [x] P1.3 Create versioned level/subject/chapter catalogue and session-specific exam blueprints. Do not assume every PL subject is written; check IT Governance separately.
- [x] P1.4 Design database migrations: syllabus versions, materials, questions, rubrics, papers, attempts, responses, uploads, marking jobs, feedback and account ownership.
- [x] P1.5 Define guest storage and account retention/deletion/export rules. Guest browser-only history is not cross-device persistence.
- [x] P1.6 Design private file storage, signed uploads, PDF/DOCX/image extraction, OCR, asynchronous marking and provider integration using existing resources where suitable.
- [x] P1.7 Specify file/page limits, AI cost controls, rate limits, failure handling and job retry policy before implementation.

Acceptance: reviewed architecture and verified subject/session matrix; migration and rollback design; no mock integrations presented as working services.
Evidence / blockers: P1.1 findings recorded in [architecture discovery](docs/professional-study-architecture.md). Remaining P1 items are open.

## P2 — Study and content administration

- [x] P2.1 Add responsive Professional Study entry and Study / Exam / My Progress navigation without breaking existing routes.
- [x] P2.2 Implement CL / PL / AL → subject → chapter filters and empty/loading/error states.
- [x] P2.3 Display materials, explanations, worked calculations, revision notes and practice questions.
- [ ] P2.4 Extend authenticated Admin with draft, preview, publish, edit and archive for materials/questions/rubrics.
- [x] P2.5 Store source, session, syllabus version and last verification date with technical content; flag stale tax/law material.
- [x] P2.6 Use original or permitted content; distinguish original practice questions from official past questions.
- [x] P2.7 Seed an explicitly labelled, reviewed pilot module; show unavailable subjects honestly.

Acceptance: Admin-published content appears under correct filters; unpublished content remains private; mobile, keyboard and regression checks pass.
Evidence / blockers: none yet.

## P3 — MCQ exam engine

- [x] P3.1 Build paper selection by level, subject, session and practice/full mock mode, using published reviewed questions.
- [x] P3.2 Show duration, marks and rules before start; navigation, unanswered counts and review flags during exam.
- [x] P3.3 Persist attempt deadline and autosaved answers server-side; refresh/device clock changes must not extend exam time.
- [x] P3.4 Implement manual submission, expiry submission, reconnection behavior and idempotent finalization.
- [x] P3.5 Keep answer keys and explanations server-side until the attempt is finalized.
- [x] P3.6 Return immediate deterministic score with selected/correct answers and explanations for every question.
- [x] P3.7 Generate topic breakdown and specific revision recommendations; avoid unsupported readiness claims.

Acceptance: known fixtures produce exact scores; timer/refresh/disconnection/double-submit tested; correct answers cannot be fetched early.
Evidence / blockers: none yet.

## P4 — Written exam and 30-minute submission window

- [x] P4.1 Prepare reviewed PL/AL papers with subquestion marks, rubrics, model answers and subject/session-specific rules.
- [x] P4.2 Start immutable server-side exam and upload deadlines; upload deadline = exam deadline + 30 minutes.
- [x] P4.3 Switch from writing to upload state at exam end; explain that off-device writing cannot be technically prevented.
- [ ] P4.4 Accept PDF, DOCX and multiple image pages, with preview, ordering, question mapping and upload receipt.
- [x] P4.5 Handle legacy .doc only with safe supported conversion; otherwise give a clear DOCX/PDF conversion message.
- [ ] P4.6 Support reliable signed direct uploads beyond function request limits; validate MIME/signature, size/page limits and access.
- [x] P4.7 Define upload-start versus upload-completion cutoff; enforce late submission and retry rules on the server.
- [x] P4.8 Store private immutable submitted script version; prevent cross-user access and accidental public Blob exposure.

Acceptance: server enforces the exact 30-minute window; mixed page uploads preserve order; expired/invalid/unauthorized submissions fail clearly.
Evidence / blockers: none yet.

## P5 — AI practice marking and feedback

- [ ] P5.1 Extract PDF/DOCX text and OCR images/scans; detect missing/unreadable pages and allow review.
- [ ] P5.2 Build private asynchronous marking jobs with queued/running/completed/review-required/failed states, retries and duplicate protection.
- [ ] P5.3 Mark per subquestion against versioned rubric; award workings, partial credit and valid alternative methods.
- [x] P5.4 Enforce score bounds and total reconciliation; validate calculations with deterministic checks where feasible.
- [x] P5.5 Show criterion-level evidence, lost marks, corrected solution, improved answer structure and next learning actions.
- [x] P5.6 Treat scripts as untrusted data: embedded instructions cannot change rubrics, reveal secrets or run tools.
- [ ] P5.7 Calibrate against manually reviewed scripts; measure disagreements, transcription confidence and failure modes before enabling full use.
- [x] P5.8 Label marks as AI practice estimates; support recheck requests and reviewer overrides with an audit trail.
- [x] P5.9 Store rubric/model versions and grading inputs securely so results can be reproduced or explained.

Acceptance: reviewed calibration set, readable feedback and reconciled marks; unreadable scripts enter review; provider outages do not lose submissions.
Evidence / blockers: marking provider/storage/worker design not yet verified.

## P6 — Optional profiles and progress

- [ ] P6.1 Implement optional sign-in and private ownership checks; guest access remains available.
- [x] P6.2 Offer guest local history and downloadable results; explain device/storage limitations.
- [x] P6.3 Allow explicit migration of guest history to account without duplication; never trust guest scores as server-verified marks.
- [x] P6.4 Show attempts, saved scripts, feedback, level/subject/topic performance and score trends.
- [x] P6.5 Recommend revision from coverage, repeated errors, recency and time use; label insufficient evidence.
- [ ] P6.6 Provide export/delete controls, retention policy and secure account/session handling.
- [x] P6.7 Test isolation between two users and guest/account transitions.

Acceptance: account history works across devices; private scripts are isolated; guest learning needs no account; recommendations cite actual attempts.
Evidence / blockers: none yet.

## P7 — Verification, release and operations

- [x] P7.1 Run unit/integration checks for scoring, deadlines, upload cutoffs, authorization and grading state transitions.
- [ ] P7.2 Complete end-to-end MCQ flow and PL/AL written flow through upload, marking, feedback and progress.
- [ ] P7.3 Test iPhone Safari, Android and desktop; keyboard navigation, contrast, reading order and accessible timer announcements.
- [ ] P7.4 Test poor network, interrupted uploads, provider rate limits/timeouts, OCR failures and background job recovery.
- [x] P7.5 Run existing portfolio regression tests and production build; verify Admin, Feed, Workstation, AI and Contact remain functional.
- [ ] P7.6 Validate migration backup/rollback, private storage, abuse limits, operational logs and cost controls without logging scripts or secrets.
- [x] P7.7 Prepare tested preview, known limitations, exact release SHA and previous production rollback target. See the 2026-11-17 release record; this applies to the gated foundation release.
- [x] P7.8 User-authorized foundation release deployed on 2026-11-17; domain/routes/public APIs and anonymous access denial verified. Private upload and written-marking acceptance remain separately OPEN.
- [ ] P7.9 Record release evidence and maintenance ownership. Planning or passing static tests alone does not mean the product is complete.

Acceptance: complete flows pass with real configured services; limitations documented; user-authorized release verified.
Evidence / blockers: none yet.

## Pending decisions — resolve during the relevant phase

| Decision | When | Safe working assumption |
|---|---|---|
| Initial subject and exam session | P1–P2 | Verify syllabus first; offer a small reviewed pilot |
| ICAB exam format and passing thresholds | P1 | Verified per subject/session; never invent official thresholds |
| Profile identity provider | P1/P6 | Optional account; inspect existing auth before selecting integration |
| File limits and retention | P1/P4 | Explicit limits and private storage; no indefinite retention by accident |
| AI/OCR provider and budget | P1/P5 | Verify actual capabilities and costs before enabling marking |
| Late/incomplete uploads | P4 | Publish clear server-enforced rules before exam starts |
| Public versus restricted availability | Before release | Preserve existing site audience; scripts/results always private |

## Handoff log

| Date | Owner | Branch / commit | Work and evidence | Blocker | Exact next task |
|---|---|---|---|---|---|
| 2026-11-16 | Codex | main / see this file's Git history | Requirements and phase checklist recorded. Implementation not started. Existing production baseline e744c61; this plan changes documentation only. | None for discovery | P1.1 inspect extension points and current baseline |

## Required handoff template

- Owner / date:
- Branch / commit / working-tree changes:
- Items completed (IDs):
- Evidence (commands, results, reviewed sources, preview):
- Items partially done or blocked:
- Schema / env / service changes (names only; no secret values):
- Deployment state / rollback target:
- Exact next item and how to reproduce:

### 2026-11-16 discovery handoff

- Branch: feature/professional-study-foundation; base main 149626f.
- Completed: P1.1 repository inspection. Architecture findings: docs/professional-study-architecture.md.
- Runtime changes: none; no services, secrets or database changes.
- Next: P1.2 verify the official subject/session matrix, then complete architecture decisions.
- Verification: see commit/PR evidence; production remains unchanged.

### 2026-11-16 assessment research
- Baseline matrix: [docs/icab-assessment-baseline.md](docs/icab-assessment-baseline.md).
- P1.2 PARTIAL: 17 subjects and syllabus durations/formats researched. Session notice details, marks and permitted resources remain unverified; checkbox intentionally open.
- IT Governance duration conflict recorded; no guessed session rules.
- User now authorizes deploy after each tested increment. This release contains documentation only; no Study UI yet.
- Next: finish session rules in P1.2, then P1.3 versioned catalogue.

### User decision — 2026-11-16

The user approved using the researched syllabus baseline as the working implementation format ("confirmed e dhore neo"). Proceed to P1.3 without blocking on session-specific notices. This is product-owner acceptance, not independent ICAB verification. Keep session-specific unknowns labelled; IT Governance may use the detailed syllabus's 210-minute online baseline as a configurable practice default, with item types pending. Do not invent pass marks, allowed resources or official session dates. Next task: P1.3 versioned catalogue and blueprint configuration.

### P1.3 implementation handoff — 2026-11-16

- User's latest instruction overrides earlier automatic deployment permission: DO NOT DEPLOY before further instruction.
- Implemented: shared/study/catalogue.js with 17 stable subject IDs, immutable syllabus version, provenance, and reviewed chapter validation.
- Implemented: shared/study/blueprints.js with immutable session templates, subject-specific formats/durations and incomplete-paper publication blockers. These are configuration utilities, not an exam service.
- Unknown marks/pass rules/resources remain null. IT Governance source conflict remains visible. Platform upload window is distinguished from ICAB rules.
- Tests: test/study-catalogue.test.js checks level coverage, timing exceptions, immutability, missing metadata and chapter provenance.
- P1.3 PARTIAL: chapter structure exists, but reviewed chapter lists/content still need importing. No chapter names were invented. P1.3 checkbox remains open.
- No Study UI, database migration, private upload or grading endpoint added. Existing live website unchanged.
- Exact next task: import reviewed chapter lists by subject/version, then complete P1.3 and proceed to P1.4 database design.

### P1.3 chapter-map progress — 2026-11-16

- Added reviewed syllabus-area navigation for 8 subjects: CL Assurance, Accounting, BTF, MI; PL AA, FAR, ITG; AL Corporate Reporting.
- These are syllabus-area groupings, NOT claims of textbook chapter numbers. Labels are paraphrased; printed PDF pages are recorded with each entry. No study materials are published by this import.
- Remaining 9 subject maps are explicitly pending, so P1.3 remains partial. Next: verify/import remaining maps, then database design P1.4.
- Deploy remains prohibited by latest user instruction. Changes are saved on draft PR #10 only.

### P1.3 completed — 2026-11-16

- All 17 subjects now have 77 reviewed baseline syllabus-area / integrated-skill navigation entries. These are NOT textbook chapter numbers, teaching materials or session confirmation.
- Source: ICAB Syllabus 2023 official PDF; page references retained. Case Study is labelled integrated skills rather than a specification-grid chapter list. Tax and law headings are navigation only, not current legal advice.
- Catalogue and area-map versions are v2; blueprint IDs/versions bumped to v2 so existing v1 templates are not silently replaced.
- Existing draft configuration remains non-publishable until a reviewed paper and its rules exist.
- P1.3 complete at syllabus-area navigation granularity. Future manual-specific chapter imports may be added as a separate content version in P2.
- Next task: P1.4 additive database migration design, ownership, immutable paper/attempt snapshots and rollback plan.
- No deployment, database writes or infrastructure changes.

- P1.3 baseline catalogue now complete: 17 subjects, 77 syllabus areas/integrated skills, versioned templates. Chapter navigation uses reviewed syllabus areas; textbook-specific chapter mapping is future content work. Latest verification: 116 tests passed, build passed, then focused tests passed after template version update. Next task: P1.4 database/schema and migration design. No deployment.

### P1.4 database design complete — 2026-11-16

- Added migrations/study/001_foundation.sql: 17 namespaced PostgreSQL tables, including separate Admin material assets and student script uploads.
- Added docs/professional-study-database.md with ownership/query rules, publication boundaries, transactional submission/job contracts and rollback approach.
- Added scripts/verify-study-schema.mjs for isolated PGlite checks. Passed actual migration execution, table count, account identity constraint, paper immutability, invalid deadline rejection and transactional rollback.
- P1.4 is DESIGN completion only: migration not applied to live Neon; no auth, worker or upload route implemented. No deployment.
- New explicit user requirement: Admin must upload PDF/DOCX/images by level/subject/chapter, save draft, preview and publish. P2.4 includes this and material_assets supports it; upload functionality is not yet delivered.
- Next: P1.5 guest/account retention, deletion and export policies. P1.6 must inspect private storage and worker capabilities before integration.

### P1.5 policy and validation helpers complete — 2026-11-16

- Added docs/professional-study-privacy.md: optional profiles, guest data boundaries, retention defaults, owner-only export, deletion and guest-to-account transfer contracts.
- Added shared/study/privacy-policy.js with policy version, deadlines, owner-checked export allowlist and transfer validation. These are pure helpers, not running services.
- Defaults: guest server records 30 days; local history 90 days best effort; account scripts/OCR 180 days; account results until deletion; abandoned uploads/temporary exports 24 hours; provider backup expiry must be verified before launch.
- Added privacy tests for cross-owner rejection, private-field omission, premature feedback, consent, active-attempt transfer rejection and local-score provenance.
- No retention worker, profile UI, export endpoint or deletion endpoint implemented; do not claim data is currently being expired.
- Next: P1.6 inspect actual private storage, extraction and durable marking capabilities; retain P2.4 Admin-upload requirement. No deployment or live data changes.

### P1.6 capability design and inspection complete — 2026-11-16

- Added docs/professional-study-capabilities.md: read-only inspection evidence, extraction/upload/marking boundaries and unresolved integration gates.
- Installed Blob SDK supports private access, but connected store privacy is unverified. Existing OCR is browser-only. DOCX extraction and durable marking worker are not implemented. Existing Neon Auth env names should be inspected before adding a new provider.
- Added shared/study/capabilities.js and tests: separate fail-closed readiness for Admin materials, student submissions and marking. Helpers do not enable endpoints.
- No resources provisioned, secrets decrypted, real scripts processed or live database changed. No deployment.
- Next P1.7: file/page limits, AI budget controls, retries and failure policy. Private storage/provider/worker runtime verification remains mandatory before P4/P5 release.

### P1.7 resource/cost/retry policy complete — 2026-11-16

- Added shared/study/resource-policy.js with file/aggregate limits, extraction constraints, worst-case grading reservation calculation and bounded retry decisions.
- Added docs/professional-study-resource-policy.md defining numeric defaults, durable quota enforcement requirements, cost settlement, failure states and release tests.
- Added test/study-resources.test.js; total 126 tests passed and build passed. Actual provider prices are not assumed; missing verified price/budget must block dispatch.
- Limits are design defaults and pure validators only; no upload/marking endpoint or worker is enabled. No deployment or live database changes.
- Next P2.1: build lazy-loaded Professional Study navigation and screen. P1.2 session details remain officially unverified; owner-approved baseline allows implementation without inventing current rules.

### P2.1–P4.1 source implementation — 2026-11-16

- Implemented Study/Exam/guest history/Admin UI, 17-subject filtering, materials source/session/review metadata, explicit empty/error states and tax/law verification notices.
- Authenticated Admin text materials support draft/preview/publish/edit/archive; structured question/rubric editor and immutable paper builder are implemented. Portfolio Admin links to /study?view=admin.
- Private direct material-upload/validation/download code is implemented, but P2.4 remains OPEN for connected file-upload acceptance. Created empty private store abdulowahab-study-private (store_4Ra3oy7WqXyEehue, iad1). It is NOT connected; do not create a duplicate. Connector has no existing-store connect operation; no CLI credential is available. No existing public Blob setting was changed.
- MCQ uses actual database guest sessions, server clock/deadlines, answer autosave, flags, owner-scoped resume/submit/results, idempotent start/submission, bounded daily practice and request counters. Answer keys/explanations are withheld until finalization. Expiry is enforced on every write/read; closed-browser status finalizes on next access, not a claimed background scheduler.
- Seed: 13 original study/practice materials; a 3-question CL Assurance pilot; nine original PL/AL written focus papers with explicit marks, suggested model approaches and rubrics. These are NOT full ICAB mocks or complete syllabus content. Full-mock builder requires Admin-reviewed session source, question count, total marks, pass rule, zero-negative-marking rule and baseline duration; do not claim official session verification.
- Added migrations/study/002_learning_runtime.sql and explicit scripts/study-migrate.mjs --apply [--seed-pilot]. Neither migration nor pilot is applied to production.
- Verification: 132 tests passed, production build passed (existing large-chunk warnings). Real PGlite migrations/service/API tests plus React/jsdom clicks cover browsing, MCQ/resume/flag/submit/result and Admin draft save/preview. ZIP validation bounds decompression and rejects entities/macros; signature and rubric checks tested.
- Browser visual/mobile QA remains OPEN: local preview was not reachable by the attached browser. Source implementation checkboxes do not certify browser or connected-service acceptance. P2 overall acceptance/P7 remain pending these gates.
- /api/study is routed through existing /api/content?workspace=study to retain the existing function count. Existing portfolio API tests pass.
- No deployment, no production database writes, no student script uploads or marking enabled. New private store is empty and unconnected.
- Exact next tasks: connect the existing private store with a dedicated STUDY_BLOB_READ_WRITE_TOKEN, verify real upload/download and anonymous denial in an isolated environment; run browser/mobile QA; then P4.2 timed written attempts. Do not deploy without explicit user instruction.
- Full handoff and setup: docs/professional-study-implementation.md.

### P4–P6 runtime and P7 verification handoff — 2026-11-17

- Full technical handoff, configuration names, worker commands, evidence boundaries and exact next actions: [written runtime handoff](docs/professional-study-written-runtime.md).
- Implemented timed written attempts, exact 30-minute upload window, private scoped direct-upload code, receipt/order/question mapping/consent and immutable script manifests. P4.4/P4.6 remain OPEN for real connected Blob acceptance and complete preview/layout verification. DOCX logical pagination is explicitly disclosed.
- Implemented bounded PDF/DOCX extraction and local English/Bangla OCR, durable leased marking worker, structured rubric grading adapter, exact-quote/score checks, transactional worst-case budgets, reviewer correction/recheck and private feedback UI. P5.1–P5.3 remain OPEN for real provider/storage/worker acceptance; P5.7 calibration is OPEN. OCR is always review-only. Fixture grading is NOT calibration.
- Implemented optional existing Neon Auth integration, verified-JWT ownership, explicit guest transfer, score/topic/error/recency history, paginated full export, immediate access deletion and retryable physical-file retention. P6.1/P6.6 remain OPEN for real provider cross-device acceptance and scheduled worker installation. Study deletion does not delete the external sign-in account.
- Actual isolated SQL/service/API and React flows verified; synthetic printed-image OCR returned the exact text (confidence 95), with review still required. No genuine student scripts or real AI calibration corpus were available. Exact final automated totals are recorded below after the final verification.
- Browser/device QA remains OPEN: browser download failed in this environment; no screenshot or real Safari/Android sign-off is claimed. Migration versions 1–3 are local-test only.
- Existing private store remains unconnected; no secret changes, no live database writes, no deployment. Existing portfolio behavior is covered by regression tests.
- Next: connected-store upload/privacy verification, real Neon login/two-device checks, install and test worker/retention schedules, human calibration, browser/mobile/accessibility checks. These acceptance gates cannot be marked complete from source or fixtures alone.

- Final verification: 144 automated tests passed, no skips/failures; production build passed; git diff --check passed. Connected services, calibration and browser/device acceptance remain open. Current operational handoff: [written runtime/setup](docs/professional-study-written-runtime.md).

### User-authorized foundation release — 2026-11-17

- New instruction: “deploy koro”; supersedes the earlier hold for this release. PR #10 merged into main. This is a gated foundation release, not completion of every phase.
- Full release/rollback/verification record: [2026-11-17 release](docs/professional-study-release-20261117.md). Source f001ebdc38756c89d6b2ee26693e301620c2192f includes a five-column navigation correction found during desktop verification.
- Study migrations 1–3 applied and original pilot seeded through a one-off Vercel build command, using the existing configured database. No credentials were retrieved or exposed. Later production builds use npm run build only; no permanent build-time migration was added. Existing non-Study tables were not migrated.
- Real connected desktop flow: material browsing, MCQ start, answer save, flag, leave/resume, submit, exact 1/3 result, explanations and guest progress. Production APIs returned 13 materials and 10 labelled pilot papers; anonymous Admin/history returned 401. Missing private storage rejected written start BEFORE its timer could begin.
- Written private store remains unconnected; AI calibration, optional account/JWKS verification, durable marking/retention schedules, full syllabus/session papers and iPhone Safari/Android acceptance remain OPEN. No token, provider-budget flag or calibration flag was fabricated to enable them.
- Exact next work: connect and verify the existing private store, real optional login and scheduled operations; obtain calibration scripts; perform mobile/device acceptance. Recheck this record and live Vercel metadata before another release.
