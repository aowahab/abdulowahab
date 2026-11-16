# Professional Study — delivery plan and handoff checklist

Last updated: 2026-11-16 (Asia/Dhaka)
Repository: aowahab/abdulowahab
Canonical checklist: `PROFESSIONAL_STUDY_PLAN.md` on main.
Scope: a separate Professional Study section within the existing portfolio, with Study, Exam and My Progress.
Status: P1 discovery started; P1.1 complete. No study platform implementation has been verified.
Owner: Codex (discovery completed). Next task: P1.2.
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
- Preserve existing live portfolio behavior. User authorized deployment after each completed, tested increment on 2026-11-16.

## How to use this checklist

1. Read this file and current main before starting. Inspect AGENTS.md if present.
2. Claim one item in the handoff log with owner, branch and starting SHA.
3. Work on a focused branch from current main. Keep secrets and student scripts out of Git.
4. Mark an item [x] only after its acceptance evidence is recorded. Partial or blocked work stays [ ].
5. Record tests, preview URL if available, commit, limitations and exact next task before handing over.
6. Recheck current deployment and main before any release. Deployment of completed tested increments is authorized; verify target and release checks.
7. Keep this single document current; link other technical documents rather than creating conflicting checklists.

## Phase overview

| Phase | Deliverable | Depends on | Status |
|---|---|---|---|
| P0 | Scope and handoff register | None | Plan recorded |
| P1 | Verified syllabus and architecture | P0 | Not started |
| P2 | Study section and content management | P1 | Not started |
| P3 | Timed MCQ exams and instant feedback | P1, P2 | Not started |
| P4 | Written exams and script submission | P1, P2 | Not started |
| P5 | Written marking and learning feedback | P4 | Not started |
| P6 | Optional profiles and progress | P3, P5 | Not started |
| P7 | Full verification and controlled release | P2–P6 | Not started |

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
- [ ] P1.6 Design private file storage, signed uploads, PDF/DOCX/image extraction, OCR, asynchronous marking and provider integration using existing resources where suitable.
- [ ] P1.7 Specify file/page limits, AI cost controls, rate limits, failure handling and job retry policy before implementation.

Acceptance: reviewed architecture and verified subject/session matrix; migration and rollback design; no mock integrations presented as working services.
Evidence / blockers: P1.1 findings recorded in [architecture discovery](docs/professional-study-architecture.md). Remaining P1 items are open.

## P2 — Study and content administration

- [ ] P2.1 Add responsive Professional Study entry and Study / Exam / My Progress navigation without breaking existing routes.
- [ ] P2.2 Implement CL / PL / AL → subject → chapter filters and empty/loading/error states.
- [ ] P2.3 Display materials, explanations, worked calculations, revision notes and practice questions.
- [ ] P2.4 Extend authenticated Admin with draft, preview, publish, edit and archive for materials/questions/rubrics.
- [ ] P2.5 Store source, session, syllabus version and last verification date with technical content; flag stale tax/law material.
- [ ] P2.6 Use original or permitted content; distinguish original practice questions from official past questions.
- [ ] P2.7 Seed an explicitly labelled, reviewed pilot module; show unavailable subjects honestly.

Acceptance: Admin-published content appears under correct filters; unpublished content remains private; mobile, keyboard and regression checks pass.
Evidence / blockers: none yet.

## P3 — MCQ exam engine

- [ ] P3.1 Build paper selection by level, subject, session and practice/full mock mode, using published reviewed questions.
- [ ] P3.2 Show duration, marks and rules before start; navigation, unanswered counts and review flags during exam.
- [ ] P3.3 Persist attempt deadline and autosaved answers server-side; refresh/device clock changes must not extend exam time.
- [ ] P3.4 Implement manual submission, expiry submission, reconnection behavior and idempotent finalization.
- [ ] P3.5 Keep answer keys and explanations server-side until the attempt is finalized.
- [ ] P3.6 Return immediate deterministic score with selected/correct answers and explanations for every question.
- [ ] P3.7 Generate topic breakdown and specific revision recommendations; avoid unsupported readiness claims.

Acceptance: known fixtures produce exact scores; timer/refresh/disconnection/double-submit tested; correct answers cannot be fetched early.
Evidence / blockers: none yet.

## P4 — Written exam and 30-minute submission window

- [ ] P4.1 Prepare reviewed PL/AL papers with subquestion marks, rubrics, model answers and subject/session-specific rules.
- [ ] P4.2 Start immutable server-side exam and upload deadlines; upload deadline = exam deadline + 30 minutes.
- [ ] P4.3 Switch from writing to upload state at exam end; explain that off-device writing cannot be technically prevented.
- [ ] P4.4 Accept PDF, DOCX and multiple image pages, with preview, ordering, question mapping and upload receipt.
- [ ] P4.5 Handle legacy .doc only with safe supported conversion; otherwise give a clear DOCX/PDF conversion message.
- [ ] P4.6 Support reliable signed direct uploads beyond function request limits; validate MIME/signature, size/page limits and access.
- [ ] P4.7 Define upload-start versus upload-completion cutoff; enforce late submission and retry rules on the server.
- [ ] P4.8 Store private immutable submitted script version; prevent cross-user access and accidental public Blob exposure.

Acceptance: server enforces the exact 30-minute window; mixed page uploads preserve order; expired/invalid/unauthorized submissions fail clearly.
Evidence / blockers: none yet.

## P5 — AI practice marking and feedback

- [ ] P5.1 Extract PDF/DOCX text and OCR images/scans; detect missing/unreadable pages and allow review.
- [ ] P5.2 Build private asynchronous marking jobs with queued/running/completed/review-required/failed states, retries and duplicate protection.
- [ ] P5.3 Mark per subquestion against versioned rubric; award workings, partial credit and valid alternative methods.
- [ ] P5.4 Enforce score bounds and total reconciliation; validate calculations with deterministic checks where feasible.
- [ ] P5.5 Show criterion-level evidence, lost marks, corrected solution, improved answer structure and next learning actions.
- [ ] P5.6 Treat scripts as untrusted data: embedded instructions cannot change rubrics, reveal secrets or run tools.
- [ ] P5.7 Calibrate against manually reviewed scripts; measure disagreements, transcription confidence and failure modes before enabling full use.
- [ ] P5.8 Label marks as AI practice estimates; support recheck requests and reviewer overrides with an audit trail.
- [ ] P5.9 Store rubric/model versions and grading inputs securely so results can be reproduced or explained.

Acceptance: reviewed calibration set, readable feedback and reconciled marks; unreadable scripts enter review; provider outages do not lose submissions.
Evidence / blockers: marking provider/storage/worker design not yet verified.

## P6 — Optional profiles and progress

- [ ] P6.1 Implement optional sign-in and private ownership checks; guest access remains available.
- [ ] P6.2 Offer guest local history and downloadable results; explain device/storage limitations.
- [ ] P6.3 Allow explicit migration of guest history to account without duplication; never trust guest scores as server-verified marks.
- [ ] P6.4 Show attempts, saved scripts, feedback, level/subject/topic performance and score trends.
- [ ] P6.5 Recommend revision from coverage, repeated errors, recency and time use; label insufficient evidence.
- [ ] P6.6 Provide export/delete controls, retention policy and secure account/session handling.
- [ ] P6.7 Test isolation between two users and guest/account transitions.

Acceptance: account history works across devices; private scripts are isolated; guest learning needs no account; recommendations cite actual attempts.
Evidence / blockers: none yet.

## P7 — Verification, release and operations

- [ ] P7.1 Run unit/integration checks for scoring, deadlines, upload cutoffs, authorization and grading state transitions.
- [ ] P7.2 Complete end-to-end MCQ flow and PL/AL written flow through upload, marking, feedback and progress.
- [ ] P7.3 Test iPhone Safari, Android and desktop; keyboard navigation, contrast, reading order and accessible timer announcements.
- [ ] P7.4 Test poor network, interrupted uploads, provider rate limits/timeouts, OCR failures and background job recovery.
- [ ] P7.5 Run existing portfolio regression tests and production build; verify Admin, Feed, Workstation, AI and Contact remain functional.
- [ ] P7.6 Validate migration backup/rollback, private storage, abuse limits, operational logs and cost controls without logging scripts or secrets.
- [ ] P7.7 Prepare tested preview, known limitations, exact release SHA and previous production rollback target.
- [ ] P7.8 Deploy completed tested increments under the user's standing instruction; then verify domain mapping, routes, APIs and private file access.
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
