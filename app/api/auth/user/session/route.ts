import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/db';

const USER_SESSION_COOKIE_NAME = 'user_session';

interface UserSession {
  userId: string;
  email: string;
  type: string;
}

export function getUserSession(req: NextRequest): UserSession | null {
  const sessionCookie = req.cookies.get(USER_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(Buffer.from(sessionCookie, 'base64').toString()) as UserSession;
    return session;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = getUserSession(request);
    
    if (!session || session.type !== 'user') {
      return NextResponse.json({ authenticated: false });
    }

    const user = await getUserById(session.userId);
    
    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        membership_level: user.membership_level,
        total_points: user.total_points,
        total_spent: user.total_spent,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}

