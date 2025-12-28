import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month
    
    let timeFilter = '';
    switch (period) {
      case 'today':
        timeFilter = "started_at >= CURRENT_DATE";
        break;
      case 'week':
        timeFilter = "started_at >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        timeFilter = "started_at >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      default:
        timeFilter = "started_at >= CURRENT_DATE";
    }

    const client = await getPool().connect();
    
    try {
      // 總訪客數
      const visitorsResult = await client.query(`
        SELECT COUNT(DISTINCT visitor_id) as total_visitors
        FROM sessions
        WHERE ${timeFilter}
      `);

      // 總會話數
      const sessionsResult = await client.query(`
        SELECT COUNT(*) as total_sessions
        FROM sessions
        WHERE ${timeFilter}
      `);

      // 總頁面瀏覽數
      const pageViewsResult = await client.query(`
        SELECT COUNT(*) as total_page_views
        FROM page_views
        WHERE entered_at >= (
          SELECT MIN(started_at) FROM sessions WHERE ${timeFilter}
        )
      `);

      // 平均會話時長
      const avgSessionResult = await client.query(`
        SELECT AVG(duration_seconds) as avg_duration
        FROM sessions
        WHERE ${timeFilter} AND duration_seconds IS NOT NULL
      `);

      // 平均頁面停留時間
      const avgPageResult = await client.query(`
        SELECT AVG(duration_seconds) as avg_page_duration
        FROM page_views
        WHERE entered_at >= (
          SELECT MIN(started_at) FROM sessions WHERE ${timeFilter}
        ) AND duration_seconds IS NOT NULL
      `);

      // 即時在線訪客（過去 5 分鐘內有活動）
      const activeVisitorsResult = await client.query(`
        SELECT COUNT(DISTINCT visitor_id) as active_visitors
        FROM sessions
        WHERE started_at >= NOW() - INTERVAL '5 minutes'
          OR (ended_at IS NULL AND started_at >= NOW() - INTERVAL '30 minutes')
      `);

      // 熱門頁面
      const popularPagesResult = await client.query(`
        SELECT 
          page_path,
          COUNT(*) as view_count,
          AVG(duration_seconds) as avg_duration,
          AVG(scroll_depth) as avg_scroll_depth
        FROM page_views
        WHERE entered_at >= (
          SELECT MIN(started_at) FROM sessions WHERE ${timeFilter}
        )
        GROUP BY page_path
        ORDER BY view_count DESC
        LIMIT 10
      `);

      // 裝置類型分布
      const deviceTypesResult = await client.query(`
        SELECT 
          device_type,
          COUNT(*) as count
        FROM sessions
        WHERE ${timeFilter}
        GROUP BY device_type
      `);

      // 新訪客 vs 回訪者
      const visitorTypesResult = await client.query(`
        SELECT 
          CASE 
            WHEN v.visit_count = 1 THEN 'new'
            ELSE 'returning'
          END as visitor_type,
          COUNT(DISTINCT v.visitor_id) as count
        FROM visitors v
        JOIN sessions s ON s.visitor_id = v.visitor_id
        WHERE s.started_at >= (
          SELECT CASE 
            WHEN $1 = 'today' THEN CURRENT_DATE
            WHEN $1 = 'week' THEN CURRENT_DATE - INTERVAL '7 days'
            WHEN $1 = 'month' THEN CURRENT_DATE - INTERVAL '30 days'
            ELSE CURRENT_DATE
          END
        )
        GROUP BY visitor_type
      `, [period]);

      return NextResponse.json({
        totalVisitors: parseInt(visitorsResult.rows[0]?.total_visitors || '0'),
        totalSessions: parseInt(sessionsResult.rows[0]?.total_sessions || '0'),
        totalPageViews: parseInt(pageViewsResult.rows[0]?.total_page_views || '0'),
        avgSessionDuration: Math.round(parseFloat(avgSessionResult.rows[0]?.avg_duration || '0')),
        avgPageDuration: Math.round(parseFloat(avgPageResult.rows[0]?.avg_page_duration || '0')),
        activeVisitors: parseInt(activeVisitorsResult.rows[0]?.active_visitors || '0'),
        popularPages: popularPagesResult.rows,
        deviceTypes: deviceTypesResult.rows,
        visitorTypes: visitorTypesResult.rows,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Analytics stats error:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}

