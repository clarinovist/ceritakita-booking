import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/api-v1-auth';
import { logger } from '@/lib/logger';
import {
  getRawBookingDetail,
  getRawPaymentsForBooking,
  getRawAddonsForBooking,
  getRawReschedulesForBooking
} from '@/lib/repositories/bookings';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/bookings/[id]
 * Get full booking detail including payments, addons, reschedule history.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAgentAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;

    // Get booking
    const booking = getRawBookingDetail(id);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get payments
    const payments = getRawPaymentsForBooking(id);

    // Get addons
    const addons = getRawAddonsForBooking(id);

    // Get reschedule history
    const reschedules = getRawReschedulesForBooking(id);

    logger.info('Agent API: booking detail', { bookingId: id });

    return NextResponse.json({
      ...booking,
      payments,
      addons,
      reschedules,
    });
  } catch (error) {
    logger.error('Agent API: booking detail error', { error: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
