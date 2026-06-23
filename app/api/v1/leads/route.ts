import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/api-v1-auth';
import { getDb } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/leads
 * List leads with optional filters.
 * Query params: status, source, assigned_to, page, limit
 */
export async function GET(req: NextRequest) {
  const authError = requireAgentAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const assignedTo = searchParams.get('assigned_to');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const offset = (page - 1) * limit;

    const db = getDb();
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (source) {
      conditions.push('source = ?');
      params.push(source);
    }
    if (assignedTo) {
      conditions.push('assigned_to = ?');
      params.push(assignedTo);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM leads ${where}`).get(...params) as { total: number };

    const leads = db.prepare(`
      SELECT
        id, created_at, updated_at,
        name, whatsapp, email, status, source,
        interest, notes, assigned_to, booking_id,
        converted_at, last_contacted_at, next_follow_up
      FROM leads
      ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    logger.info('Agent API: leads listed', { count: leads.length, page, limit });

    return NextResponse.json({
      data: leads,
      pagination: {
        page,
        limit,
        total: countRow.total,
        totalPages: Math.ceil(countRow.total / limit),
      },
    });
  } catch (error) {
    logger.error('Agent API: leads error', { error: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
