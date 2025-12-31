import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Health Check Endpoint
 *
 * Used by Docker HEALTHCHECK to verify:
 * 1. The application is running
 * 2. Database connectivity is working
 *
 * Returns:
 * - 200 OK with {status: "healthy", timestamp: ISO8601} on success
 * - 503 Service Unavailable with {status: "unhealthy", error: string} on failure
 */
export async function GET() {
  try {
    // Check database connectivity
    const db = getDb();

    // Perform a simple query to verify database is accessible
    const result = db.prepare('SELECT 1 as health_check').get() as { health_check: number };

    if (result.health_check !== 1) {
      throw new Error('Database health check returned unexpected result');
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    }, {
      status: 200,
    });
  } catch (error) {
    logger.error('Health check failed', {}, error as Error);

    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }, {
      status: 503,
    });
  }
}
