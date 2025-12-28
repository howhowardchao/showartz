import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await getPool().connect();
    
    try {
      // 更新會話結束時間和總時長
      await client.query(`
        UPDATE sessions
        SET ended_at = CURRENT_TIMESTAMP,
            duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INTEGER
        WHERE session_id = $1 
          AND ended_at IS NULL
      `, [body.sessionId]);

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Analytics session end error:', error);
    return NextResponse.json({ error: 'Failed to track session end' }, { status: 500 });
  }
}

