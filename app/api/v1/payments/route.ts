import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/api-v1-auth';
import { logger } from '@/lib/logger';
import { getRawPaymentsList } from '@/lib/repositories/bookings';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/payments
 * List payments with optional booking_id or date range filter.
 * Query params: booking_id, startDate, endDate, page, limit
 */
export async function GET(req: NextRequest) {
  const authError = requireAgentAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('booking_id');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const offset = (page - 1) * limit;

    const { total, payments } = getRawPaymentsList({
      bookingId,
      startDate,
      endDate,
      limit,
      offset
    });

    logger.info('Agent API: payments listed', { count: payments.length, page, limit });

    return NextResponse.json({
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Agent API: payments error', { error: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
