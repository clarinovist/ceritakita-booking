import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/api-v1-auth';
import { getDb } from '@/lib/db';
import { logger } from '@/lib/logger';

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

    const db = getDb();
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (status) {
      conditions.push('b.status = ?');
      params.push(status);
    }
    if (startDate) {
      conditions.push('b.booking_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('b.booking_date <= ?');
      params.push(endDate);
    }
    if (photographer) {
      conditions.push('b.photographer_id = ?');
      params.push(photographer);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM bookings b ${where}`).get(...params) as { total: number };

    // Get bookings with photographer name
    const bookings = db.prepare(`
      SELECT
        b.id, b.created_at, b.status,
        b.customer_name, b.customer_whatsapp, b.customer_category,
        b.booking_date, b.booking_notes,
        b.total_price, b.service_base_price, b.base_discount,
        b.addons_total, b.coupon_discount, b.coupon_code,
        b.photographer_id, b.updated_at,
        p.name as photographer_name
      FROM bookings b
      LEFT JOIN photographers p ON b.photographer_id = p.id
      ${where}
      ORDER BY b.booking_date DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    logger.info('Agent API: bookings listed', { count: bookings.length, page, limit });

    return NextResponse.json({
      data: bookings,
      pagination: {
        page,
        limit,
        total: countRow.total,
        totalPages: Math.ceil(countRow.total / limit),
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
