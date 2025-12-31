import { NextRequest, NextResponse } from 'next/server';
import { getSuggestedCoupons } from '@/lib/coupons';
import { logger, createErrorResponse } from '@/lib/logger';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { totalAmount } = body;

        if (typeof totalAmount !== 'number' || totalAmount < 0) {
            return NextResponse.json(
                { error: 'Invalid total amount' },
                { status: 400 }
            );
        }

        const suggestions = getSuggestedCoupons(totalAmount);
        return NextResponse.json(suggestions);
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        logger.error('Error getting coupon suggestions', { totalAmount }, error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
