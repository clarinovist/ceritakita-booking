import { NextRequest, NextResponse } from 'next/server';
import { getSuggestedCoupons } from '@/lib/coupons';

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
        console.error('Error getting coupon suggestions:', error);
        return NextResponse.json(
            { error: 'Failed to get suggestions' },
            { status: 500 }
        );
    }
}
