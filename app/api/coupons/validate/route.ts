import { NextRequest, NextResponse } from 'next/server';
import { validateBookingCoupon } from '@/lib/services/coupon-service';
import { z } from 'zod';
import { rateLimiters } from '@/lib/rate-limit';
import { logger, createErrorResponse } from '@/lib/logger';

export async function POST(req: NextRequest) {
    try {
        const limited = rateLimiters.moderate(req);
        if (limited) return limited;
        const parsed = z.object({
            code: z.string().trim().min(1).max(100),
            totalAmount: z.number().finite().nonnegative(),
        }).safeParse(await req.json());

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Kode kupon dan total pembelian diperlukan' },
                { status: 400 }
            );
        }

        const result = validateBookingCoupon(parsed.data.code, parsed.data.totalAmount);

        if (!result.valid) {
            return NextResponse.json(
                { valid: false, error: result.error },
                { status: 200 }
            );
        }

        return NextResponse.json({
            valid: true,
            coupon: {
                code: result.coupon!.code,
                discount_type: result.coupon!.discount_type,
                discount_value: result.coupon!.discount_value
            },
            discount_amount: result.discount_amount
        });
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        logger.error('Error validating coupon', {}, error as Error);
        return NextResponse.json(
            { ...errorResponse, error: 'Terjadi kesalahan saat memvalidasi kupon' },
            { status: statusCode }
        );
    }
}
