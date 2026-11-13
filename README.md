# abdulowahab

Personal portfolio for Abdul Owahab with a password-protected editor at `/admin`.

## How it works

- `index.html` and `site.js` show the public page. Content comes from `/api/content`.
- `admin.html` and `admin.js` are the editor: profile details, sections, and updates with photos, videos and files.
- `api/` holds the Vercel Functions: `login`, `logout`, `me`, `content`, `save` and `upload`.
- Text content is saved as one JSON file in Vercel Blob. Photos, videos and files upload straight from the browser to Vercel Blob.

## Setup on Vercel

1. Connect a Blob store to the project. This adds `BLOB_READ_WRITE_TOKEN` automatically.
2. Add an environment variable `ADMIN_PASSWORD` with the password you want to sign in with, then redeploy.
3. Open `/admin` and sign in.

Changing `ADMIN_PASSWORD` signs out every existing session.

## Notes

- Sessions last 7 days and use a signed, HttpOnly cookie.
- Uploads accept images, video, audio, PDF, Office files, text and zip, up to 500 MB each.
- Large phone photos are shrunk in the browser before upload.
