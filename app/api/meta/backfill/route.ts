import { NextRequest, NextResponse } from 'next/server';
import { syncAll } from '@/lib/services/meta-ads-service';
import { logger, createErrorResponse } from '@/lib/logger';

export interface BackfillResponse {
  success: boolean;
  message: string;
  daysBackfilled?: number;
  totalDays?: number;
  errors?: string[];
  campaigns?: number;
  adsets?: number;
  ads?: number;
  insights?: number;
}

/**
 * POST /api/meta/backfill
 * Refactored to use new sync service (single request per level with time_increment=1)
 */
export async function POST(request: NextRequest): Promise<NextResponse<BackfillResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get('days');
    const days = daysParam ? Math.min(parseInt(daysParam), 90) : 30;

    if (isNaN(days) || days < 1) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid days parameter. Must be a number between 1 and 90.',
        },
        { status: 400 }
      );
    }

    logger.info(`Starting backfill via new sync service for ${days} days`, { days });

    const result = await syncAll(days, true);

    if (result.errors.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: `Successfully backfilled ${days} days. ${result.campaigns} campaigns, ${result.adsets} adsets, ${result.ads} ads, ${result.insights} insight rows`,
          daysBackfilled: days,
          totalDays: days,
          campaigns: result.campaigns,
          adsets: result.adsets,
          ads: result.ads,
          insights: result.insights,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Backfill completed with some errors. ${result.insights} insight rows saved. Errors: ${result.errors.join('; ')}`,
          daysBackfilled: days,
          totalDays: days,
          errors: result.errors,
          campaigns: result.campaigns,
          adsets: result.adsets,
          ads: result.ads,
          insights: result.insights,
        },
        { status: 207 }
      );
    }
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Backfill API error', {}, error as Error);

    return NextResponse.json(
      {
        success: false,
        message: errorResponse.message || 'Internal server error during backfill',
      },
      { status: statusCode }
    );
  }
}

/**
 * GET /api/meta/backfill
 * Returns information about the backfill endpoint
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      endpoint: '/api/meta/backfill',
      method: 'POST',
      description: 'Backfill historical ads data for the last N days',
      parameters: {
        days: 'Number of days to backfill (default: 30, max: 90)',
      },
      example: 'POST /api/meta/backfill?days=30',
      note: 'This is a one-time operation. Use it to populate historical daily data.',
    },
    { status: 200 }
  );
}
