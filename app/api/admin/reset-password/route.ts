import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { getAdminUserByUsername } from '@/lib/db';
import { Pool } from 'pg';

// 重置管理員密碼的 API（僅用於初始化或緊急情況）
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // 檢查是否為管理員帳號
    const adminUsername = process.env.ADMIN_USERNAME || 'Showartzadmin';
    if (username !== adminUsername) {
      return NextResponse.json(
        { error: 'Invalid username' },
        { status: 403 }
      );
    }

    // 生成新的密碼哈希
    const passwordHash = await hashPassword(password);

    // 更新資料庫中的密碼
    const isDockerInternal = process.env.DATABASE_URL?.includes('@postgres:');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isDockerInternal ? false : undefined,
    });

    try {
      // 使用 UPSERT 更新或創建
      await pool.query(
        `INSERT INTO admin_users (username, password_hash) 
         VALUES ($1, $2) 
         ON CONFLICT (username) 
         DO UPDATE SET password_hash = $2`,
        [username, passwordHash]
      );

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully',
      });
    } finally {
      await pool.end();
    }
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      {
        error: 'Failed to reset password',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

