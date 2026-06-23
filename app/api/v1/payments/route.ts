import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/api-v1-auth';
import { getDb } from '@/lib/db';
import { logger } from '@/lib/logger';

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

    const db = getDb();
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (bookingId) {
      conditions.push('pay.booking_id = ?');
      params.push(bookingId);
    }
    if (startDate) {
      conditions.push('pay.date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('pay.date <= ?');
      params.push(endDate);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM payments pay ${where}`).get(...params) as { total: number };

    const payments = db.prepare(`
      SELECT
        pay.id, pay.booking_id, pay.date, pay.amount,
        pay.note, pay.proof_filename, pay.proof_url,
        pay.storage_backend, pay.created_at,
        b.customer_name, b.customer_whatsapp
      FROM payments pay
      LEFT JOIN bookings b ON pay.booking_id = b.id
      ${where}
      ORDER BY pay.date DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    logger.info('Agent API: payments listed', { count: payments.length, page, limit });

    return NextResponse.json({
      data: payments,
      pagination: {
        page,
        limit,
        total: countRow.total,
        totalPages: Math.ceil(countRow.total / limit),
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
