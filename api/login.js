import { makeToken, safeEqual, sessionCookie } from '../lib/auth.js';
import { json, sameOrigin } from '../lib/http.js';

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Blocked cross-site request.' }, 403);

  if (Number(request.headers.get('content-length') || 0) > 1024) return json({ error: 'Request too large.' }, 413);
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 1024) return json({ error: 'Request too large.' }, 413);
    body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Send a JSON object.' }, 400);
  } catch {
    return json({ error: 'Send the password as JSON.' }, 400);
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return json({ error: 'ADMIN_PASSWORD is not set on the server yet.' }, 503);
  }

  const given = typeof body?.password === 'string' ? body.password : '';
  if (!given || !safeEqual(given, password)) {
    // A short delay slows down guessing.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return json({ error: 'Wrong password.' }, 401);
  }

  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(makeToken(password)) });
}
