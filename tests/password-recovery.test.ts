import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/auth/recovery/route';

const origin = 'https://jornada.test';
const hash = 'pkce_' + 'a'.repeat(56); // Synthetic, never a real recovery token.
const cookieName = 'sb-recovery-test-auth-token';
const request = (query: string, cookie = '') => new NextRequest(`${origin}/auth/recovery?${query}`, {
  headers: { cookie },
});
const validQuery = `token_hash=${hash}&type=recovery`;
const session = () => ({
  access_token: ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({
    sub: 'test-user', exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString('base64url'), 'synthetic-signature'].join('.'),
  refresh_token: 'synthetic-refresh-token', token_type: 'bearer', expires_in: 3600,
  user: { id: 'test-user', aud: 'authenticated', role: 'authenticated',
    email: 'fixture@example.invalid', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
});

test('recovery SSR contract (synthetic Auth transport, real Supabase SSR SDK)', async t => {
  const previous = { ...process.env };
  process.env.APP_URL = origin;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://recovery-test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'synthetic-publishable-key';
  t.after(() => { process.env = previous; });

  for (const [name, cookie] of [
    ['same browser: original PKCE cookie present', `${cookieName}-code-verifier=synthetic-verifier`],
    ['other browser: no cookies or PKCE verifier', ''],
  ]) {
    await t.test(name, async t => {
      const calls: { url: string; body: unknown }[] = [];
      t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
        calls.push({ url: String(input), body: JSON.parse(String(init?.body)) });
        return Response.json(session());
      });
      const response = await GET(request(validQuery + '&next=https://attacker.invalid', cookie));
      assert.equal(response.status, 307);
      assert.equal(response.headers.get('location'), `${origin}/auth/nova-senha`);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].url, 'https://recovery-test.supabase.co/auth/v1/verify');
      assert.deepEqual(calls[0].body, { token_hash: hash, type: 'recovery', gotrue_meta_security: {} });
      const authCookie = response.cookies.get(cookieName);
      assert.ok(authCookie, 'redirect must carry the session cookie');
      assert.ok(authCookie.value.startsWith('base64-'));
      const saved = JSON.parse(Buffer.from(authCookie.value.slice(7), 'base64url').toString());
      assert.equal(saved.user.id, 'test-user');
      assert.equal(saved.refresh_token, 'synthetic-refresh-token');
      assert.equal(authCookie.path, '/');
      assert.equal(authCookie.sameSite, 'lax');
      assert.equal(authCookie.secure, true);
      assert.match(response.headers.get('cache-control')!, /no-store/);
      assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
      assert.equal((await response.text()).includes(hash), false);
    });
  }

  await t.test('missing, wrong and ambiguous parameters never call Auth', async t => {
    const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('unexpected Auth call'); });
    for (const query of ['', 'type=recovery', `token_hash=${hash}`, `token_hash=${hash}&type=signup`,
      validQuery + '&type=recovery', validQuery + '&token_hash=other', 'token_hash=%20&type=recovery']) {
      const response = await GET(request(query));
      assert.equal(response.headers.get('location'), `${origin}/auth/recuperar?erro=link`);
      assert.equal(response.cookies.getAll().length, 0);
    }
    assert.equal(fetch.mock.callCount(), 0);
  });

  await t.test('expired or reused link cannot establish a session', async t => {
    t.mock.method(globalThis, 'fetch', async () => Response.json(
      { code: 'otp_expired', msg: 'Token has expired or is invalid' }, { status: 403 },
    ));
    const response = await GET(request(validQuery));
    assert.equal(response.headers.get('location'), `${origin}/auth/recuperar?erro=link`);
    assert.equal(response.cookies.getAll().length, 0);
  });

  await t.test('verification without a session cannot reach the password form', async t => {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ user: session().user }));
    const response = await GET(request(validQuery));
    assert.equal(response.headers.get('location'), `${origin}/auth/recuperar?erro=link`);
  });
});
