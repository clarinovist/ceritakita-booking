import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import {
  getMessages,
  getSessionWindow,
  queueOutbox,
  processOutboxQueue,
  syncOutgoingStatusesForPhone
} from '@/lib/repositories/whatsapp';
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
 * Retrieve message history + 24h session window meta
 * Query: ?sync_status=1 to pull latest delivery status from Watzap
 */
export async function GET(request: NextRequest, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const user = session.user as any;
    if (user.role !== 'admin' && user.permissions?.whatsapp !== true) {
      throw new AppError('Forbidden. WhatsApp permission required.', 403, 'FORBIDDEN');
    }

    const db = getDb();
    const conv = db.prepare(`
      SELECT c.id, c.contact_id, c.last_inbound_at, con.phone_number
      FROM whatsapp_conversations c
      JOIN whatsapp_contacts con ON con.id = c.contact_id
      WHERE c.id = ?
    `).get(params.id) as { id: string; contact_id: string; last_inbound_at: string | null; phone_number: string } | undefined;

    if (!conv) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    const syncStatus = request.nextUrl.searchParams.get('sync_status') === '1'
      || request.nextUrl.searchParams.get('sync_status') === 'true';

    if (syncStatus && conv.phone_number) {
      try {
        await syncOutgoingStatusesForPhone(conv.phone_number, { limit: 30 });
      } catch {
        // non-blocking
      }
    }

    const messages = getMessages(params.id);
    const sessionWindow = getSessionWindow(params.id);

    // Backward-compatible: array still works for old clients, but prefer object
    return NextResponse.json({
      messages,
      session: sessionWindow
    });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * POST /api/admin/whatsapp/conversations/[id]/messages
 * Queue and dispatch a manual outgoing reply (session text or template)
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
    const {
      text,
      sendType,
      templateName,
      templateLanguage,
      parameter,
      syncTemplatesFirst,
      forceSessionText
    } = body;

    const mode = (sendType || 'session_text') as 'session_text' | 'template';
    const sessionWindow = getSessionWindow(params.id);

    if (mode === 'session_text') {
      if (!text || typeof text !== 'string' || !text.trim()) {
        throw new AppError('Message text is required', 400, 'BAD_REQUEST');
      }
      // Soft-block free-form text outside 24h window unless CS explicitly forces
      if (!sessionWindow.isOpen && forceSessionText !== true) {
        throw new AppError(
          'Session 24 jam sudah berakhir. Gunakan template message, atau set forceSessionText=true untuk coba paksa (biasanya ditolak Meta).',
          409,
          'SESSION_CLOSED'
        );
      }
    }

    if (mode === 'template') {
      if (!templateName || typeof templateName !== 'string' || !templateName.trim()) {
        throw new AppError('templateName is required for template send', 400, 'BAD_REQUEST');
      }
      if (syncTemplatesFirst === true) {
        await watzapSyncTemplates();
      }
    }

    const db = getDb();
    const conv = db.prepare(`
      SELECT c.contact_id, con.phone_number
      FROM whatsapp_conversations c
      JOIN whatsapp_contacts con ON con.id = c.contact_id
      WHERE c.id = ?
    `).get(params.id) as { contact_id: string; phone_number: string } | undefined;

    if (!conv) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    const displayText = mode === 'session_text'
      ? text.trim()
      : `[template] ${String(templateName).trim()}`;

    const { outboxId, messageId } = queueOutbox(
      params.id,
      conv.contact_id,
      mode === 'session_text' ? text.trim() : displayText,
      mode,
      mode === 'template'
        ? {
            templateName: templateName.trim(),
            templateLanguage: typeof templateLanguage === 'string' ? templateLanguage : 'id',
            parameter: Array.isArray(parameter) ? parameter : undefined
          }
        : undefined
    );

    try {
      await processOutboxQueue();
    } catch (err) {
      console.error('Outbox process error after manual send:', err);
    }

    // Final status reconciliation for this recipient
    try {
      await syncOutgoingStatusesForPhone(conv.phone_number, { limit: 20 });
    } catch {
      // non-blocking
    }

    const messages = getMessages(params.id);
    const created = messages.find((m) => m.id === messageId) || null;
    const outbox = db.prepare(`
      SELECT id, status, last_error FROM message_outbox WHERE id = ?
    `).get(outboxId) as { id: string; status: string; last_error: string | null } | undefined;

    const sendFailed = outbox?.status === 'failed' || created?.status === 'failed';

    return NextResponse.json({
      success: !sendFailed,
      outboxId,
      messageId,
      message: created,
      messages,
      session: getSessionWindow(params.id),
      outbox: outbox || null,
      error: sendFailed ? (created?.status_error || outbox?.last_error || 'Send failed') : undefined
    }, { status: sendFailed ? 422 : 200 });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
