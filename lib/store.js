import { put, list } from '@vercel/blob';
import { DEFAULT_CONTENT, normalizeContent } from './portfolio-content.js';
import { readNeonContent, writeNeonContent } from './neon-content-store.js';

const PATH = 'site/content.json';
const neonEnabled = () => process.env.PORTFOLIO_CONTENT_BACKEND === 'neon';

async function readBlobContent() {
  const { blobs } = await list({ prefix: PATH, limit: 5 });
  const file = blobs.find((b) => b.pathname === PATH);
  if (!file) return DEFAULT_CONTENT;
  const res = await fetch(`${file.url}?v=${new Date(file.uploadedAt).getTime()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not read saved content (${res.status}).`);
  return normalizeContent(await res.json());
}

// The feature flag remains off until the existing content is copied and verified.
// No automatic fallback to defaults when Neon is selected: avoid overwriting live data.
export async function readContent() {
  if (neonEnabled()) {
    const content = await readNeonContent();
    if (!content) throw new Error('Neon content not migrated yet; abort cutover');
    return content;
  }
  return readBlobContent();
}

export async function writeContent(content) {
  if (neonEnabled()) return writeNeonContent(content);
  await put(PATH, JSON.stringify(content), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}
