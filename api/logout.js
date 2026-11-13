import { sessionCookie } from '../lib/auth.js';
import { json, sameOrigin } from '../lib/http.js';

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Blocked cross-site request.' }, 403);
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
}
