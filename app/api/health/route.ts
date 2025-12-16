import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * 健康檢查端點
 * 用於監控應用和資料庫狀態
 */
export async function GET() {
  try {
    // 檢查資料庫連接
    const dbCheck = await pool.query('SELECT 1 as health').catch(() => null);
    const dbHealthy = dbCheck !== null;

    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealthy ? 'connected' : 'disconnected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    };

    return NextResponse.json(health, {
      status: dbHealthy ? 200 : 503,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

