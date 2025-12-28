import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month

    const client = await getPool().connect();
    
    try {
      // 使用 CTE 合併所有查詢為單一查詢，大幅提升性能
      const statsResult = await client.query(`
        WITH time_range AS (
          SELECT 
            CASE 
              WHEN $1 = 'today' THEN CURRENT_DATE
              WHEN $1 = 'week' THEN CURRENT_DATE - INTERVAL '7 days'
              WHEN $1 = 'month' THEN CURRENT_DATE - INTERVAL '30 days'
              ELSE CURRENT_DATE
            END as start_time
        ),
        session_stats AS (
          SELECT 
            COUNT(DISTINCT visitor_id) as total_visitors,
            COUNT(*) as total_sessions,
            AVG(duration_seconds) as avg_duration
          FROM sessions, time_range
          WHERE started_at >= time_range.start_time
        ),
        page_view_stats AS (
          SELECT 
            COUNT(*) as total_page_views,
            AVG(duration_seconds) as avg_page_duration
          FROM page_views, time_range
          WHERE entered_at >= time_range.start_time
            AND duration_seconds IS NOT NULL
        ),
        active_visitors AS (
          SELECT COUNT(DISTINCT visitor_id) as active_visitors
          FROM sessions
          WHERE started_at >= NOW() - INTERVAL '5 minutes'
            OR (ended_at IS NULL AND started_at >= NOW() - INTERVAL '30 minutes')
        ),
        popular_pages AS (
          SELECT 
            page_path,
            COUNT(*) as view_count,
            AVG(duration_seconds) as avg_duration,
            AVG(scroll_depth) as avg_scroll_depth
          FROM page_views, time_range
          WHERE entered_at >= time_range.start_time
          GROUP BY page_path
          ORDER BY view_count DESC
          LIMIT 10
        ),
        device_distribution AS (
          SELECT 
            device_type,
            COUNT(*) as count
          FROM sessions, time_range
          WHERE started_at >= time_range.start_time
          GROUP BY device_type
        ),
        visitor_types AS (
          SELECT 
            CASE 
              WHEN v.visit_count = 1 THEN 'new'
              ELSE 'returning'
            END as visitor_type,
            COUNT(DISTINCT v.visitor_id) as count
          FROM visitors v
          JOIN sessions s ON s.visitor_id = v.visitor_id, time_range
          WHERE s.started_at >= time_range.start_time
          GROUP BY visitor_type
        )
        SELECT 
          (SELECT total_visitors FROM session_stats) as total_visitors,
          (SELECT total_sessions FROM session_stats) as total_sessions,
          (SELECT total_page_views FROM page_view_stats) as total_page_views,
          (SELECT avg_duration FROM session_stats) as avg_session_duration,
          (SELECT avg_page_duration FROM page_view_stats) as avg_page_duration,
          (SELECT active_visitors FROM active_visitors) as active_visitors,
          COALESCE((SELECT json_agg(row_to_json(t)) FROM popular_pages t), '[]'::json) as popular_pages,
          COALESCE((SELECT json_agg(row_to_json(t)) FROM device_distribution t), '[]'::json) as device_types,
          COALESCE((SELECT json_agg(row_to_json(t)) FROM visitor_types t), '[]'::json) as visitor_types;
      `, [period]);

      const result = statsResult.rows[0];

      return NextResponse.json({
        totalVisitors: parseInt(result?.total_visitors || '0'),
        totalSessions: parseInt(result?.total_sessions || '0'),
        totalPageViews: parseInt(result?.total_page_views || '0'),
        avgSessionDuration: Math.round(parseFloat(result?.avg_session_duration || '0')),
        avgPageDuration: Math.round(parseFloat(result?.avg_page_duration || '0')),
        activeVisitors: parseInt(result?.active_visitors || '0'),
        popularPages: result?.popular_pages || [],
        deviceTypes: result?.device_types || [],
        visitorTypes: result?.visitor_types || [],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Analytics stats error:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}

