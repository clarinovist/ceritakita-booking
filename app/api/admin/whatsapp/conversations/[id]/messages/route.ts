import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getMessages, queueOutbox, processOutboxQueue } from '@/lib/repositories/whatsapp';
import { watzapSyncTemplates } from '@/lib/watzap';
import { getDb } from '@/lib/db';
import { AppError, createErrorResponse } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface Context {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/whatsapp/conversations/[id]/messages
 * Retrieve message history for a conversation
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

    const messages = getMessages(params.id);
    return NextResponse.json(messages);
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * POST /api/admin/whatsapp/conversations/[id]/messages
 * Queue and dispatch a manual outgoing reply
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
    const { text, sendType, templateName, templateLanguage, parameter, syncTemplatesFirst } = body;

    const mode = (sendType || 'session_text') as 'session_text' | 'template';

    if (mode === 'session_text') {
      if (!text || typeof text !== 'string' || !text.trim()) {
        throw new AppError('Message text is required', 400, 'BAD_REQUEST');
      }
    }

    if (mode === 'template') {
      if (!templateName || typeof templateName !== 'string' || !templateName.trim()) {
        throw new AppError('templateName is required for template send', 400, 'BAD_REQUEST');
      }
      if (syncTemplatesFirst === true) {
        // Non-blocking best effort sync to reduce template-not-found errors
        await watzapSyncTemplates();
      }
    }

    const db = getDb();
    const conv = db.prepare('SELECT contact_id FROM whatsapp_conversations WHERE id = ?').get(params.id) as { contact_id: string } | undefined;

    if (!conv) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    // Queue message in outbox + create local outgoing bubble immediately
    const { outboxId, messageId } = queueOutbox(
      params.id,
      conv.contact_id,
      mode === 'session_text' ? text.trim() : '[template]',
      mode,
      mode === 'template'
        ? {
            templateName: templateName.trim(),
            templateLanguage: typeof templateLanguage === 'string' ? templateLanguage : undefined,
            parameter: Array.isArray(parameter) ? parameter : undefined
          }
        : undefined
    );

    // Await dispatch so provider status is reflected before UI reloads
    try {
      await processOutboxQueue();
    } catch (err) {
      console.error('Outbox process error after manual send:', err);
    }

    const messages = getMessages(params.id);
    const created = messages.find((m) => m.id === messageId) || null;

    return NextResponse.json({
      success: true,
      outboxId,
      messageId,
      message: created,
      messages
    });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
