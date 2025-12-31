import { NextRequest, NextResponse } from 'next/server';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon, getCouponById } from '@/lib/coupons';
import { requireAuth } from '@/lib/auth';
import { logger, createErrorResponse } from '@/lib/logger';

// GET - Get all coupons
export async function GET(req: NextRequest) {
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    try {
        const coupons = getAllCoupons();
        return NextResponse.json(coupons);
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        logger.error('Error fetching coupons', {}, error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}

// POST - Create new coupon
export async function POST(req: NextRequest) {
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    try {
        const body = await req.json();

        // Validation
        if (!body.code || !body.discount_type || body.discount_value === undefined) {
            return NextResponse.json(
                { error: 'Code, discount_type, and discount_value are required' },
                { status: 400 }
            );
        }

        if (body.discount_type === 'percentage' && (body.discount_value < 0 || body.discount_value > 100)) {
            return NextResponse.json(
                { error: 'Percentage discount must be between 0 and 100' },
                { status: 400 }
            );
        }

        const id = createCoupon({
            code: body.code,
            discount_type: body.discount_type,
            discount_value: body.discount_value,
            min_purchase: body.min_purchase,
            max_discount: body.max_discount,
            usage_limit: body.usage_limit,
            valid_from: body.valid_from,
            valid_until: body.valid_until,
            is_active: body.is_active !== undefined ? body.is_active : true,
            description: body.description
        });

        const coupon = getCouponById(id);
        return NextResponse.json(coupon, { status: 201 });
    } catch (error: unknown) {
        const errorObj = error as Error;
        logger.error('Error creating coupon', { code: body.code }, errorObj);
        
        if (errorObj.message?.includes('UNIQUE')) {
            return NextResponse.json(
                { error: 'Kode kupon sudah digunakan', code: 'DUPLICATE_COUPON_CODE' },
                { status: 409 }
            );
        }
        
        const { error: errorResponse, statusCode } = createErrorResponse(errorObj);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}

// PUT - Update coupon
export async function PUT(req: NextRequest) {
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    try {
        const body = await req.json();

        if (!body.id) {
            return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
        }

        updateCoupon(body.id, {
            code: body.code,
            discount_type: body.discount_type,
            discount_value: body.discount_value,
            min_purchase: body.min_purchase,
            max_discount: body.max_discount,
            usage_limit: body.usage_limit,
            valid_from: body.valid_from,
            valid_until: body.valid_until,
            is_active: body.is_active,
            description: body.description
        });

        const updatedCoupon = getCouponById(body.id);
        return NextResponse.json(updatedCoupon);
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        logger.error('Error updating coupon', { couponId: body.id }, error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}

// DELETE - Delete coupon
export async function DELETE(req: NextRequest) {
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
        }

        deleteCoupon(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        logger.error('Error deleting coupon', { couponId: id }, error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
