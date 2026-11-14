# Abdul Owahab portfolio

React and Vite portfolio preserving the production five-page layout, editable content, full footer, visitor statistics and Admin access, with optional project case studies. Vercel Functions serve the API; Blob stores portfolio content and PostgreSQL stores enquiries and ERP records.

## Local development

Use Node.js 22 or newer. Run `npm ci`, `npm run dev`, `npm run build`, and `npm test`. Vite serves the frontend; API-backed flows require Vercel Functions or a suitable local API server.

## Pages

- `/profile` (or `/`): original profile layout, editable sections and additional project case studies.
- `/feed`: full chronological feed with compact photos and full-size image links.
- `/consultation`: professional enquiry form.
- `/workstation`: original applications, calculators and resource directory, plus sample ERP screenshots.
- `/appointment`: meeting request form.
- `/admin`: password-protected editor, linked from navigation and footer.
- `/erp/`: accounting application with separate authentication.

Original five-destination navigation, footer columns and server-backed visitor-session/online statistics are preserved. `/contact`, `/resources` and `/erp-preview` remain compatible aliases. Existing visitor records are not reset by deploying this code.

## Editable content

The editor controls the profile introduction, CV URL and date label, project case study descriptions, profile sections, social links and updates. `shared/profile.js` and `shared/projects.js` supply defaults for older saved content. Profile sections with IDs `about`, `experience`, `practice` and `education` fill the corresponding homepage sections. All saved sections remain visible, including `qualification`, `projects` and `venture`. Structured project case studies appear after the editable Projects section; existing Admin section edits continue to render.

The CV button is hidden until an approved CV URL is configured. Upload a PDF in the editor and paste its public Blob URL into the CV field. Updating profile text does not regenerate a PDF. Public previews contain illustrative data only.

## Vercel setup

Connect a Blob store (`BLOB_READ_WRITE_TOKEN`) and set `ADMIN_PASSWORD` for the portfolio editor. PostgreSQL (`DATABASE_URL` or `POSTGRES_URL`) is required for enquiries. ERP database and authentication requirements are described in `erp/README.md`. Notification and assistant integrations are optional and require their own configured credentials. Never commit environment files.

Git-triggered deployment is currently disabled in `vercel.json`; deployments must be initiated explicitly. Deploy the reviewed commit to a preview, verify it, then release to production when intended.

## Verification

`npm test` covers portfolio session parsing, content compatibility and normalization, and ERP authentication, database and finance behavior. Browser checks cover desktop/mobile routes, overflow, menu interaction, legacy URLs, optional meeting fields, and form success/reset with a mocked API response. Actual delivery to the production private inbox must be checked on the deployed environment.
