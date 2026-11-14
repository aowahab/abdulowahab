import { createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE = 'admin_session';
export const SESSION_SECONDS = 7 * 24 * 60 * 60;

const b64u = (value) => Buffer.from(value).toString('base64url');

// The signing key is derived from the admin password, so changing the
// password signs every existing session out.
const signingKey = (password) =>
  createHmac('sha256', password).update('abdulowahab-session-v1').digest();

const sign = (password, payload) =>
  b64u(createHmac('sha256', signingKey(password)).update(payload).digest());

// Compares two strings without leaking where they differ.
export function safeEqual(a, b) {
  const ha = createHmac('sha256', 'compare').update(String(a)).digest();
  const hb = createHmac('sha256', 'compare').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

export function makeToken(password, now = Date.now(), ttl = SESSION_SECONDS) {
  const payload = b64u(JSON.stringify({ exp: Math.floor(now / 1000) + ttl }));
  return `${payload}.${sign(password, payload)}`;
}

export function verifyToken(password, token, now = Date.now()) {
  if (!password || typeof token !== 'string') return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const given = Buffer.from(sig);
  const expected = Buffer.from(sign(password, payload));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && exp > now / 1000;
  } catch {
    return false;
  }
}

export function getCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) {
      try { return decodeURIComponent(part.slice(i + 1).trim()); }
      catch { return null; }
    }
  }
  return null;
}

export function isAdmin(request) {
  return verifyToken(process.env.ADMIN_PASSWORD, getCookie(request, COOKIE));
}

export function sessionCookie(token, maxAge = SESSION_SECONDS) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
