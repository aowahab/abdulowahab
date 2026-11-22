# Portfolio migration to Cloudflare — execution checklist

Target:
- aowahab.site: portfolio, backed entirely by Cloudflare (not a Vercel proxy)
- aowahab.site/lunch: existing NUFHAS application
- Keep aowahab/abdulowahab and aowahab/nufhas separate repositories.
- Keep production unchanged until full functional migration is verified.

## Current findings
- Portfolio: Vite/React with two HTML entrypoints, `index.html` and `admin.html`.
- Portfolio Vercel Functions: assistant, content, ERP, lead, leads, login, logout, me, news, save, traffic, upload.
- Upload API calls `@vercel/blob/client`; content storage and other functions use Vercel-specific services. A static-only Cloudflare deployment is NOT feature-complete.
- Existing Cloudflare routes `aowahab.site/*` and `*.aowahab.site/*` both point to `nufhas-dev`.
- Existing DNS apex A record is proxied; do not delete DNS/mail records.
- NUFHAS is Next.js/OpenNext on Cloudflare and has routes and API endpoints beyond `/lunch`.

## Migration gates
- [x] Identify repositories and live route ownership.
- [x] Create separate migration branch and Cloudflare static-assets configuration.
- [x] Inventory Vercel environment variable names and required secrets without exposing values in commits.
- [ ] Replace Vercel Blob read/write/upload with Cloudflare R2 (including migrating existing objects and URL references).
- [ ] Port all Vercel Functions to Cloudflare Worker-compatible handlers; adapt Node-only dependencies and ERP router.
- [ ] Reconcile Vercel rewrites and admin.html entrypoint with Cloudflare asset routing.
- [ ] Validate existing database access and auth/session cookie isolation; preserve Neon records.
- [ ] Build and test full portfolio on an isolated workers.dev preview URL.
- [ ] Test AI assistant, content save, uploads, admin login, leads, ERP, visitor metrics, mobile and desktop.
- [ ] Define explicit Cloudflare route precedence: portfolio root and assets; NUFHAS lunch pages, NUFHAS APIs, and any other NUFHAS routes intentionally retained.
- [ ] Back up configuration and deploy with rollback path.
- [ ] Switch apex route only after preview passes; verify /lunch and all NUFHAS APIs after cutover.
- [ ] Decommission Vercel only after data and function parity are confirmed.

## Safety
Do not point the apex at a static-only Worker: it would break portfolio APIs. Do not remove the existing NUFHAS wildcard route until subdomain and mail dependencies are assessed. Do not copy secret values into GitHub.

## Vercel configuration inventory (names only, no secret values)
- AI: `GROQ_API_KEY`
- Authentication: `ADMIN_PASSWORD`, `APP_PASSWORD`, `SESSION_SECRET`, `VITE_NEON_AUTH_URL`, `NEON_AUTH_BASE_URL`
- Database: `DATABASE_URL`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `DATABASE_URL_UNPOOLED`, related PostgreSQL host/user/password settings
- Realtime: `NEON_REALTIME_URL`, `NEON_REALTIME_SECRET`
- Files: `BLOB_READ_WRITE_TOKEN` (Vercel-specific; requires R2 migration)
- WhatsApp: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WABA_ID`, `WHATSAPP_ACCESS_TOKEN`

Do not commit secret values, blindly copy browser-exposed variables, or deploy static-only assets to the production apex. A Cloudflare preview must demonstrate functional parity first.
