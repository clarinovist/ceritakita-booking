import { NextRequest, NextResponse } from 'next/server';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon, getCouponById } from '@/lib/coupons';
import { requireAuth } from '@/lib/auth';

// GET - Get all coupons
export async function GET(req: NextRequest) {
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    try {
        const coupons = getAllCoupons();
        return NextResponse.json(coupons);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
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
    } catch (error: any) {
        console.error('Error creating coupon:', error);
        if (error.message?.includes('UNIQUE')) {
            return NextResponse.json({ error: 'Kode kupon sudah digunakan' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
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
        console.error('Error updating coupon:', error);
        return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
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
        console.error('Error deleting coupon:', error);
        return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
    }
}
