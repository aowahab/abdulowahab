# Professional Study foundation release — 2026-11-17

User authorization: “deploy koro” on 2026-11-17, Asia/Dhaka. Earlier deployment holds are superseded for this release only. No recurring deployment was enabled.

## Release identity

- Repository/project/team: aowahab/abdulowahab; Vercel abdulowahab, prj_1vCkgUuaxpNp5KMasgYKtx3f5EDN, team_XOmJgviaTuTDR1m5bishpKRy.
- Tested feature commit: a1e8c4a98398c20e4e81e8a4f8c032decc3f7669. GitHub CI run 78 passed; local suite 144/144 and build passed. Final receipt correction also passed 12 focused written tests.
- PR #10 merge/main commit: 5f5e266a48618cc9e54d88b145ac7d73155d679f. Its tree exactly matched tested tree ed7df035c95ec76ee82fc0f3764df1599a18fc4d.
- Follow-up source: f001ebdc38756c89d6b2ee26693e301620c2192f. Only src/style.css changed to keep the five destinations in one desktop/mobile grid row. This fixed wrapping observed in the live desktop browser.
- Final production deployment: dpl_71ZTS7fsLCqiM6mjeaQ6yuh5QXNf; abdulowahab-7gut1ip4x-tickydo.vercel.app. Public domain: https://aowahab.vercel.app/study.
- Initial production foundation deployment: dpl_8Q7XDRrrrpM91kDis3NhPC4qWReg, source 5f5e266.
- Previous pre-Study rollback: dpl_dskJJKnyAmiANyUXm4RXExK8Qx4s, source 65583b787ca73ba581e74553e81dd9d557a87bfa. Additive Study schema can remain if reverting code; do not drop it or delete learner records as part of a code rollback.

## Database and verification

The staged deployment dpl_BnHYXhHEtA7YuLmPtw55ZVogP2yW used the existing configured database with a one-time command: node scripts/study-migrate.mjs --apply --seed-pilot followed by npm run build. Logs confirmed schema versions 1, 2 and 3 and original pilot seeding. These changes are confined to the new study schema; existing portfolio/ERP tables were not migrated. No database credential was read back or written to Git. Subsequent production builds use npm run build, with no automatic migration in repository configuration.

Real browser flow verified on the connected staged app: published material filters, MCQ start, server-saved answer and flag, leave/resume, final submission, exact 1/3 fixture result, every-choice explanations, area recommendations and guest progress. This test created only a synthetic guest attempt, not a personal account or student script.

Production checks: materials 200 (13 originals), papers 200 (10 labelled pilots, no answer-key/model-answer leak), anonymous Admin/history 401, content/feed/tickytools/admin page responses 200. Written start with missing private storage displayed a setup error before starting a timer. Desktop visual verification identified and corrected the five-button navigation wrap. A real Safari/iPhone or Android acceptance run has NOT been completed.

Runtime error scan on the initial production deployment showed PostgreSQL connection-string SSL deprecation warnings on stderr, with successful application responses. These are not evidence of failed queries; do not weaken certificate verification to silence them. Actual runtime was nodejs26.x because the package engine allows >=22, despite the deployment request setting 22.x. The tested connected flow passed on that runtime; pinning a supported major remains a future maintenance choice.

## Gated capabilities and operations

Private written uploads/material attachments, calibrated AI marking, optional account server verification and hosted marking/retention schedules remain incomplete. The dedicated private store already exists (store_4Ra3oy7WqXyEehue) and must be connected and tested; do not create a duplicate. No secrets, provider pricing, storage-verification flag or calibration approval were fabricated. Complete official/session-specific full-paper banks are also pending; pilots are not full ICAB mocks.

No deployment schedule or automatic Git deployment was enabled. The canonical checklist records remaining acceptance gates. Follow docs/professional-study-written-runtime.md for required configuration names and worker commands; its pre-release “not applied/deployed” statements are historical and superseded by this release record.

This release-record commit changes documentation only. Deployed application source is f001ebdc38756c89d6b2ee26693e301620c2192f, even if main contains a later documentation checkpoint.
