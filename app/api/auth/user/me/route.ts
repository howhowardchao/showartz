import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/db';
import { getUserSession } from '../session/route';

export async function GET(request: NextRequest) {
  try {
    const session = getUserSession(request);
    
    if (!session || session.type !== 'user') {
      return NextResponse.json(
        { error: '未登入' },
        { status: 401 }
      );
    }

    const user = await getUserById(session.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: '用戶不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        email_verified: user.email_verified,
        membership_level: user.membership_level,
        total_points: user.total_points,
        total_spent: user.total_spent,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: '取得用戶資料失敗' },
      { status: 500 }
    );
  }
}

