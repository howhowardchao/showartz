import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbCheck = await pool.query('SELECT 1 as health').catch(() => null);
    const dbHealthy = !!dbCheck && dbCheck.rows?.[0]?.health === 1;

    return NextResponse.json(
      {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        database: dbHealthy ? 'connected' : 'unreachable',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
      },
      {
        status: dbHealthy ? 200 : 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

