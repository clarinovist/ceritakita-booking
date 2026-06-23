import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/api-v1-auth';
import { getDb } from '@/lib/db';
import { logger } from '@/lib/logger';

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
    const db = getDb();

    // Get booking
    const booking = db.prepare(`
      SELECT
        b.*, p.name as photographer_name
      FROM bookings b
      LEFT JOIN photographers p ON b.photographer_id = p.id
      WHERE b.id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get payments
    const payments = db.prepare(
      'SELECT id, booking_id, date, amount, note, proof_filename, proof_url, storage_backend, created_at FROM payments WHERE booking_id = ? ORDER BY date ASC'
    ).all(id);

    // Get addons
    const addons = db.prepare(`
      SELECT ba.addon_id, ba.quantity, ba.price_at_booking, a.name
      FROM booking_addons ba
      JOIN addons a ON ba.addon_id = a.id
      WHERE ba.booking_id = ?
    `).all(id);

    // Get reschedule history
    const reschedules = db.prepare(
      'SELECT old_date, new_date, rescheduled_at, reason FROM reschedule_history WHERE booking_id = ? ORDER BY rescheduled_at DESC'
    ).all(id);

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
