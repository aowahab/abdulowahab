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

Last verified production promotion prior to this register: Vercel deployment dpl_AemiLeWxFAZ8b73UqYRKNVeRKXVF, commit bb272aba86037a320a1e449c1347002fc4794295. This register identifies gaps and does not mark all seven phases complete.
