import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { AppError, createErrorResponse } from '@/lib/logger';
import { 
  buildWhatsAppCustomerContext, 
  saveAIDraft, 
  saveConversationInsight,
  logAIEvent 
} from '@/lib/repositories/whatsapp';
import { generateAndEvaluateDraft, getAIRuntimeConfig, isAIEnabled, isAIDraftEnabled } from '@/lib/services/whatsapp-ai-service';

export const dynamic = 'force-dynamic';

interface Context {
  params: {
    id: string;
  };
}

/**
 * POST /api/admin/whatsapp/conversations/[id]/ai/draft
 * Generates an AI-assisted draft reply
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

    const conversationId = params.id;
    const body = await request.json().catch(() => ({}));
    const tone = body.tone || 'friendly_professional';

    if (!isAIDraftEnabled()) {
      throw new AppError('AI draft is disabled by AI_CS_DRAFT_ENABLED', 400, 'AI_DISABLED');
    }

    // 1. Build context
    const customerContext = buildWhatsAppCustomerContext(conversationId);
    if (!customerContext) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    // 2. Generate and evaluate draft using whatsapp-ai-service
    const { completion, canAutoSend, guardrailNotes, latestMessageId } = await generateAndEvaluateDraft(customerContext);

    // 3. Keep insights synced in DB
    const cfg = getAIRuntimeConfig();
    const modelName = isAIEnabled() ? `${cfg.provider}/${cfg.model}` : 'fallback/deterministic';
    
    saveConversationInsight({
      conversationId,
      summary: completion.summary,
      intent: completion.intent,
      sentiment: completion.sentiment,
      urgency: completion.urgency,
      riskLevel: completion.risk_level,
      needsHuman: completion.needs_human,
      suggestedNextAction: completion.suggested_next_action,
      confidence: completion.confidence,
      modelName,
      sourceMessageId: latestMessageId
    });

    // 4. Save draft in DB
    const draftId = saveAIDraft({
      conversationId,
      messageId: latestMessageId,
      draftText: completion.draft_reply || '',
      draftType: completion.needs_human ? 'handover' : 'reply',
      status: 'drafted',
      riskLevel: completion.risk_level,
      guardrailNotes,
      createdBy: 'ai',
      modelName,
      promptVersion: 'v1.0'
    });

    // 5. Log AI Event
    logAIEvent({
      conversationId,
      eventType: 'draft',
      inputSnapshot: JSON.stringify({ conversationId, tone, latestMessageId }),
      outputSnapshot: JSON.stringify({ draftId, completion, canAutoSend, guardrailNotes }),
      actor: 'system'
    });

    return NextResponse.json({
      success: true,
      draft: {
        id: draftId,
        text: completion.draft_reply || '',
        riskLevel: completion.risk_level,
        needsHuman: completion.needs_human,
        canAutoSend,
        guardrailNotes
      }
    });

  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
