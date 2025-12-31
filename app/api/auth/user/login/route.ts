import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, updateUserLastLogin, executeWithAutoInit } from '@/lib/db';
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

    // 查詢用戶（自動處理資料庫初始化）
    const user = await executeWithAutoInit(
      () => getUserByEmail(email),
      'Login'
    );

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
    
    // 提供更詳細的錯誤訊息
    let errorMessage = '登入失敗，請稍後再試';
    if (error instanceof Error) {
      // 資料庫連接錯誤
      if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
        errorMessage = '無法連接到資料庫，請檢查資料庫服務是否運行';
      }
      // 資料庫初始化錯誤
      else if (error.message.includes('資料庫初始化失敗')) {
        errorMessage = error.message;
      }
      // 其他錯誤
      else if (!error.message.includes('電子郵件或密碼錯誤')) {
        errorMessage = `登入失敗：${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

