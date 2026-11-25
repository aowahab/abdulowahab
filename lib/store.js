import { put, list } from '@vercel/blob';
import { normalizeContent } from './portfolio-content.js';

import liveContent from './portfolio-live-content.json' with { type: 'json' };

export const PORTFOLIO_SEED = normalizeContent(liveContent);
const PATH = 'site/content.json';

// Reads the saved site content from Blob storage. Falls back to the built-in
// previously published portfolio until the first save.
export async function readContent() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return PORTFOLIO_SEED;
  const { blobs } = await list({ prefix: PATH, limit: 5 });
  const file = blobs.find((b) => b.pathname === PATH);
  if (!file) return PORTFOLIO_SEED;
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
