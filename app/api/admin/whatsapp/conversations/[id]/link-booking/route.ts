import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { linkBookingToConversation } from '@/lib/repositories/whatsapp';
import { AppError, createErrorResponse } from '@/lib/logger';

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

    const body = await request.json();
    const { bookingId } = body; // Can be string or null (to unlink)

    linkBookingToConversation(params.id, bookingId || null);

    return NextResponse.json({ success: true, bookingId: bookingId || null });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
