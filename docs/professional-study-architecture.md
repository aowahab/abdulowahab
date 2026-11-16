# Professional Study: repository discovery and architecture

Status: discovery only; 2026-11-16. No routes, database or production settings changed.
Base: main 149626f1ac4ce01e3f2f646d37e4b5f547097fe8.

## Verified extension points

| Area | Current implementation | Planned extension |
|---|---|---|
| Navigation | src/main.jsx initialPage, mobilePages, mobileDestinations, mobileNavigate; custom history navigation | Lazy-loaded study module, /study route and internal Study/Exam/Progress tabs; preserve existing routes |
| Hosting | vercel.json route rewrites and path-specific security headers | Add /study and nested study routes; review CSP for actual upload provider |
| Public content | api/content.js, lib/store.js, lib/portfolio-content.js; Blob JSON | Keep learning records separate; publish only reviewed learning content |
| Administration | admin.js, admin.html; api/login.js, lib/auth.js | Reuse authenticated admin boundary for material/question publication; do not grant students admin rights |
| Persistence | pg dependency; PostgreSQL used in api/leads.js and ERP | Add namespaced study tables with explicit migrations; preserve ERP and leads |
| Uploads | api/upload.js issues admin-only Blob client upload tokens; store.js writes public content | Separate private student upload authorization; never put scripts into public content or public upload URLs |
| AI | api/assistant.js and lib/groq-chat.js provide conversational text | Dedicated grading pipeline with rubric validation; public chat must not access scripts |
| Tests | npm test runs test/*.test.js and erp/test/*.test.js; npm run build uses Vite | Add meaningful deadline, marking, ownership and migration tests as code arrives |

## Recommended boundaries (design, not implemented)

- src/study/: lazy-loaded interface and local guest history. Avoid loading PDF/OCR dependencies on the portfolio home page.
- lib/study/: validation, paper snapshots, deterministic scoring, deadline transitions and rubric checks.
- api/study.js: scoped route dispatch if Vercel function limits require consolidation; validate server authorization per action.
- migrations/study/: explicit additive SQL migrations; no runtime destructive migration or schema reuse of ERP tables.
- Public catalogue must never include unpublished material, answer keys or rubrics for active exams.
- Database ownership checks use a server-validated student session or restricted guest attempt credential. Admin cookies are never student identity.

## Proposed records

Versioned syllabus/subject/chapter -> materials and reviewed question revisions -> published paper snapshot -> attempt -> responses/uploads -> marking job -> rubric-level feedback.
Account identity is optional, but server-side exam state and ownership are required for trustworthy timed exams.
Guests may keep local history; local results are not authoritative server marks. Account migration requires explicit consent and provenance.
Question/rubric/paper revisions used in a submitted attempt must remain immutable even after an Admin edits later content.

## Deadline and submission contract

- Server records exam_started_at and exam_deadline once. Client clock and refresh never extend them.
- At exam_deadline, freeze MCQ answers; written papers enter upload-only state.
- Written upload_deadline = exam_deadline + 30 minutes. Publish rules before exam starts.
- Upload authorizations bind owner, attempt, allowed types, byte limits and expiry. Completion callbacks must verify ownership, object identity and receipt timing before finalization.
- Server finalization is idempotent. Unfinished uploads have an explicit expired/incomplete outcome.
- Offline writing cannot be prevented by a browser; do not claim proctoring.

## Private files and marking

Existing public upload/content storage is unsuitable for private scripts. Verify private Blob capability in the connected project before implementation; do not provision duplicate resources without inspection.
Use direct signed uploads, short-lived authorized reads, explicit retention and deletion, and no raw scripts in logs.
Validate actual file signatures, page/size limits and safe extraction; DOCX archive expansion needs resource limits. Legacy DOC needs a supported converter or a clear conversion request.
Marking needs a durable queue/job mechanism, bounded retries and usage limits; inspect available configured resources before provider selection. No claim that public chat already marks scripts.
Treat OCR/scripts as untrusted data. Low-confidence transcription enters review; marks reconcile to rubric totals. AI output never becomes final solely because it contains plausible JSON.

## Decisions still outstanding

1. P1.2: verify current official ICAB subjects and exam rules per target session; older documents conflict.
2. Student identity/session integration and guest attempt credentials.
3. Connected private file store, durable marking execution and actual OCR/AI capabilities/budget.
4. Retention, upload limits, late-upload rule and manual marking calibration set.
5. Complete schema/migration/rollback design after the syllabus matrix is verified.

## Next developer

Continue P1.2 in PROFESSIONAL_STUDY_PLAN.md. Do not mark P1 complete: only repository discovery is complete.
No infrastructure provisioned, environment values retrieved, database migrations applied or site deployed in this change.
