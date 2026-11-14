import { put, list } from '@vercel/blob';
import { DEFAULT_CONTENT, normalizeContent } from './portfolio-content.js';

const PATH = 'site/content.json';

// Reads the saved site content from Blob storage. Falls back to the built-in
// defaults until the first save.
export async function readContent() {
  const { blobs } = await list({ prefix: PATH, limit: 5 });
  const file = blobs.find((b) => b.pathname === PATH);
  if (!file) return DEFAULT_CONTENT;
  const res = await fetch(`${file.url}?v=${new Date(file.uploadedAt).getTime()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not read saved content (${res.status}).`);
  return normalizeContent(await res.json());
}

export async function writeContent(content) {
  await put(PATH, JSON.stringify(content), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}
