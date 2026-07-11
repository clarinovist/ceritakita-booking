import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getWhatsappConversationById, updateWhatsappConversation } from '@/lib/repositories/whatsapp';
import { AppError, createErrorResponse } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface Context {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/admin/whatsapp/conversations/[id]
 * Update conversation status or assignment (with permission checks)
 */
export async function PATCH(request: NextRequest, { params }: Context) {
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
    const { status, assignedTo } = body;

    // Check if conversation exists
    const conv = getWhatsappConversationById(params.id);
    if (!conv) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    updateWhatsappConversation(params.id, { status, assignedTo });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
