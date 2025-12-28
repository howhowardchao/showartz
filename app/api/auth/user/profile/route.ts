import { NextRequest, NextResponse } from 'next/server';
import { updateUserProfile } from '@/lib/db';
import { getUserSession } from '../session/route';

export async function PUT(request: NextRequest) {
  try {
    const session = getUserSession(request);
    
    if (!session || session.type !== 'user') {
      return NextResponse.json(
        { error: '未登入' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, nickname, avatar_url } = body;

    const updates: { name?: string; nickname?: string; avatar_url?: string } = {};
    if (name !== undefined) updates.name = name;
    if (nickname !== undefined) updates.nickname = nickname;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: '沒有要更新的資料' },
        { status: 400 }
      );
    }

    const user = await updateUserProfile(session.userId, updates);

    return NextResponse.json({
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
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: '更新資料失敗' },
      { status: 500 }
    );
  }
}

