import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, nickname } = await request.json();

    // 驗證輸入
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '電子郵件、密碼和姓名為必填項目' },
        { status: 400 }
      );
    }

    // 驗證電子郵件格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '電子郵件格式不正確' },
        { status: 400 }
      );
    }

    // 驗證密碼長度
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密碼長度至少需要 6 個字元' },
        { status: 400 }
      );
    }

    // 檢查電子郵件是否已存在
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: '此電子郵件已被註冊' },
        { status: 409 }
      );
    }

    // 建立用戶
    const passwordHash = await hashPassword(password);
    const user = await createUser(email, passwordHash, name, nickname);

    // 不返回密碼雜湊
    const { password_hash, ...userWithoutPassword } = user as any;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: '註冊成功',
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: '註冊失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

