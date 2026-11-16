import { isAdmin } from '../lib/auth.js';
import { json, sameOrigin } from '../lib/http.js';
import { normalizeContent } from '../lib/portfolio-content.js';
import { writeContent } from '../lib/store.js';

const MAX_BYTES = 1_500_000;

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Blocked cross-site request.' }, 403);
  if (!isAdmin(request)) return json({ error: 'Please sign in again.' }, 401);

  const raw = await request.text();
  if (raw.length > MAX_BYTES) return json({ error: 'Content is too large to save.' }, 413);

  let content;
  try {
    content = normalizeContent(JSON.parse(raw));
  } catch (error) {
    return json({ error: error.message || 'Invalid content.' }, 400);
  }
  content.updatedAt = new Date().toISOString();

  try {
    await writeContent(content);
  } catch (error) {
    console.error('content save failed:', error);
    return json({ error: 'Could not save to storage. Try again.' }, 500);
  }
  return json(content);
}
