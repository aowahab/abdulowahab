# Study resource, budget and failure policy (P1.7)

Version study-resources-v1, 2026-11-16. These are product defaults and tested pure validators, not operating production controls. No upload/marking endpoint is enabled.

## File and extraction defaults

Accept PDF, DOCX, JPEG, PNG and WebP. Limit each file to 20 MiB, each attempt to 50 MiB / 40 files / 60 extracted pages. Limit a decoded image to 25 million pixels. Legacy DOC is not accepted until a safe converter is verified; ask for PDF/DOCX. Explain limits before the exam starts.
Check MIME claims AND actual signatures server-side. Preserve page ordering; reject encrypted/corrupt documents with clear resubmission guidance within the original upload window. These checks never extend the fixed 30-minute window. Treat zero-readable-text as requiring review rather than zero marks.
DOCX extraction: at most 100 MiB expanded bytes, 2,000 archive entries and 100:1 expansion. Track limits during streaming expansion, not after allocating an entire archive. Disable external XML entities, references and macros; never execute embedded objects. Maximum extracted text is 300,000 characters. Apply page/pixel limits during decoding/rendering and bound concurrency/memory. OCR confidence requires calibration; do not invent a universal confidence threshold.

## Fair use and money

Proposed initial daily limits: one written marking per guest and three per account, with one active job per owner. Durable owner counters and transactional reservations enforce this; IP abuse controls supplement them without treating IP as identity. Admin material uploads have a separate quota. Allow 10 upload authorizations/minute and 5 finalization requests/minute per owner; idempotent retries return the same receipt without consuming another grading allowance.
Grading defaults: maximum 30,000 input and 6,000 output tokens per provider call, up to three attempts total. Do not truncate a script silently: split into rubric-scoped jobs with a combined budget, or require review. Provider/model context limits may require stricter settings. Estimate cost using verified provider/model pricing, including OCR and any vision charges; no current monetary prices are assumed here.
Configure a per-job maximum and global daily spend ceiling before enablement. Missing pricing or budget configuration blocks dispatch. Reserve the worst-case three-call estimate atomically before first dispatch and settle actual usage once per billable call. Check both owner and global balances in the same transaction. Retries require the remaining reservation; provider errors may still cost money. Release unused reserves after terminal state; reconciliation must use unique call IDs. The helper only calculates a reservation and cannot prevent concurrent overspend by itself.

## Deadlines, workers and retry policy

API metadata payload: at most 64 KiB; file bytes travel via direct authorized upload. Provider deadline: 90 seconds/call. Worker lease: 180 seconds, with renewal before expiry and fencing tokens on writes. Job attempt count and lease updates must be atomic. An expired lease is reclaimable, but stale workers cannot publish results or settle charges twice.
Retry network failures, timeouts, HTTP 429 and 5xx only, with at most three calls total. Baseline delays are 30 then 60 seconds plus nonnegative jitter. Honor a larger Retry-After; leave the job queued rather than blocking an HTTP request. Credential/permission errors, bad requests and unsupported formats fail without automatic retries. Invalid model output, unreadable script and invalid rubric go to review instead of repeated paid guesses.
Record structured error codes and safe operational metadata. Never expose provider tokens, raw script text, private object keys or internal prompts in UI/logs. User states distinguish queued, processing, review required and failed; a failed job preserves the submitted script until retention expiry and never fabricates marks. Admin can request a new auditable generation after fixing the cause, subject to budget/owner consent where relevant. No unlimited automatic retry loop.

## Required integration tests before release

- Race two jobs against one remaining daily allowance and one global budget: only one reservation succeeds.
- Duplicate submission/worker callbacks cannot duplicate grading or charges.
- Delete during OCR/marking: stale output cannot resurrect learner data.
- Archive bombs, wrong signatures, page count/pixel limits and corrupt inputs fail within bounded resources.
- 429 Retry-After, timeout, 401, malformed output and exhausted reservations produce the correct terminal/review state.
- Full marking failure retains downloadable owner-private scripts and clear retry guidance.

P1.7 policy is complete; enforcement is later P4/P5/P7 work. Next P2.1: implement a lazy-loaded Professional Study section and its navigation, then level/subject/chapter browsing. No deploy until explicit instruction.
