import { NextRequest, NextResponse } from 'next/server';
import { readBooking, updateBooking } from '@/lib/storage-sqlite';
import { requireAuth } from '@/lib/auth';
import { updateBookingSchema } from '@/lib/validation';

export async function PUT(req: NextRequest) {
    // Require authentication for updating bookings
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    try {
        const body = await req.json();

        // Validate input using Zod
        const validationResult = updateBookingSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.issues },
                { status: 400 }
            );
        }

        const { id, ...updates } = validationResult.data;

        const currentBooking = readBooking(id);

        if (!currentBooking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Only update allowed fields (no arbitrary field injection)
        const updatedBooking = {
            ...currentBooking,
            ...(updates.status && { status: updates.status }),
            ...(updates.booking && { booking: { ...currentBooking.booking, ...updates.booking } }),
            ...(updates.finance && { finance: updates.finance }),
            ...(updates.customer && { customer: { ...currentBooking.customer, ...updates.customer } }),
            ...(updates.photographer_id !== undefined && { photographer_id: updates.photographer_id }),
            ...(updates.addons !== undefined && { addons: updates.addons }),
        };

        // Save to SQLite database
        updateBooking(updatedBooking);

        return NextResponse.json(updatedBooking);
    } catch (error) {
        console.error('Error updating booking:', error);
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }
}
