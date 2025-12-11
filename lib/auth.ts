import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAdminUserByUsername } from './db';

const SESSION_COOKIE_NAME = 'showartz_session';

export interface Session {
  username: string;
  userId: string;
}

// Simple session management (in production, use proper session store or JWT)
export function getSession(req: NextRequest): Session | null {
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) return null;

  try {
    // In a real app, verify the session token signature
    const session = JSON.parse(Buffer.from(sessionCookie, 'base64').toString()) as Session;
    return session;
  } catch {
    return null;
  }
}

export async function verifyPassword(username: string, password: string): Promise<boolean> {
  const user = await getAdminUserByUsername(username);
  if (!user) return false;

  return bcrypt.compare(password, user.password_hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

