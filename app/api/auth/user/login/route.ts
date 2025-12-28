import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, updateUserLastLogin } from '@/lib/db';
import bcrypt from 'bcryptjs';

const USER_SESSION_COOKIE_NAME = 'user_session';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '電子郵件和密碼為必填項目' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: '電子郵件或密碼錯誤' },
        { status: 401 }
      );
    }

    // 檢查帳號狀態
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: '帳號已被停用，請聯絡客服' },
        { status: 403 }
      );
    }

    // 驗證密碼
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: '電子郵件或密碼錯誤' },
        { status: 401 }
      );
    }

    // 更新最後登入時間
    await updateUserLastLogin(user.id);

    // 建立 session
    const session = {
      userId: user.id,
      email: user.email,
      type: 'user',
    };

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        membership_level: user.membership_level,
        total_points: user.total_points,
      },
    });

    // 設定 session cookie
    const sessionData = Buffer.from(JSON.stringify(session)).toString('base64');
    response.cookies.set(USER_SESSION_COOKIE_NAME, sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 天
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '登入失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

