import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { AppError, createErrorResponse } from '@/lib/logger';
import { 
  buildWhatsAppCustomerContext, 
  saveConversationInsight, 
  getLatestConversationInsight,
  logAIEvent 
} from '@/lib/repositories/whatsapp';
import { getAICompletion, isAIEnabled, isAIInsightEnabled } from '@/lib/services/whatsapp-ai-service';

export const dynamic = 'force-dynamic';

interface Context {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/whatsapp/conversations/[id]/ai/insight
 * Loads the latest conversation insight from the database (fast)
 */
export async function GET(_request: NextRequest, { params }: Context) {
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
    const insight = getLatestConversationInsight(conversationId);

    return NextResponse.json({
      success: true,
      insight: insight ? {
        intent: insight.intent,
        sentiment: insight.sentiment,
        urgency: insight.urgency,
        riskLevel: insight.risk_level,
        needsHuman: insight.needs_human,
        summary: insight.summary,
        suggestedNextAction: insight.suggested_next_action,
        confidence: insight.confidence,
        modelName: insight.model_name,
        updatedAt: insight.updated_at
      } : null
    });

  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * POST /api/admin/whatsapp/conversations/[id]/ai/insight
 * Generates or refreshes insights for a conversation via AI Brain
 */
export async function POST(_request: NextRequest, { params }: Context) {
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

    if (!isAIInsightEnabled()) {
      throw new AppError('AI insight is disabled by AI_CS_INSIGHT_ENABLED', 400, 'AI_DISABLED');
    }

    // 1. Build context
    const customerContext = buildWhatsAppCustomerContext(conversationId);
    if (!customerContext) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    // Get latest message for audit trace
    const latestMessage = customerContext.messageHistory.slice(-1)[0] || null;
    const latestMessageId = latestMessage ? latestMessage.id : null;

    // 2. Call AI Completion
    const completion = await getAICompletion(customerContext, 'insight');

    // 3. Save to DB
    const provider = process.env.AI_CS_PROVIDER || 'openai';
    const model = process.env.AI_CS_MODEL || (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');
    const insightId = saveConversationInsight({
      conversationId,
      summary: completion.summary,
      intent: completion.intent,
      sentiment: completion.sentiment,
      urgency: completion.urgency,
      riskLevel: completion.risk_level,
      needsHuman: completion.needs_human,
      suggestedNextAction: completion.suggested_next_action,
      confidence: completion.confidence,
      modelName: isAIEnabled() ? `${provider}/${model}` : 'fallback/deterministic',
      sourceMessageId: latestMessageId
    });

    // 4. Log event
    logAIEvent({
      conversationId,
      eventType: 'classify',
      inputSnapshot: JSON.stringify({ conversationId, latestMessageId }),
      outputSnapshot: JSON.stringify(completion),
      actor: 'system'
    });

    return NextResponse.json({
      success: true,
      insightId,
      insight: {
        intent: completion.intent,
        sentiment: completion.sentiment,
        urgency: completion.urgency,
        riskLevel: completion.risk_level,
        needsHuman: completion.needs_human,
        summary: completion.summary,
        suggestedNextAction: completion.suggested_next_action,
        confidence: completion.confidence,
        guardrailNotes: completion.guardrail_notes
      }
    });

  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
