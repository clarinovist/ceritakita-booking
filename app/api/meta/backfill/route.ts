import { NextRequest, NextResponse } from 'next/server';
// ✅ Ganti import lama dengan ini:
import { backfillAdsHistory } from '@/lib/storage-sqlite';
import { logger, createErrorResponse } from '@/lib/logger';

export interface BackfillResponse {
  success: boolean;
  message: string;
  daysBackfilled?: number;
  totalDays?: number;
  errors?: string[];
}

/**
 * POST /api/meta/backfill
 * Backfill historical ads data for the last N days
 *
 * Query params:
 * - days: Number of days to backfill (default: 30, max: 90)
 *
 * This is a one-time operation to populate historical daily data
 */
export async function POST(request: NextRequest): Promise<NextResponse<BackfillResponse>> {
  try {
    // Get environment variables
    const accessToken = process.env.META_ACCESS_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID;
    const apiVersion = process.env.META_API_VERSION || 'v19.0';

    // Validate environment variables
    if (!accessToken || !adAccountId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required environment variables: META_ACCESS_TOKEN or META_AD_ACCOUNT_ID',
        },
        { status: 500 }
      );
    }

    // Get days parameter from query string
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get('days');
    const days = daysParam ? Math.min(parseInt(daysParam), 90) : 30; // Max 90 days

    if (isNaN(days) || days < 1) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid days parameter. Must be a number between 1 and 90.',
        },
        { status: 400 }
      );
    }

    logger.info(`Starting backfill for ${days} days`, { days });

    // Perform backfill
    const result = await backfillAdsHistory(accessToken, adAccountId, days, apiVersion);

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: `Successfully backfilled ${result.daysBackfilled} out of ${days} days`,
          daysBackfilled: result.daysBackfilled,
          totalDays: days,
          errors: result.errors.length > 0 ? result.errors : undefined,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Backfill completed with errors. ${result.daysBackfilled} out of ${days} days were backfilled.`,
          daysBackfilled: result.daysBackfilled,
          totalDays: days,
          errors: result.errors,
        },
        { status: 207 } // Multi-status
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
