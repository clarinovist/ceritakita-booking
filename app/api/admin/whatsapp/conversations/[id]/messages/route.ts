import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getMessages, queueOutbox, processOutboxQueue } from '@/lib/repositories/whatsapp';
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
    const { text } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new AppError('Message text is required', 400, 'BAD_REQUEST');
    }

    const db = getDb();
    const conv = db.prepare('SELECT contact_id FROM whatsapp_conversations WHERE id = ?').get(params.id) as { contact_id: string } | undefined;

    if (!conv) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    // Queue message in outbox
    const outboxId = queueOutbox(params.id, conv.contact_id, text.trim(), 'session_text');

    // Immediately trigger outbox processing asynchronously (do not await, to return quick response)
    processOutboxQueue().catch((err) => {
      console.error('Outbox process error after manual send:', err);
    });

    return NextResponse.json({ success: true, outboxId });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
