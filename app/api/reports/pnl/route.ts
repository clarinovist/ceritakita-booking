import { NextRequest, NextResponse } from 'next/server';
import { getPnLReport } from '@/lib/services/finance-service';
import { requireAuth } from '@/lib/auth';
import { logger, createErrorResponse } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Get Profit & Loss data
 * GET /api/reports/pnl
 */
export async function GET(req: NextRequest) {
    // Require authentication
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    try {
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const report = getPnLReport(startDate, endDate);

        return NextResponse.json(report);

    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        logger.error('Error generating P&L report', {}, error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
