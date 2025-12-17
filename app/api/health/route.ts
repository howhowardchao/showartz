import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// 強制動態，避免被靜態化
export const dynamic = 'force-dynamic';

/**
 * 健康檢查端點
 * 用於監控應用和資料庫狀態
 */
export async function GET() {
  try {
    // 檢查資料庫連接
    const dbCheck = await pool.query('SELECT 1 as health').catch(() => null);
    const dbHealthy = !!dbCheck && dbCheck.rows?.[0]?.health === 1;

    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      database: dbHealthy ? 'connected' : 'unreachable',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      memoryMB: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };

    return NextResponse.json(health, {
      status: dbHealthy ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

