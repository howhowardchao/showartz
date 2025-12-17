import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const dbCheck = await pool.query('SELECT 1 as health').catch(() => null);
    const dbHealthy = !!dbCheck && dbCheck.rows?.[0]?.health === 1;

    res
      .status(dbHealthy ? 200 : 503)
      .setHeader('Cache-Control', 'no-store')
      .json({
        status: dbHealthy ? 'healthy' : 'unhealthy',
        database: dbHealthy ? 'connected' : 'unreachable',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
      });
  } catch (error) {
    res
      .status(503)
      .setHeader('Cache-Control', 'no-store')
      .json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
  }
}

