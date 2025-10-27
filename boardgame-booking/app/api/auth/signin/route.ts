import { NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/googleAuth';

export async function GET() {
  const authUrl = getGoogleAuthUrl();
  return NextResponse.redirect(authUrl);
}
