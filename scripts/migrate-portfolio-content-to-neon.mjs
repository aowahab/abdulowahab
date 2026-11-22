// One-time, non-destructive migration from Vercel Blob to existing Neon.
// Usage: node scripts/migrate-portfolio-content-to-neon.mjs --dry-run
//        node scripts/migrate-portfolio-content-to-neon.mjs --apply
// Requires BLOB_READ_WRITE_TOKEN and POSTGRES_URL (or DATABASE_URL).
// NEVER run automatically on a deployment.
import { list } from '@vercel/blob';
import { readNeonContent, writeNeonContent } from '../lib/neon-content-store.js';
import { normalizeContent } from '../lib/portfolio-content.js';
import { createHash } from 'node:crypto';

const apply = process.argv.includes('--apply');
if (apply === process.argv.includes('--dry-run')) {
  throw Error('Specify exactly one of --dry-run or --apply');
}
if (!process.env.BLOB_READ_WRITE_TOKEN) throw Error('Missing BLOB_READ_WRITE_TOKEN');
if (!(process.env.POSTGRES_URL || process.env.DATABASE_URL)) throw Error('Missing Neon connection');
const PATH = 'site/content.json';
const { blobs } = await list({ prefix: PATH, limit: 20 });
const matches = blobs.filter(x => x.pathname === PATH);
if (matches.length !== 1) throw Error(`Expected one source content object; found ${matches.length}`);
const response = await fetch(matches[0].url, { cache: 'no-store' });
if (!response.ok) throw Error(`Source fetch failed: ${response.status}`);
const source = normalizeContent(await response.json());
const canonical = x => JSON.stringify(x);
const digest = x => createHash('sha256').update(canonical(x)).digest('hex');
const existing = await readNeonContent();
if (existing && digest(existing) !== digest(source)) {
  throw Error('Neon already contains different content. Refusing to overwrite it.');
}
console.log(JSON.stringify({
  mode: apply ? 'apply' : 'dry-run',
  sourceHash: digest(source),
  existingHash: existing ? digest(existing) : null,
  status: existing ? 'already-migrated' : 'ready',
}, null, 2));
if (apply && !existing) {
  await writeNeonContent(source);
  const verified = await readNeonContent();
  if (!verified || digest(verified) !== digest(source)) {
    throw Error('Post-write verification failed. Do not switch backend.');
  }
  console.log('Verified Neon content migration successfully.');
}
