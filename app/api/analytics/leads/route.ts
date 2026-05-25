import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { AppError, createErrorResponse, createValidationError } from '@/lib/logger';
import { analyticsLeadsQuerySchema } from '@/lib/validation/leads';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = await requireAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const query = {
    start: searchParams.get('start'),
    end: searchParams.get('end')
  };

  const validationResult = analyticsLeadsQuerySchema.safeParse(query);
  if (!validationResult.success) {
    const validationError = createValidationError(validationResult.error.issues);
    return NextResponse.json(validationError.error, { status: validationError.statusCode });
  }

  const { start, end } = validationResult.data;
  const startDateStr = start.includes('T') ? start : `${start} 00:00:00`;
  const endDateStr = end.includes('T') ? end : `${end} 23:59:59`;

  try {
    const db = getDb();

    const totalLeadsQuery = db.prepare(`
      SELECT COUNT(*) as count 
      FROM leads 
      WHERE created_at >= ? AND created_at <= ?
    `);
    const totalLeadsResult = totalLeadsQuery.get(startDateStr, endDateStr) as { count: number };
    const totalLeads = totalLeadsResult.count;

    const totalWonQuery = db.prepare(`
      SELECT COUNT(*) as count 
      FROM leads 
      WHERE status IN ('Won', 'Converted') 
      AND created_at >= ? AND created_at <= ?
    `);
    const totalWonResult = totalWonQuery.get(startDateStr, endDateStr) as { count: number };
    const totalWon = totalWonResult.count;

    const agentStatsQuery = db.prepare(`
      SELECT 
        u.username,
        l.assigned_to,
        COUNT(*) as total,
        SUM(CASE WHEN l.status IN ('Won', 'Converted') THEN 1 ELSE 0 END) as won
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.created_at >= ? AND l.created_at <= ?
      GROUP BY l.assigned_to
      ORDER BY total DESC
    `);

    const agentStatsRaw = agentStatsQuery.all(startDateStr, endDateStr) as Array<{
      username: string | null,
      assigned_to: string | null,
      total: number,
      won: number
    }>;

    const by_agent = agentStatsRaw.map(stat => {
      const name = stat.username || (stat.assigned_to ? 'Unknown Admin' : 'Unassigned');
      const conversion_rate = stat.total > 0 ? (stat.won / stat.total) * 100 : 0;

      return {
        name,
        assigned_to: stat.assigned_to,
        total: stat.total,
        won: stat.won,
        conversion_rate
      };
    });

    const globalConversionRate = totalLeads > 0 ? (totalWon / totalLeads) * 100 : 0;

    return NextResponse.json({
      total_leads: totalLeads,
      total_won: totalWon,
      conversion_rate: globalConversionRate,
      by_agent
    });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(
      error instanceof Error ? error : new AppError('Internal Server Error')
    );
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
