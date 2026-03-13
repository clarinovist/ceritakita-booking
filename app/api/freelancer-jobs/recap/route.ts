import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getFreelancerMonthlyRecap } from '@/lib/services/freelancer-service';
import { logger, createErrorResponse } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
    try {
        const rateLimitResult = rateLimiters.moderate(req);
        if (rateLimitResult) return rateLimitResult;

        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        const { searchParams } = new URL(req.url);
        const year = searchParams.get('year');
        const month = searchParams.get('month');

        if (!year || !month) {
            return NextResponse.json({ error: 'Year and month are required parameters' }, { status: 400 });
        }

        const recap = getFreelancerMonthlyRecap(year, month);
        
        return NextResponse.json(recap);
    } catch (error) {
        logger.error('Error generating freelancer recap', { error });
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
