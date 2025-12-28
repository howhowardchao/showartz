import { NextResponse } from 'next/server';

const USER_SESSION_COOKIE_NAME = 'user_session';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // 清除 session cookie
  response.cookies.set(USER_SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });

  return response;
}

