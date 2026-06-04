import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { markFollowUpSent, getConversationById } from '@/lib/repositories/whatsapp';
import { AppError, createErrorResponse, logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface Context {
  params: {
    id: string;
  };
}

/**
 * POST /api/admin/whatsapp/conversations/[id]/follow-up/mark-sent
 * Record that a follow-up has been performed (increment count, update last_fu_at, clear next_fu_at)
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
    const { mode, note } = body;
    const followUpMode = mode || 'copied';

    if (!['copied', 'sent_wati', 'manual'].includes(followUpMode)) {
      throw new AppError('Invalid follow-up mode', 400, 'BAD_REQUEST');
    }

    // 2. Perform mark sent
    markFollowUpSent(params.id, followUpMode, note || '');

    // 3. Audit Log
    const adminIdentifier = user.username || user.email || user.name || 'unknown';
    logger.info(`[AUDIT] WhatsApp follow-up marked sent by admin: ${adminIdentifier}. Conv: ${params.id}, Mode: ${followUpMode}`, {
      action: 'MARK_FOLLOW_UP_SENT',
      conversationId: params.id,
      mode: followUpMode,
      admin: adminIdentifier
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
