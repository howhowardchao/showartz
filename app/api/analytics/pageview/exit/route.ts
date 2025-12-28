import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await getPool().connect();
    
    try {
      // 更新頁面瀏覽記錄的離開時間和停留時間
      // 使用子查詢找到最新的未完成的頁面瀏覽記錄
      await client.query(`
        UPDATE page_views
        SET exited_at = CURRENT_TIMESTAMP,
            duration_seconds = $1,
            scroll_depth = $2
        WHERE id = (
          SELECT id
          FROM page_views
          WHERE session_id = $3 
            AND page_path = $4
            AND exited_at IS NULL
          ORDER BY entered_at DESC
          LIMIT 1
        )
      `, [
        body.duration,
        body.scrollDepth || 0,
        body.sessionId,
        body.pagePath,
      ]);

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Analytics pageview exit error:', error);
    return NextResponse.json({ error: 'Failed to track exit' }, { status: 500 });
  }
}

