# Portfolio Phase 1–7 verification register

This is an implementation/verification register, not a claim that all phases are finished. Source of truth: production deployment and automated checks.

| Phase | Workstream | Implemented | Remaining verification / work |
|---|---|---|---|
| 1 | Foundation and production baseline | Vite/React site, Vercel routing, CI workflow, production domain | Full regression across desktop/mobile browsers |
| 2 | AI assistant and accessibility | AI endpoint, client confidentiality guardrails, route navigation and keyboard styles | Prompt-injection, latency, provider failure and keyboard/screen-reader end-to-end tests |
| 3 | Accounting career profile | ICAB PL wording, audit industry exposure, experience and responsive profile | Content review and confirmation that no confidential client identity appears |
| 4 | Updates and Feed | Newest-first full-post social feed, image containment, admin content | Real mobile media visual checks and large-post performance |
| 5 | Workstation | Interactive accounting/audit tools and ERP links | Input/output validation, exports and financial accuracy review per tool |
| 6 | Contact and appointments | Enquiry/appointment pages, notification API | End-to-end delivery, anti-spam and privacy/consent tests |
| 7 | Analytics, security and launch | PostgreSQL visitor session/online counters, footer placement, Vercel production | Real-time counter checks, rate limiting, security audit, Lighthouse and browser matrix |

## Release gate

A phase is complete only when its implementation, tests, preview validation, and production smoke checks are verified. No fake visitor counts, no named audit clients, and no claim of qualified CA status. Maintain a rollback path before each production promotion.

## Current release

Production was updated on 2026-11-14 to deployment dpl_93gWuy7KFkuSXfg7TTbUBosz3mBh, commit defed9e63b0089be0046310ab9d14c83a3da84f0. Vercel returned READY and the aowahab.vercel.app alias was confirmed to target that deployment. This is not proof that all seven phases are fully verified. Subsequent test-only commits must pass CI before any further release.

## Pre-deployment checklist (2026-11-14)

- [x] Code saved to a dedicated integration branch; production remains unchanged.
- [x] SEO metadata correctly describes Accounting and ICAB Professional Level.
- [x] Traffic endpoint rejects invalid/oversized visitor payloads before touching database.
- [x] Traffic counts are queried in one request; counter endpoint has no-store/noindex headers.
- [ ] Latest integration branch CI must finish successfully after all commits (prior production commit defed9e6 passed; newer security regression tests pending CI).
- [ ] Test the real visitor counter against connected Neon PostgreSQL and verify two-minute online expiry.
- [ ] Verify AI assistant overlay does not cover counters on narrow phones and desktop using screenshots.
- [ ] Test admin login, session expiration, uploads and permissions with real configured services.
- [ ] Confirm WhatsApp contact and appointment notification delivery with consent.
- [ ] Complete accounting tool calculations, error-handling, exports and accessibility review.
- [ ] Conduct performance, accessibility, browser and privacy/security regression tests.
- [ ] Production deployment only when user-authorized and Vercel daily quota allows, followed by smoke tests.

**Important:** Automated static checks alone cannot establish that a phase is fully complete. Production deployment succeeded after the earlier quota issue; do not redeploy untested commits. Added direct API tests for malformed visitor sessions, cross-origin admin login and missing enquiry consent. Browser visual, configured-service and notification delivery checks remain outstanding.

## Additional API regression (2026-11-14)

- Enquiry endpoint now rejects JSON `null`, arrays and request bodies over 4,000 characters without a trusted Content-Length header. Previously `null` could trigger an unhandled property access; the fix returns HTTP 400.
- Added executable tests for malformed enquiries and unavailable WhatsApp credentials (HTTP 503; no false delivery confirmation).
- Branch commits: `31f1e5c` and `4703722`; CI must be checked for the latest head before release.
- **Still not verified:** real WhatsApp delivery, live Neon presence expiry, admin session/upload integration, AI provider failure handling, browser/mobile visual checks and tool numerical correctness. No production deployment is authorized solely on the basis of these tests.
