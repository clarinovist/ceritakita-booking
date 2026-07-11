import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/api-v1-auth';
import { logger } from '@/lib/logger';
import { getRawBookingsList } from '@/lib/repositories/bookings';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/bookings
 * List bookings with optional filters and pagination.
 * Query params: status, startDate, endDate, page, limit, photographer
 */
export async function GET(req: NextRequest) {
  const authError = requireAgentAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const photographer = searchParams.get('photographer');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const offset = (page - 1) * limit;

    const { total, bookings } = getRawBookingsList({
      status,
      startDate,
      endDate,
      photographer,
      limit,
      offset
    });

    logger.info('Agent API: bookings listed', { count: bookings.length, page, limit });

    return NextResponse.json({
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Agent API: bookings error', { error: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
