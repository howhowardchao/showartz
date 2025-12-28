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
    
    // 驗證必要字段
    if (!body.visitorId || !body.sessionId || !body.pagePath) {
      return NextResponse.json(
        { error: 'Missing required fields: visitorId, sessionId, pagePath' },
        { status: 400 }
      );
    }

    const client = await getPool().connect();
    
    try {
      // 確保數據庫表存在（如果不存在則創建）
      await client.query(`
        CREATE TABLE IF NOT EXISTS visitors (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          visitor_id TEXT UNIQUE NOT NULL,
          first_visit_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_visit_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          visit_count INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          visitor_id TEXT NOT NULL,
          session_id TEXT UNIQUE NOT NULL,
          started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMP,
          duration_seconds INTEGER,
          page_count INTEGER NOT NULL DEFAULT 0,
          referrer TEXT,
          user_agent TEXT,
          ip_address TEXT,
          device_type VARCHAR(20),
          screen_width INTEGER,
          screen_height INTEGER,
          language VARCHAR(10),
          country VARCHAR(2),
          city TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS page_views (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id TEXT NOT NULL,
          visitor_id TEXT NOT NULL,
          page_path TEXT NOT NULL,
          page_title TEXT,
          entered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          exited_at TIMESTAMP,
          duration_seconds INTEGER,
          scroll_depth INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

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
      const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                       request.headers.get('x-real-ip') || 
                       'unknown';

      // 處理數字字段，確保有效值
      const screenWidth = body.screenWidth != null && !isNaN(Number(body.screenWidth)) 
        ? parseInt(String(body.screenWidth), 10) 
        : null;
      const screenHeight = body.screenHeight != null && !isNaN(Number(body.screenHeight)) 
        ? parseInt(String(body.screenHeight), 10) 
        : null;
      
      // 處理語言字段，限制長度
      const language = body.language 
        ? String(body.language).substring(0, 10) 
        : null;

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
        body.userAgent || null,
        ipAddress,
        getDeviceType(body.userAgent || ''),
        screenWidth,
        screenHeight,
        language,
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
        body.pageTitle || null,
      ]);

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Analytics pageview error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // 記錄詳細錯誤信息以便調試
    if (errorStack) {
      console.error('Error stack:', errorStack);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to track', 
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    );
  }
}

