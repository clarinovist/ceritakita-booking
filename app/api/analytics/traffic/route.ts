import { NextRequest, NextResponse } from 'next/server';
import { getTrafficStats, getTopPages, getTrafficSources } from '@/lib/repositories/analytics';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { AppError, createErrorResponse, createValidationError } from '@/lib/logger';
import { analyticsTrafficQuerySchema } from '@/lib/validation/api-routes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { searchParams } = new URL(req.url);
    const validationResult = analyticsTrafficQuerySchema.safeParse({
      start: searchParams.get('start') || undefined,
      end: searchParams.get('end') || undefined,
    });

    if (!validationResult.success) {
      const validationError = createValidationError(validationResult.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    const { start, end } = validationResult.data;
    const stats = getTrafficStats(start, end);
    const topPages = getTopPages(start, end);
    const sources = getTrafficSources(start, end);

    return NextResponse.json({
      traffic: stats,
      topPages,
      sources
    });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
