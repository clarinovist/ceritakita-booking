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
import { getAICompletion, isAIEnabled, isAIDraftEnabled } from '@/lib/services/whatsapp-ai-service';

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

    const latestMessage = customerContext.messageHistory.slice(-1)[0] || null;
    const latestMessageId = latestMessage ? latestMessage.id : null;

    // 2. Call AI Completion (insight + draft is bundled in one response)
    const completion = await getAICompletion(customerContext, 'draft');

    // 3. Keep insights synced in DB
    const provider = process.env.AI_CS_PROVIDER || 'openai';
    const model = process.env.AI_CS_MODEL || (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');
    const modelName = isAIEnabled() ? `${provider}/${model}` : 'fallback/deterministic';
    
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

    // 4. Hard guardrails & safety evaluation before saving draft
    let canAutoSend = !completion.needs_human && completion.risk_level === 'low' && completion.confidence >= 0.85;
    let guardrailNotes = completion.guardrail_notes || 'Draft generated successfully.';

    // Extra programmatic safety checks on draft text
    const textToCheck = (completion.draft_reply || '').toLowerCase();
    const blockedKeywords = ['transfer', 'bukti bayar', 'invoice', 'refund', 'cancel', 'batal', 'reschedule', 'ubah jadwal', 'komplain', 'salah', 'kecewa', 'marah'];
    const hasBlockedKeyword = blockedKeywords.some(kw => textToCheck.includes(kw));

    if (hasBlockedKeyword) {
      canAutoSend = false;
      guardrailNotes += ' [Programmatic Guardrail: Sensitive keywords detected in draft text. CS review required.]';
    }

    if (completion.needs_human) {
      canAutoSend = false;
      guardrailNotes += ' [Needs Human Flagged by AI. CS review required.]';
    }

    // 5. Save draft in DB
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

    // 6. Log AI Event
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
