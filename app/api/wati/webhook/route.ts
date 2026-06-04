import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  saveRawEvent,
  updateRawEventStatus,
  upsertContact,
  upsertConversation,
  insertMessageIdempotent
} from '@/lib/repositories/whatsapp';

export const dynamic = 'force-dynamic';

/**
 * POST /api/wati/webhook
 * Ingests incoming messages or status updates from WATI
 */
export async function POST(req: NextRequest) {
  const eventId = crypto.randomUUID();
  let rawEventDbId: string | null = null;

  try {
    // ── Shared secret / signature check ──
    const secretHeader = req.headers.get('x-wati-webhook-secret') || req.nextUrl.searchParams.get('secret');
    const expectedSecret = process.env.WATI_WEBHOOK_SECRET;
    if (expectedSecret && secretHeader !== expectedSecret) {
      logger.warn('WATI Webhook unauthorized request: secret mismatch', { eventId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    logger.info('WATI Webhook received payload', { eventId, payload });

    // Save raw event for traceability & debugging
    const eventType = payload.eventType || payload.type || 'message';
    const watiId = payload.id || payload.messageId || null;
    rawEventDbId = saveRawEvent(eventType, watiId, JSON.stringify(payload));

    // Handle message event
    // Typical WATI message webhook fields:
    // - waId or whatsappNumber or phone (sender)
    // - senderName or name (sender display name)
    // - text or messageText or body (message content)
    // - id or messageId (unique message ID)
    // - timestamp (unix timestamp or ISO string)
    // - owner (boolean, true if message sent by us/business)
    const phone = payload.waId || payload.phone || payload.whatsappNumber || payload.senderNumber;
    const name = payload.senderName || payload.name || payload.displayName || 'WhatsApp User';
    
    if (!phone) {
      logger.warn('WATI Webhook missing sender phone number, skipping processing', { eventId });
      updateRawEventStatus(rawEventDbId, 'processed', 'No phone number found in payload');
      return NextResponse.json({ success: true, message: 'Skipped - no phone number' });
    }

    // Extract message content
    const text = payload.text || payload.messageText || payload.message || payload.body || '';
    const messageId = payload.id || payload.messageId || payload.wamid || null;
    
    // Parse timestamp (can be unix epoch in seconds, milliseconds, or ISO string)
    let watiTimestamp = new Date().toISOString();
    if (payload.timestamp) {
      const ts = Number(payload.timestamp);
      if (!isNaN(ts)) {
        // If unix timestamp is in seconds, convert to ms
        const ms = ts < 9999999999 ? ts * 1000 : ts;
        watiTimestamp = new Date(ms).toISOString();
      } else {
        watiTimestamp = new Date(payload.timestamp).toISOString();
      }
    }

    // Determine direction and sender type
    const isOwner = payload.owner === true || payload.isOwner === true || payload.direction === 'outgoing';
    const direction = isOwner ? 'outgoing' : 'incoming';
    const senderType = isOwner ? 'cs' : 'customer';
    const messageType = payload.messageType || payload.type || 'text';
    const status = payload.status || payload.messageStatus || null;

    // Execute database ingestion
    // 1. Upsert Contact
    const contactId = upsertContact(phone, name, payload.contactId || null);

    // 2. Upsert Conversation (always linked to an open conversation)
    const conversationId = upsertConversation(contactId, payload.conversationId || null, 'open');

    // 3. Insert Message Idempotently
    const { success, messageId: dbMessageId } = insertMessageIdempotent({
      watiMessageId: messageId,
      conversationId,
      contactId,
      direction,
      senderType,
      messageType,
      text,
      mediaUrl: payload.mediaUrl || null,
      mediaMimeType: payload.mediaMimeType || null,
      replyToMessageId: payload.replyToMessageId || null,
      status,
      watiTimestamp,
      rawEventId: rawEventDbId
    });

    logger.info('WATI Ingestion completed successfully', {
      eventId,
      contactId,
      conversationId,
      dbMessageId,
      isNewMessage: success
    });

    updateRawEventStatus(rawEventDbId, 'processed');

    return NextResponse.json({
      success: true,
      data: {
        contactId,
        conversationId,
        messageId: dbMessageId,
        isNew: success
      }
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error('WATI Webhook ingestion failed', { eventId, error: errMsg });
    
    if (rawEventDbId) {
      updateRawEventStatus(rawEventDbId, 'failed', errMsg);
    }

    return NextResponse.json(
      { error: 'Failed to process webhook', details: errMsg },
      { status: 500 }
    );
  }
}
