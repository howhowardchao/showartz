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
    
    // 提供更詳細的錯誤訊息以便診斷
    let errorMessage = '註冊失敗，請稍後再試';
    if (error instanceof Error) {
      // 資料庫連接錯誤
      if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
        errorMessage = '無法連接到資料庫，請檢查資料庫服務是否運行';
      }
      // 資料庫查詢錯誤
      else if (error.message.includes('relation') || error.message.includes('does not exist')) {
        errorMessage = '資料庫表格不存在，請先初始化資料庫';
      }
      // 其他資料庫錯誤
      else if (error.message.includes('duplicate') || error.message.includes('unique')) {
        errorMessage = '此電子郵件已被註冊';
      }
      else {
        errorMessage = `註冊失敗：${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

