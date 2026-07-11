import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { AppError, createErrorResponse } from '@/lib/logger';
import { 
  getAIDraftById, 
  updateAIDraftStatus, 
  queueOutbox, 
  processOutboxQueue, 
  logAIEvent,
  getConversationById
} from '@/lib/repositories/whatsapp';

export const dynamic = 'force-dynamic';

interface Context {
  params: {
    id: string;
    draftId: string;
  };
}

/**
 * POST /api/admin/whatsapp/conversations/[id]/ai/drafts/[draftId]/send
 * Approves, modifies, and sends an AI draft reply
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
    const finalDraftText = body.text;

    if (!finalDraftText || typeof finalDraftText !== 'string' || !finalDraftText.trim()) {
      throw new AppError('Send text is required', 400, 'BAD_REQUEST');
    }

    // 1. Get draft & verify conversation match
    const draft = getAIDraftById(draftId);
    if (!draft || draft.conversation_id !== conversationId) {
      throw new AppError('Draft not found or mismatch', 404, 'NOT_FOUND');
    }

    if (draft.status !== 'drafted' && draft.status !== 'approved') {
      throw new AppError(`Draft cannot be sent because status is: ${draft.status}`, 400, 'BAD_REQUEST');
    }

    const conv = getConversationById(conversationId);
    if (!conv) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    // Determine if text was edited by the CS agent
    const isEdited = finalDraftText.trim() !== draft.draft_text.trim();
    const finalStatus = 'sent';

    // 2. Queue in outbox + create local outgoing bubble
    const { outboxId, messageId } = queueOutbox(
      conversationId,
      conv.contact_id,
      finalDraftText.trim(),
      'session_text'
    );

    // 3. Update Draft status
    updateAIDraftStatus(draftId, finalStatus, {
      approvedBy: user.username || 'admin',
      sentOutboxId: outboxId,
      draftText: finalDraftText.trim()
    });

    // 4. Log AI event audit trail
    logAIEvent({
      conversationId,
      eventType: isEdited ? 'edit' : 'approve',
      inputSnapshot: JSON.stringify({ draftId, originalText: draft.draft_text }),
      outputSnapshot: JSON.stringify({ outboxId, messageId, finalStatus, finalDraftText }),
      actor: user.username || 'admin'
    });

    // 5. Dispatch outbox so message is actually sent
    try {
      await processOutboxQueue();
    } catch (err) {
      console.error('[AI Draft Send] Outbox process error:', err);
    }

    return NextResponse.json({
      success: true,
      outboxId,
      messageId
    });

  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
