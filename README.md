# Abdul Owahab portfolio

React and Vite portfolio preserving the production layout, editable content, full footer, visitor statistics and Admin access, with optional project case studies. Vercel Functions serve the API; Blob stores portfolio content and PostgreSQL stores enquiries and ERP records.

## Local development

Use Node.js 22 or newer. Run `npm ci`, `npm run dev`, `npm run build`, and `npm test`. Vite serves the frontend; API-backed flows require Vercel Functions or a suitable local API server.

## Pages

- `/profile` (or `/`): original profile layout, editable sections and additional project case studies.
- `/feed`: full chronological feed with compact photos and full-size image links.
- `/consultation`: combined professional enquiry form with optional meeting date/time.
- `/workstation`: original applications, calculators and resource directory, plus sample ERP screenshots.
- `/appointment`: compatible link to the same form with meeting fields enabled.
- `/admin`: password-protected editor, linked from navigation and footer.
- `/erp/`: accounting application with separate authentication.

Four-destination navigation with one Contact / Meet button, footer columns and server-backed visitor-session/online statistics are preserved. `/contact`, `/resources` and `/erp-preview` remain compatible aliases. Existing visitor records are not reset by deploying this code.

## Editable content

The editor controls the profile introduction, CV URL and date label, project case study descriptions, profile sections, social links and updates. `shared/profile.js` and `shared/projects.js` supply defaults for older saved content. Profile sections with IDs `about`, `experience`, `practice` and `education` fill the corresponding homepage sections. All saved sections remain visible, including `qualification`, `projects` and `venture`. Structured project case studies appear after the editable Projects section; existing Admin section edits continue to render.

The CV button is hidden until an approved CV URL is configured. Upload a PDF in the editor and paste its public Blob URL into the CV field. Updating profile text does not regenerate a PDF. Public previews contain illustrative data only.

## Vercel setup

Connect a Blob store (`BLOB_READ_WRITE_TOKEN`) and set `ADMIN_PASSWORD` for the portfolio editor. PostgreSQL (`DATABASE_URL` or `POSTGRES_URL`) is required for enquiries. ERP database and authentication requirements are described in `erp/README.md`. Notification and assistant integrations are optional and require their own configured credentials. Never commit environment files.

Git-triggered deployment is currently disabled in `vercel.json`; deployments must be initiated explicitly. Deploy the reviewed commit to a preview, verify it, then release to production when intended.

## Verification

`npm test` covers portfolio session parsing, content compatibility and normalization, and ERP authentication, database and finance behavior. Browser checks cover desktop/mobile routes, overflow, menu interaction, legacy URLs, optional meeting fields, and form success/reset with a mocked API response. Actual delivery to the production private inbox must be checked on the deployed environment.

## Professional News Feed

`/feed` includes personal posts and an Audit / Accounting / Tax / VAT headline panel. `/api/news` reads publisher RSS feeds from The Daily Star (Tax and Customs), The Business Standard (Economy), IFAC, and Accounting Today. Each headline shows its publisher, publication date, topic and region, with a link to the original article. International and US stories are labelled separately from Bangladesh news; they do not establish Bangladesh law.

The panel refreshes every 15 minutes while visible. The server caches successful results for 15 minutes, filters out stories older than 90 days or undated items, deduplicates headlines and caps the list at 40. Source timeouts and failures show a partial/unavailable state; no fabricated headlines are substituted. Coverage depends on the publishers' available RSS entries. Original NBR, ICAB and IFRS links are provided for checking authoritative notices.

The scrolling headline strip supports pause, hover/focus pause and reduced-motion preferences. Personal-post photos use square `object-fit: cover` thumbnails. Clicking a photo opens its original full-resolution file.

## TickyTools

Dedicated `/tickytools` workspace with category and tool dropdowns. Heavy libraries load only when selected. Existing audit calculators and checklists remain available.

- PDF: image conversion, merger, PDF to PNG/JPEG, reorder/rotate/delete, extract/split, crop, watermark, page numbers, password protection/unlock with a known password, form fill/flatten, selectable text extraction, scanned-PDF compression, and English/Bangla scan OCR.
- PDF Studio: opens as an expanded app workspace with a toolbar, page sidebar/navigation, zoom, hand pan, selection, drag-to-move, shape/signature resizing, selected-item colours and text properties, delete, and 50-step undo/redo. Export edits from the same workspace. Existing tool categories remain available through All tools.
- The Studio sidebar now contains all 16 additional PDF tools, grouped by task. Each opens with a local working copy of the current document including edits. Results download locally; PDF results can be explicitly loaded back into the editor to chain operations. The original edit history remains until the user replaces the document. Password-protected copies are download-only; Unlock accepts an existing password. Existing standalone entries remain compatible.
- Editor: add text, highlights, shapes and visual signatures. Permanent redaction rebuilds raster pages without underlying selectable text. This removes forms, links and text selection. Existing text is not rewritten; visual signatures are not certified digital signatures.
- Images: crop with mouse/touch or pixel fields, crop ratios, linked or independent output width/height, JPG/JPEG/PNG downloads, quality controls and maximum-KB targets. JPG encoding searches for the highest fitting quality; PNG stays lossless. Exact pixel dimensions are retained unless the user enables smaller dimensions. The actual size and target status are shown before download; impossible targets are not reported as met. PNG transparency is retained, while JPEG uses a white background. No image data is uploaded.
- Excel: merge XLSX files into separate sheets or stack matching headers. Values, saved formula results, dates and number formats are retained; macros, charts and layout are not copied.

Documents are processed in browser memory. The tools route disables the portfolio AI, visitor tracking and content API; route CSP blocks off-site connections and form submissions. PDF workers, fonts, OCR engine and language models are served locally. OCR caching is disabled. Documents are not sent to an API or retained in browser storage. Downloads are saved only at the user's request. This is not a guarantee against compromised browsers/devices.

OCR accuracy must be reviewed. The first OCR use downloads its local engine and language assets. Large-file/page limits protect browser memory. This suite does not claim full Adobe Acrobat feature parity.

Validation: unit tests, production build, real browser exports using synthetic PDFs/XLSX/forms, independent PDF text/encryption inspection, desktop/mobile layout, and request/storage monitoring under the route CSP.

## Audit workpapers

TickyTools includes 22 browser-only audit workpapers: planning, materiality, risk/assertions, binomial attribute sampling, TB mapping, lead schedules, analytical review and financial ratios, bank reconciliation, ageing, two-source ledger reconciliation, journal screening, cut-off, inventory/NRV, depreciation, payroll, monthly loan schedules, fixed-payment lease liability/ROU schedules, confirmations, local evidence metadata/SHA-256 indexing, misstatements, starter disclosures and completion/review tracking.

Editable tables support mapped CSV/XLSX import and XLSX workpaper export with inputs, parameters, results, summary and method notes. Formula cells use cached results only; missing cached results are rejected. Source hyperlinks/macros are not executed. Work stays in memory, with unsaved-work prompts; no audit data is uploaded or persisted in browser storage. Checklists are configurable starters, and calculators state their methods and scope. Currency conversion, full statutory payroll/tax determination, variable/modified lease modelling and automatic audit conclusions are not provided.

Standalone PDF tool cards are removed from the directory. PDF Studio is the single PDF entry and retains all integrated PDF tools.


### Assistant workspace

The assistant is text-only. It has no attachment picker and refuses file payloads at the research endpoint. Relevant chat requests reveal a contextual action; there is no permanent capability menu. File operations link to the separate same-origin TickyTools workspace, where processing stays local. Deep links select the requested PDF, spreadsheet or audit tool.

Web research uses the installed AI SDK and the existing server-side OpenAI configuration (`OPENAI_API_KEY`, optional `OPENAI_RESEARCH_MODEL`). It forces hosted web search, requests disabled response storage, limits output to 100 words and displays safe HTTPS source links. A small per-instance research throttle limits repeated requests; it is not a global billing control. Public profile lookup uses the portfolio and the owner-approved LinkedIn/Facebook URLs. Inaccessible social profiles and unknown personal facts must be reported as unknown. The website cannot read ChatGPT saved memory. Client identities remain confidential, including visitor-supplied guesses.

Admin operations require the existing signed session on every server request; claims made in chat grant no privileges. The private workspace loads enquiries, analyzes only an explicitly selected enquiry, reviews text edits before saving, and records a reviewed appointment slot. Private answers are excluded from subsequent public chat/model context. Website edits check the loaded content version before saving (the underlying Blob store does not provide transactional compare-and-swap). Appointment confirmation uses a database transaction and advisory lock to reject overlaps. It records a private schedule entry only; it does not send emails, calendar invitations or external confirmations. No credentials, database resets or external notifications were changed.

Validation uses provider/write mocks for browser flows and exercises signed-session rejection, explicit review, stale text versions, appointment conflicts, concise research, source filtering and absence of upload controls. Live model retrieval depends on the configured provider. Real private inbox writes, website saves and appointment confirmations are tested with mocks rather than modifying owner data during verification.

Conversation continuity now forwards up to 32 recent public messages within a 48 KB text budget, excluding private Admin answers and metadata. The backend preserves the same window and instructs the model to track goals, corrections, supplied details and open questions. Short follow-ups resolve to the latest relevant topic; a clear new topic takes precedence. The basic fallback also progresses recruitment questions using explicitly supplied role/organization details. This is current-chat context, not persistent or cross-visitor memory. New chat clears it. Validation covers fragment resolution, topic switching, recruitment slot progress, privacy exclusions, bounded payloads and extended provider history with a mocked provider.

### Groq chat provider

Set `GROQ_API_KEY` as a server-only Vercel Production environment variable. Optional `GROQ_MODEL` overrides the verified default `openai/gpt-oss-120b`. Install dependencies from the updated lockfile before building. Groq takes precedence for ordinary conversation, including greetings, and for explicitly requested authenticated enquiry analysis. The compact public-profile prompt preserves recent dialogue within a bounded free-tier input budget and requests hidden reasoning with low effort. Client identities remain blocked before inference and filtered afterward. Keys are never sent to the browser.

Groq errors or free-plan limits return labelled basic knowledge responses without silently sending the conversation to OpenAI. Existing OpenAI chat remains available only when Groq is not configured. Live web research still uses the separate OpenAI search integration and is not supplied by this Groq chat change. Groq cannot automatically read private social pages or ChatGPT saved memory. Enable appropriate data controls, including Zero Data Retention, in the provider console; the application cannot enable account-level retention settings. No assistant attachment or upload controls are added.

The Groq adapter is verified with mocked provider responses, including conversation continuity, Groq-only configuration, confidentiality rejection, rate-limit fallback, private-context exclusion and output formatting. Real account credentials are not retrieved during code-only verification; adding an environment variable does not change an already deployed build. Publish the updated code to activate it.

### Focused professional enquiries

The public Groq conversation now generates one structured response containing the visitor-facing answer and an optional enquiry draft. The assistant prioritizes Abdul's public work, recruiters, prospective customers and collaborators; obvious unrelated entertainment/weather requests receive a short local redirect without an inference call. It asks one relevant missing question at a time, avoids fees/service/meeting commitments, and prepares a draft only when the visitor requests follow-up and supplies enough information. Visitor name, organization and contact are checked against user messages rather than accepted from invented model fields.

A draft reveals a contextual review card, not a permanent menu. Visitors may edit the type, name, organization, contact and summary. No record is submitted until they explicitly consent and press Send. Declining or successful submission suppresses repeat proposals; a later explicit send request can reopen a draft. Only the reviewed fields are sent, not the full conversation or files. Assistant-sourced enquiries use the existing private Admin inbox and do not send WhatsApp/email notifications. Other Contact form behavior is preserved.

Assistant submissions use a retry UUID and a transaction-locked receipt table to avoid duplicate inserts on identical retries. Reusing a token with changed content is rejected. The receipt table is created on the first real consented assistant submission. The Admin inbox remains authenticated and shows these enquiries under their existing recruiter/client/collaboration/appointment type, with a source note in details. Tests mock all submissions; no owner records or notifications are created during code verification.

Ordinary assistant chat has no application-imposed message-count cap. The AI provider’s free-tier rate and quota limits still apply; bounded input/history size is not a conversation-count limit.

## Professional Study development

The phased checklist and handoff record is [PROFESSIONAL_STUDY_PLAN.md](PROFESSIONAL_STUDY_PLAN.md). Start there before implementing or resuming CA study work. Repository discovery is in [docs/professional-study-architecture.md](docs/professional-study-architecture.md).
