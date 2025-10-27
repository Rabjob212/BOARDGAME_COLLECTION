import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/googleCalendar';
import { cookies } from 'next/headers';
import { saveTokensToEnv } from '@/lib/envTokenStorage';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(new URL('/?auth=error', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?auth=missing_code', request.url));
  }

  try {
    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Save tokens to .env.local for permanent server-side access
    if (tokens.access_token && tokens.refresh_token) {
      saveTokensToEnv(tokens.access_token, tokens.refresh_token);
    }

    // Store tokens in httpOnly cookies (more secure than localStorage)
    const cookieStore = await cookies();
    
    if (tokens.access_token) {
      cookieStore.set('google_access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hour
      });
    }

    if (tokens.refresh_token) {
      cookieStore.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    // Redirect back to the app with success
    return NextResponse.redirect(new URL('/?auth=success', request.url));
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.redirect(new URL('/?auth=token_error', request.url));
  }
}
