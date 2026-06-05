import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getDb } from '@/lib/db';
import {
  saveRawEvent,
  updateRawEventStatus,
  upsertContact,
  upsertConversation,
  insertMessageIdempotent,
  getConversationById,
  updateConversationCrm,
  classifyIncomingMessage,
  updateMessageStatusByProviderMessageId
} from '@/lib/repositories/whatsapp';
import { extractWatzapInboundEvents } from '@/lib/watzap';

export const dynamic = 'force-dynamic';

/**
 * POST /api/wati/webhook
 * Ingests incoming messages or status updates from WATI
 */
export async function POST(req: NextRequest) {
  const eventId = crypto.randomUUID();
  let rawEventDbId: string | null = null;

  try {
    // Ensure database schema is initialized
    getDb();
    
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

    const events = extractWatzapInboundEvents(payload);

    if (events.length === 0) {
      logger.warn('Webhook payload has no parseable events, skipping processing', { eventId });
      updateRawEventStatus(rawEventDbId, 'processed', 'No parseable inbound events');
      return NextResponse.json({ success: true, message: 'Skipped - no parseable events' });
    }

    const results: Array<{ contactId: string; conversationId: string; messageId: string; isNew: boolean }> = [];

    for (const ev of events) {
      if (!ev.phone) {
        continue;
      }

      const senderType = ev.direction === 'incoming' ? 'customer' : 'cs';
      const displayName = ev.senderName || 'WhatsApp User';

      if (ev.direction === 'outgoing' && ev.messageType === 'status' && ev.providerMessageId && ev.status) {
        const mappedStatus = (['sent', 'delivered', 'read', 'failed'].includes(ev.status) ? ev.status : null) as ('sent' | 'delivered' | 'read' | 'failed' | null);
        if (mappedStatus) {
          const updated = updateMessageStatusByProviderMessageId(ev.providerMessageId, mappedStatus);
          if (updated) {
            results.push({
              contactId: '',
              conversationId: '',
              messageId: ev.providerMessageId,
              isNew: false
            });
            continue;
          }
        }
      }

      const contactId = upsertContact(ev.phone, displayName, null);
      const conversationId = upsertConversation(contactId, null, 'open');

      const inserted = insertMessageIdempotent({
        watiMessageId: ev.providerMessageId,
        conversationId,
        contactId,
        direction: ev.direction,
        senderType,
        messageType: ev.messageType,
        text: ev.text || '',
        mediaUrl: ev.mediaUrl,
        mediaMimeType: ev.mediaMimeType,
        status: ev.status,
        watiTimestamp: ev.timestampIso,
        rawEventId: rawEventDbId
      });

      if (ev.direction === 'incoming' && inserted.success) {
        try {
          const currentConv = getConversationById(conversationId);
          if (currentConv) {
            const crmFields = currentConv as any;
            const classification = classifyIncomingMessage(
              ev.text || '',
              crmFields.crm_label || 'leads',
              crmFields.label_source || 'system'
            );
            if (classification) {
              updateConversationCrm(conversationId, {
                crmLabel: classification.crmLabel,
                nextFuAt: classification.nextFuAt,
                fuNote: classification.fuNote,
                fuTemplateKey: classification.fuTemplateKey,
                labelSource: 'system'
              });
            }
          }
        } catch (crmErr) {
          logger.error('Failed to auto-label conversation on webhook', { conversationId, error: String(crmErr) });
        }
      }

      results.push({
        contactId,
        conversationId,
        messageId: inserted.messageId,
        isNew: inserted.success
      });
    }

    logger.info('Webhook ingestion completed successfully', {
      eventId,
      processedEvents: results.length
    });

    updateRawEventStatus(rawEventDbId, 'processed');

    return NextResponse.json({
      success: true,
      data: {
        processedEvents: results.length,
        results
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
