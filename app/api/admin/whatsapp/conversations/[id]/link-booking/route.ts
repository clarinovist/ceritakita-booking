import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { linkBookingToConversation, getConversationById } from '@/lib/repositories/whatsapp';
import { readBooking } from '@/lib/repositories/bookings';
import { AppError, createErrorResponse, logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface Context {
  params: {
    id: string;
  };
}

/**
 * POST /api/admin/whatsapp/conversations/[id]/link-booking
 * Link or unlink a booking to a WhatsApp conversation
 */
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const user = session.user as any;
    if (user.role !== 'admin' && user.permissions?.whatsapp !== true) {
      throw new AppError('Forbidden. WhatsApp permission required.', 403, 'FORBIDDEN');
    }

    // 1. Validate conversation exists
    const conversation = getConversationById(params.id);
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    const body = await request.json();
    const { bookingId } = body; // Can be string or null (to unlink)

    // 2. Validate booking exists if bookingId is provided
    const targetBookingId = bookingId ? String(bookingId).trim() : null;
    if (targetBookingId) {
      const booking = readBooking(targetBookingId);
      if (!booking) {
        throw new AppError(`Booking not found: ${targetBookingId}`, 404, 'NOT_FOUND');
      }
    }

    // 3. Link/unlink the booking
    linkBookingToConversation(params.id, targetBookingId || null);

    // 4. Audit Log
    const adminIdentifier = user.username || user.email || user.name || 'unknown';
    logger.info(`[AUDIT] Booking link updated by admin: ${adminIdentifier}. Conversation ${params.id} -> Booking: ${targetBookingId || 'UNLINKED'}`, {
      action: targetBookingId ? 'LINK_BOOKING' : 'UNLINK_BOOKING',
      conversationId: params.id,
      bookingId: targetBookingId,
      admin: adminIdentifier
    });

    return NextResponse.json({ success: true, bookingId: targetBookingId || null });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
