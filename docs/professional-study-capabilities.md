# Private upload, extraction and marking capabilities (P1.6)

Inspected 2026-11-16. Read-only project metadata and repository inspection; no credentials read/decrypted, files uploaded, providers provisioned or live scripts processed.

## Evidence and limits

| Capability | Evidence | Remaining work |
|---|---|---|
| Relational metadata | pg installed; DATABASE_URL/POSTGRES_URL names exist in preview and production | Apply reviewed study migration to isolated environment first; verify role and ownership |
| Student identity | NEON_AUTH_BASE_URL and VITE_NEON_AUTH_URL names present | Inspect existing Neon Auth before selecting another provider; do not assume these values mean student login works |
| Private Blob SDK | Installed @vercel/blob 2.9.0 declarations support private client upload and authenticated get/presignUrl | Verify connected store access mode and project scope; do not reuse public content storage for private scripts |
| Connected Blob store | BLOB_READ_WRITE_TOKEN name present | No store ID/access metadata available from inspected project env names; private mode not verified |
| Admin uploads | api/upload.js authorizes Admin media; lib/store.js writes public JSON | Separate study-material metadata, validation, draft/publish and level/subject/chapter selectors |
| PDF | src/pdfRender.js uses PDF.js in browser | Build server-side text extraction and scan rendering for submitted scripts; avoid assuming browser worker code runs in a function |
| OCR | src/PdfOcr.jsx runs local Tesseract, English/Bangla, three-page limit | Private submission OCR/extraction and low-confidence review workflow absent; handwriting quality unverified |
| Word | JSZip/XML tools installed for other tasks | No reviewed DOCX extraction pipeline; enforce archive limits and safe XML; legacy DOC needs explicit conversion |
| Images | Browser image tools exist | Validate signatures, page dimensions, ordering and orientation; preserve source for review |
| AI | GROQ_API_KEY name present in production only; conversational helper exists | Preview grading configuration, privacy terms, vision/OCR suitability, structured rubric output and calibration not verified |
| Durable jobs | Schema design includes marking_jobs | No operational worker/dispatch/lease recovery; do not run grading as a fragile fire-and-forget request |

Integration listing showed a Neon installation but no selected project links in that result; environment names are stronger evidence of project configuration, not proof of connectivity. No new duplicate store/database/auth provider was created.

## Chosen implementation boundaries

1. Browser sends files directly to an inspected private store using short-lived server-authorized tokens. The authorization endpoint checks session, attempt, file type/bytes and upload deadline; it never grants arbitrary paths or public access. Retain original script ordering.
2. A trusted completion handler validates store/object identity, owner, actual file signature and server receipt time. Finalization stores a stable accepted-object manifest and queues the marking generation in one database transaction.
3. A durable worker fetches authorized private objects, extracts PDF/DOCX/image content, emits transcription with page references and flags uncertainty. Render/OCR untrusted documents under resource limits. Do not execute macros, external links or embedded instructions.
4. The grading provider receives only required script/rubric context after the disclosure/consent flow. It has no Admin or external-action tools. Do not send full private inbox/public portfolio context. Provider retention terms must be checked before real scripts are sent.
5. A deterministic validator reconciles marks and bounds; poor transcription or conflicting criteria goes to review. Store model/rubric/input digest provenance. Show result only after owner authorization and successful finalization.
6. Database job leases and fencing prevent duplicate/late worker completions, including after deletion. A jobs table alone is not a worker. Select an actual durable trigger/worker after provider inspection; no new queue provisioning in this phase.

## Admin materials versus answer scripts

Admin may upload PDF/DOCX/images against CL/PL/AL, subject and chapter. Assets remain draft/private while reviewed; publishing explicitly grants learner access through a controlled material delivery path. Public reuse is optional and must never include student scripts. Store version, source/licence and attachment metadata; edit by new revision. Publishing a material must not expose answer keys or marking rubrics for an active paper. Student scripts are always owner-private.

## Fail-closed readiness contract

shared/study/capabilities.js defines separate readiness gates for Admin materials, written submissions and written marking. Only trusted verified evidence may set a flag true. It is not wired into a live API yet and is not evidence that a capability works. Current inspection intentionally enables none of these features.

## Handoff

P1.6 design/inspection is complete, but private store, provider quality and durable job operation remain integration gates for P4/P5. Next P1.7: numeric file/page/usage limits, cost controls, retries and error policies. Later implementation must test real isolated services end-to-end before enabling learner uploads or marking. No deployment authorized.
