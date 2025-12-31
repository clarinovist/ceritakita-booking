import { NextRequest, NextResponse } from 'next/server';
import { getAllCouponUsage, getCouponUsageHistory } from '@/lib/coupons';
import { requireAuth } from '@/lib/auth';
import { logger, createErrorResponse } from '@/lib/logger';

export async function GET(req: NextRequest) {
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    try {
        const { searchParams } = new URL(req.url);
        const couponId = searchParams.get('couponId');

        if (couponId) {
            // Get usage history for specific coupon
            const history = getCouponUsageHistory(couponId);
            return NextResponse.json(history);
        } else {
            // Get all coupon usage
            const history = getAllCouponUsage();
            return NextResponse.json(history);
        }
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        logger.error('Error fetching coupon usage', { couponId }, error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
