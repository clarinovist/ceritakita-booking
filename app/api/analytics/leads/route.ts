import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { AppError, createErrorResponse, createValidationError } from '@/lib/logger';
import { analyticsLeadsQuerySchema } from '@/lib/validation/leads';
import { getLeadAnalyticsStats } from '@/lib/repositories/analytics';

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
    const { totalLeads, totalWon, agentStats } = getLeadAnalyticsStats(startDateStr, endDateStr);

    const by_agent = agentStats.map(stat => {
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
