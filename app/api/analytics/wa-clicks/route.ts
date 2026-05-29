import { NextRequest, NextResponse } from 'next/server';
import { getWaClicksByDay, getWaClicksCount } from '@/lib/repositories/analytics';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { AppError, createErrorResponse, createValidationError } from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Query validation schema
const waClicksQuerySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * GET /api/analytics/wa-clicks
 * Fetches WA click redirect analytics from wa_clicks table
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any)?.role !== 'admin') {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { searchParams } = new URL(req.url);

    const validationResult = waClicksQuerySchema.safeParse({
      start: searchParams.get('start') || undefined,
      end: searchParams.get('end') || undefined,
    });

    if (!validationResult.success) {
      const validationError = createValidationError(validationResult.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    const { start, end } = validationResult.data;

    const [dailyStats, totalCount] = await Promise.all([
      getWaClicksByDay(start, end),
      getWaClicksCount(start, end),
    ]);

    return NextResponse.json({
      total: totalCount,
      daily: dailyStats,
      period: { start, end },
    });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
