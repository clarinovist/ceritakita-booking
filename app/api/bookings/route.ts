import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData, readServices, Booking } from '@/lib/storage';

export async function GET() {
    const data = readData();
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { customer, booking, finance } = body;

        // Backend Price Validation
        const services = readServices();
        const service = services.find(s => s.id === customer.serviceId);

        let validatedTotalPrice = 0;
        if (service) {
            validatedTotalPrice = service.basePrice - service.discountValue;
        } else {
            // Fallback or handle error if service not found
            validatedTotalPrice = finance?.total_price || 0;
        }

        const newBooking: Booking = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            status: 'Active',
            customer,
            booking,
            finance: {
                total_price: validatedTotalPrice,
                payments: finance?.payments || []
            }
        };

        const data = readData();
        data.push(newBooking);
        writeData(data);

        return NextResponse.json(newBooking, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }
}
