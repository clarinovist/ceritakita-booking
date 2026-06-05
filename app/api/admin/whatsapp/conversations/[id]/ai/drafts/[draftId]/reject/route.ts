import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { AppError, createErrorResponse } from '@/lib/logger';
import { 
  getAIDraftById, 
  updateAIDraftStatus, 
  logAIEvent 
} from '@/lib/repositories/whatsapp';

export const dynamic = 'force-dynamic';

interface Context {
  params: {
    id: string;
    draftId: string;
  };
}

/**
 * POST /api/admin/whatsapp/conversations/[id]/ai/drafts/[draftId]/reject
 * Rejects an AI draft reply with reason
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

    const { id: conversationId, draftId } = params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'No reason provided';

    // 1. Get draft & verify conversation match
    const draft = getAIDraftById(draftId);
    if (!draft || draft.conversation_id !== conversationId) {
      throw new AppError('Draft not found or mismatch', 404, 'NOT_FOUND');
    }

    // 2. Update status to rejected
    updateAIDraftStatus(draftId, 'rejected');

    // 3. Log event
    logAIEvent({
      conversationId,
      eventType: 'reject',
      inputSnapshot: JSON.stringify({ draftId, reason }),
      outputSnapshot: JSON.stringify({ status: 'rejected' }),
      actor: user.username || 'admin'
    });

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
