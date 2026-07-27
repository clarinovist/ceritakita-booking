import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logger, createErrorResponse } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth) return auth;

  try {
    const body = await request.json();
    const { booking_id, lead_id } = body as { booking_id: string; lead_id: string };

    if (!booking_id || !lead_id) {
      return NextResponse.json({ success: false, error: 'booking_id and lead_id required' }, { status: 400 });
    }

    const db = getDb();

    // Validate booking exists
    const booking = db.prepare(`SELECT id FROM bookings WHERE id = ?`).get(booking_id);
    if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

    const lead = db.prepare(`SELECT id FROM leads WHERE id = ?`).get(lead_id);
    if (!lead) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });

    db.prepare(`UPDATE bookings SET lead_id = ? WHERE id = ?`).run(lead_id, booking_id);
    db.prepare(`UPDATE leads SET booking_id = ?, status = 'Won', converted_at = CURRENT_TIMESTAMP WHERE id = ?`).run(booking_id, lead_id);

    logger.info('Manually linked booking to lead', { booking_id, lead_id });

    return NextResponse.json({ success: true, booking_id, lead_id });
  } catch (e) {
    const { error, statusCode } = createErrorResponse(e as Error);
    return NextResponse.json({ success: false, error: error.message }, { status: statusCode });
  }
}
