import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCashPositionReport } from '@/lib/services/finance-service';
import { logger, createErrorResponse } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Handle GET /api/reports/cash-position
 */
export async function GET(req: NextRequest) {
    try {
        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        const { searchParams } = new URL(req.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        const report = getCashPositionReport(startDateParam, endDateParam);

        return NextResponse.json(report);

    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        logger.error('Error generating cash position report', {}, error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
