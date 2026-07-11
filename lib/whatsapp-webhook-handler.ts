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

export interface WebhookOptions {
  /** Source label for logging (e.g. 'watzap') */
  source: string;
  /**
   * Optional auth verification.
   * Return { allowed: true } to allow, or { allowed: false, reason } to reject.
   * If omitted, no auth check is performed.
   */
  verifyAuth?: (req: NextRequest) => { allowed: boolean; reason?: string };
}

/**
 * Shared WhatsApp webhook handler.
 * Ingests incoming messages or status updates from Watzap / Meta WABA webhooks.
 */
export async function handleWhatsAppWebhook(req: NextRequest, options: WebhookOptions) {
  const { source, verifyAuth } = options;
  const eventId = crypto.randomUUID();
  let rawEventDbId: string | null = null;

  try {
    // Ensure database schema is initialized
    getDb();

    // ── Optional auth verification ──
    if (verifyAuth) {
      const auth = verifyAuth(req);
      if (!auth.allowed) {
        logger.warn(`${source} Webhook unauthorized: ${auth.reason}`, { eventId });
        return NextResponse.json({ error: 'Unauthorized', reason: auth.reason }, { status: 401 });
      }
    }

    const payload = await req.json();
    logger.info(`${source} Webhook received payload`, { eventId, payload });

    // Save raw event for traceability & debugging
    const eventType = payload.eventType || payload.type || 'message';
    const providerId = payload.id || payload.messageId || null;
    rawEventDbId = saveRawEvent(eventType, providerId, JSON.stringify(payload));

    const events = extractWatzapInboundEvents(payload);

    if (events.length === 0) {
      logger.warn(`${source} Webhook payload has no parseable events, skipping processing`, { eventId });
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

    logger.info(`${source} Webhook ingestion completed successfully`, {
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
    logger.error(`${source} Webhook ingestion failed`, { eventId, error: errMsg });

    if (rawEventDbId) {
      updateRawEventStatus(rawEventDbId, 'failed', errMsg);
    }

    return NextResponse.json(
      { error: 'Failed to process webhook', details: errMsg },
      { status: 500 }
    );
  }
}
