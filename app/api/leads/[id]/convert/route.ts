import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getLeadById, convertLeadToBooking } from '@/lib/leads';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

interface Context {
  params: {
    id: string;
  };
}

/**
 * POST /api/leads/[id]/convert
 * Convert a lead to a booking
 */
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    // service_id is currently unused as per line 55
    await request.json();

    // Check if lead exists
    const lead = await getLeadById(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Only allow conversion of 'Won' leads
    if (lead.status !== 'Won') {
      return NextResponse.json(
        { error: 'Only leads with status "Won" can be converted to bookings' },
        { status: 400 }
      );
    }

    // Check if already converted
    if (lead.booking_id) {
      return NextResponse.json(
        { error: 'This lead has already been converted to a booking' },
        { status: 400 }
      );
    }

    // Create a basic booking from lead data
    const db = getDb();
    const bookingId = randomUUID();
    const now = new Date().toISOString();

    // If no service_id provided, we need to handle this case
    // For now, we'll create a placeholder booking that needs service selection
    const stmt = db.prepare(`
      INSERT INTO bookings (
        id, created_at, status,
        customer_name, customer_whatsapp, customer_category,
        booking_date, booking_notes,
        total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Set booking date to next follow-up if available, otherwise 7 days from now
    let bookingDate = lead.next_follow_up;
    if (!bookingDate) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      bookingDate = nextWeek.toISOString().split('T')[0] + 'T10:00';
    }

    stmt.run(
      bookingId,
      now,
      'Active',
      lead.name,
      lead.whatsapp,
      'General', // Default category
      bookingDate,
      `Converted from lead: ${lead.id}${lead.notes ? '\n' + lead.notes : ''}`,
      0 // Default price
    );

    // Update lead to mark as converted
    await convertLeadToBooking(id, bookingId);

    // Fetch the created booking
    const bookingStmt = db.prepare('SELECT * FROM bookings WHERE id = ?');

    interface BookingRow {
      id: string;
      created_at: string;
      status: string;
      customer_name: string;
      customer_whatsapp: string;
      customer_category: string;
      customer_service_id?: string;
      booking_date: string;
      booking_notes?: string;
      booking_location_link?: string;
      total_price: number;
      service_base_price?: number;
      base_discount?: number;
      addons_total?: number;
      coupon_discount?: number;
      coupon_code?: string;
      photographer_id?: string;
    }

    const bookingRow = bookingStmt.get(bookingId) as BookingRow;

    // Transform to expected format
    const booking = {
      id: bookingRow.id,
      created_at: bookingRow.created_at,
      status: bookingRow.status,
      customer: {
        name: bookingRow.customer_name,
        whatsapp: bookingRow.customer_whatsapp,
        category: bookingRow.customer_category,
        serviceId: bookingRow.customer_service_id
      },
      booking: {
        date: bookingRow.booking_date,
        notes: bookingRow.booking_notes,
        location_link: bookingRow.booking_location_link
      },
      finance: {
        total_price: bookingRow.total_price,
        payments: [],
        service_base_price: bookingRow.service_base_price,
        base_discount: bookingRow.base_discount,
        addons_total: bookingRow.addons_total,
        coupon_discount: bookingRow.coupon_discount,
        coupon_code: bookingRow.coupon_code
      },
      photographer_id: bookingRow.photographer_id
    };

    return NextResponse.json({
      success: true,
      message: 'Lead converted to booking successfully',
      lead: await getLeadById(id),
      booking
    });
  } catch (error) {
    console.error('Error converting lead to booking:', error);
    return NextResponse.json(
      { error: 'Failed to convert lead to booking' },
      { status: 500 }
    );
  }
}