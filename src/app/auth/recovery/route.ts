import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { appUrl, publicConfig } from '@/lib/config';

// Dedicated to recovery. Signup continues to use /auth/callback and PKCE.
export async function GET(request: NextRequest) {
  const origin = appUrl();
  const response = NextResponse.redirect(new URL('/auth/recuperar?erro=link', origin));
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Referrer-Policy', 'no-referrer');
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get('token_hash');

  if (params.getAll('type').length !== 1 || params.get('type') !== 'recovery'
    || params.getAll('token_hash').length !== 1 || !tokenHash
    || tokenHash.length > 2048 || /\s/.test(tokenHash)) return response;

  try {
    const { url, key } = publicConfig();
    const db = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: values => {
          values.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options, sameSite: 'lax', secure: new URL(origin).protocol === 'https:',
            });
          });
        },
      },
    });
    // Complete SDK initialization before verification so PASSWORD_RECOVERY flushes
    // session cookies synchronously, rather than queuing the event during init.
    await db.auth.initialize();
    const { data, error } = await db.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
    if (!error && data.session) {
      // Reuse the response carrying Set-Cookie; never forward tokens or a supplied next URL.
      response.headers.set('Location', new URL('/auth/nova-senha', origin).toString());
    }
  } catch {
    // Do not log the request URL, token, session or upstream response.
    // Configuration/network failures use the same public error as an expired link.
  }
  return response;
}
