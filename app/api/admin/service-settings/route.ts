import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getAllServiceSettings,
  updateServiceSetting,
  getServiceSetting,
} from '@/lib/db';
import { clearSettingsCache } from '@/lib/chat-limiter';

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

// GET - 讀取服務設定
export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guestSetting = await getServiceSetting('rate_limit_guest');
    const memberSetting = await getServiceSetting('rate_limit_member');

    if (!guestSetting || !memberSetting) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      guest: guestSetting.setting_value as {
        conversation_limit_ms: number;
        cooldown_ms: number;
      },
      member: memberSetting.setting_value as {
        conversation_limit_ms: number;
        cooldown_ms: number;
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching service settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch settings',
        details: toErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// PUT - 更新服務設定
export async function PUT(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { guest, member } = body;

    if (!guest || !member) {
      return NextResponse.json(
        { error: 'Guest and member settings are required' },
        { status: 400 }
      );
    }

    // 驗證設定格式
    if (
      typeof guest.conversation_limit_ms !== 'number' ||
      typeof guest.cooldown_ms !== 'number' ||
      typeof member.conversation_limit_ms !== 'number' ||
      typeof member.cooldown_ms !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      );
    }

    // 驗證數值範圍
    if (
      guest.conversation_limit_ms < 60000 ||
      guest.conversation_limit_ms > 600000 ||
      guest.cooldown_ms < 30000 ||
      guest.cooldown_ms > 600000 ||
      member.conversation_limit_ms < 60000 ||
      member.conversation_limit_ms > 600000 ||
      member.cooldown_ms < 30000 ||
      member.cooldown_ms > 600000
    ) {
      return NextResponse.json(
        { error: 'Settings values out of range' },
        { status: 400 }
      );
    }

    // 更新設定
    await updateServiceSetting(
      'rate_limit_guest',
      {
        conversation_limit_ms: guest.conversation_limit_ms,
        cooldown_ms: guest.cooldown_ms,
      },
      session.username
    );

    await updateServiceSetting(
      'rate_limit_member',
      {
        conversation_limit_ms: member.conversation_limit_ms,
        cooldown_ms: member.cooldown_ms,
      },
      session.username
    );

    // 清除快取，讓新設定立即生效
    clearSettingsCache();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error updating service settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to update settings',
        details: toErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

