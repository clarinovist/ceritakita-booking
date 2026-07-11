
import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/lib/services/booking-service';
import { requireAuth } from '@/lib/auth';
import { priceAdjustmentSchema } from '@/lib/validation';
import { createErrorResponse } from '@/lib/logger';

/**
 * POST /api/bookings/adjust-price
 * Quick endpoint for price adjustments
 */
export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID();

    try {
        // Auth check
        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        // Parse and validate
        const body = await req.json();
        const validation = priceAdjustmentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid input', issues: validation.error.issues },
                { status: 400 }
            );
        }

        const { booking_id, addon_id, quantity, price, reason } = validation.data;

        const result = await bookingService.adjustPrice({
            bookingId: booking_id,
            addonId: addon_id,
            quantity,
            price,
            reason
        }, requestId);

        return NextResponse.json(result);

    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error, requestId);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
