import { makeToken, safeEqual, sessionCookie } from '../lib/auth.js';
import { json, sameOrigin } from '../lib/http.js';

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: 'Blocked cross-site request.' }, 403);

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return json({ error: 'ADMIN_PASSWORD is not set on the server yet.' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Send the password as JSON.' }, 400);
  }

  const given = typeof body?.password === 'string' ? body.password : '';
  if (!given || !safeEqual(given, password)) {
    // A short delay slows down guessing.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return json({ error: 'Wrong password.' }, 401);
  }

  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(makeToken(password)) });
}
