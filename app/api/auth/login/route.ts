import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';
import { getAdminUserByUsername } from '@/lib/db';

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const user = await getAdminUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(username, password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const session = { username: user.username, userId: user.id };
    const response = NextResponse.json({ success: true, user: { username: user.username } });
    
    // Set session cookie
    const sessionData = Buffer.from(JSON.stringify(session)).toString('base64');
    response.cookies.set('showartz_session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: toErrorMessage(error)
      },
      { status: 500 }
    );
  }
}

