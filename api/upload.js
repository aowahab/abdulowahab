import { handleUpload } from '@vercel/blob/client';
import { isAdmin } from '../lib/auth.js';
import { json, sameOrigin } from '../lib/http.js';

const ALLOWED_TYPES = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

// Photos, videos and files go straight from the browser to Blob storage, so
// large videos are not limited by the function body size. This endpoint only
// checks that you are signed in and hands out a short-lived upload token.
export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Blocked cross-site request.' }, 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Bad request.' }, 400);
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!isAdmin(request)) throw new Error('Please sign in again.');
        if (!pathname.startsWith('uploads/')) throw new Error('Invalid upload path.');
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return json(result);
  } catch (error) {
    return json({ error: error.message || 'Upload failed.' }, 400);
  }
}
