import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/storage';

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing Booking ID' }, { status: 400 });
        }

        const data = readData();
        const index = data.findIndex((b) => b.id === id);

        if (index === -1) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Merge updates
        const updatedBooking = { ...data[index], ...updates };
        data[index] = updatedBooking;

        writeData(data);

        return NextResponse.json(updatedBooking);
    } catch {
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }
}
