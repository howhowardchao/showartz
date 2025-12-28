import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

function getDeviceType(userAgent: string): string {
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await getPool().connect();
    
    try {
      // 取得或創建訪客
      await client.query(`
        INSERT INTO visitors (visitor_id, first_visit_at, last_visit_at, visit_count)
        VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
        ON CONFLICT (visitor_id) 
        DO UPDATE SET 
          last_visit_at = CURRENT_TIMESTAMP,
          visit_count = visitors.visit_count + 1
      `, [body.visitorId]);

      // 取得 IP 位址
      const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                       request.headers.get('x-real-ip') || 
                       'unknown';

      // 取得或創建會話
      await client.query(`
        INSERT INTO sessions (
          visitor_id, session_id, started_at, referrer, 
          user_agent, ip_address, device_type, screen_width, 
          screen_height, language, page_count
        )
        VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6, $7, $8, $9, 1)
        ON CONFLICT (session_id) 
        DO UPDATE SET page_count = sessions.page_count + 1
      `, [
        body.visitorId,
        body.sessionId,
        body.referrer || null,
        body.userAgent,
        ipAddress,
        getDeviceType(body.userAgent),
        body.screenWidth,
        body.screenHeight,
        body.language,
      ]);

      // 記錄頁面瀏覽
      await client.query(`
        INSERT INTO page_views (
          session_id, visitor_id, page_path, page_title, entered_at
        )
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `, [
        body.sessionId,
        body.visitorId,
        body.pagePath,
        body.pageTitle,
      ]);

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Analytics pageview error:', error);
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}

