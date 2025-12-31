import { NextRequest, NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/coupons';
import { logger, createErrorResponse } from '@/lib/logger';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code, totalAmount } = body;

        if (!code || typeof totalAmount !== 'number') {
            return NextResponse.json(
                { error: 'Kode kupon dan total pembelian diperlukan' },
                { status: 400 }
            );
        }

        const result = validateCoupon(code, totalAmount);

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
        logger.error('Error validating coupon', { code: body.code }, error as Error);
        return NextResponse.json(
            { ...errorResponse, error: 'Terjadi kesalahan saat memvalidasi kupon' },
            { status: statusCode }
        );
    }
}
