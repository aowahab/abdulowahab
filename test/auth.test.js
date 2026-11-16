import test from 'node:test';
import assert from 'node:assert/strict';
import { getCookie, isAdmin, makeToken } from '../lib/auth.js';

test('malformed admin cookies fail closed without a server error', () => {
  process.env.ADMIN_PASSWORD = 'test-password';
  const request = new Request('https://example.com/api/me', { headers: { cookie: 'admin_session=%E0%A4%A' } });
  assert.equal(getCookie(request, 'admin_session'), null);
  assert.equal(isAdmin(request), false);
});

test('valid admin sessions work alongside unrelated malformed cookies', () => {
  const token = makeToken(process.env.ADMIN_PASSWORD);
  const request = new Request('https://example.com/api/me', { headers: { cookie: `other=%ZZ; admin_session=${token}` } });
  assert.equal(isAdmin(request), true);
});
