import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';
import { normalizePhoneNumber } from '@/lib/whatsapp-template';
import { logger } from '@/lib/logger';

export interface WhatsAppContact {
  id: string;
  phone_number: string;
  display_name: string | null;
  wati_contact_id: string | null;
  is_opted_in: number;
  opted_in_at: string | null;
  last_message_at: string | null;
  linked_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConversation {
  id: string;
  wati_conversation_id: string | null;
  contact_id: string;
  status: 'open' | 'pending_human' | 'resolved' | 'archived';
  assigned_to: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  last_message_at: string | null;
  booking_id: string | null;
  crm_label?: string;
  next_fu_at?: string | null;
  fu_note?: string | null;
  fu_template_key?: string | null;
  last_fu_at?: string | null;
  fu_count?: number;
  label_source?: string;
  label_updated_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  phone_number?: string;
  display_name?: string | null;
}

export interface WhatsAppMessage {
  id: string;
  wati_message_id: string | null;
  conversation_id: string;
  contact_id: string;
  direction: 'incoming' | 'outgoing';
  sender_type: 'customer' | 'owner' | 'cs' | 'bot' | 'system';
  message_type: string;
  text: string | null;
  media_url: string | null;
  media_mime_type: string | null;
  reply_to_message_id: string | null;
  status: 'sent' | 'delivered' | 'read' | 'failed' | null;
  wati_timestamp: string;
  created_at: string;
  raw_event_id: string | null;
}

export interface OutboxMessage {
  id: string;
  conversation_id: string;
  contact_id: string;
  channel: string;
  send_type: string;
  payload: string;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';
  attempt_count: number;
  last_error: string | null;
  scheduled_at: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Save raw JSON payload from WATI
 */
export function saveRawEvent(eventType: string, watiId: string | null, payload: string): string {
  const db = getDb();
  const id = randomUUID();
  db.prepare(`
    INSERT INTO wati_raw_events (id, event_type, wati_id, payload, processing_status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(id, eventType, watiId, payload);
  return id;
}

/**
 * Update raw event processing status
 */
export function updateRawEventStatus(id: string, status: 'processed' | 'failed', errorMessage: string | null = null): void {
  const db = getDb();
  db.prepare(`
    UPDATE wati_raw_events
    SET processing_status = ?, error_message = ?, processed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, errorMessage, id);
}

/**
 * Create or update contact by phone number
 */
export function upsertContact(phone: string, displayName: string | null, watiContactId: string | null): string {
  const db = getDb();
  const normalizedPhone = normalizePhoneNumber(phone);

  // Try to find existing contact by normalized phone
  const existing = db.prepare('SELECT id FROM whatsapp_contacts WHERE phone_number = ?').get(normalizedPhone) as { id: string } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE whatsapp_contacts
      SET display_name = COALESCE(?, display_name),
          wati_contact_id = COALESCE(?, wati_contact_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(displayName, watiContactId, existing.id);
    return existing.id;
  } else {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO whatsapp_contacts (id, phone_number, display_name, wati_contact_id)
      VALUES (?, ?, ?, ?)
    `).run(id, normalizedPhone, displayName, watiContactId);
    return id;
  }
}

/**
 * Create or update conversation for a contact
 */
export function upsertConversation(
  contactId: string,
  watiConversationId: string | null,
  status: 'open' | 'pending_human' | 'resolved' | 'archived' = 'open'
): string {
  const db = getDb();

  // Try to find open/pending conversation for this contact
  const existing = db.prepare(`
    SELECT id FROM whatsapp_conversations
    WHERE contact_id = ? AND status IN ('open', 'pending_human')
    LIMIT 1
  `).get(contactId) as { id: string } | undefined;

  if (existing) {
    if (watiConversationId) {
      db.prepare(`
        UPDATE whatsapp_conversations
        SET wati_conversation_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(watiConversationId, existing.id);
    }
    return existing.id;
  } else {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO whatsapp_conversations (id, wati_conversation_id, contact_id, status)
      VALUES (?, ?, ?, ?)
    `).run(id, watiConversationId, contactId, status);
    return id;
  }
}

/**
 * Idempotently insert message and update conversation timestamps
 */
export function insertMessageIdempotent(data: {
  watiMessageId: string | null;
  conversationId: string;
  contactId: string;
  direction: 'incoming' | 'outgoing';
  senderType: 'customer' | 'owner' | 'cs' | 'bot' | 'system';
  messageType?: string;
  text: string | null;
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  replyToMessageId?: string | null;
  status?: string | null;
  watiTimestamp: string;
  rawEventId?: string | null;
}): { success: boolean; messageId: string } {
  const db = getDb();

  // Check if message with same watiMessageId already exists (if ID is available)
  if (data.watiMessageId) {
    const existing = db.prepare('SELECT id FROM whatsapp_messages WHERE wati_message_id = ?').get(data.watiMessageId) as { id: string } | undefined;
    if (existing) {
      // Update status if changed
      if (data.status) {
        db.prepare('UPDATE whatsapp_messages SET status = ? WHERE id = ?').run(data.status, existing.id);
      }
      return { success: false, messageId: existing.id };
    }
  } else {
    // Fallback dedupe check by hash-like combinations
    const existing = db.prepare(`
      SELECT id FROM whatsapp_messages
      WHERE conversation_id = ? AND contact_id = ? AND direction = ? AND wati_timestamp = ? AND text = ?
      LIMIT 1
    `).get(
      data.conversationId,
      data.contactId,
      data.direction,
      data.watiTimestamp,
      data.text
    ) as { id: string } | undefined;

    if (existing) {
      return { success: false, messageId: existing.id };
    }
  }

  const id = randomUUID();
  const messageType = data.messageType || 'text';
  const status = data.status || (data.direction === 'outgoing' ? 'sent' : 'read');

  db.transaction(() => {
    // Insert message
    db.prepare(`
      INSERT INTO whatsapp_messages (
        id, wati_message_id, conversation_id, contact_id, direction, sender_type,
        message_type, text, media_url, media_mime_type, reply_to_message_id,
        status, wati_timestamp, raw_event_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.watiMessageId, data.conversationId, data.contactId, data.direction, data.senderType,
      messageType, data.text, data.mediaUrl || null, data.mediaMimeType || null, data.replyToMessageId || null,
      status, data.watiTimestamp, data.rawEventId || null
    );

    // Update contact's last message time
    db.prepare(`
      UPDATE whatsapp_contacts
      SET last_message_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.watiTimestamp, data.contactId);

    // Update conversation timestamps and set status to open if it was resolved/archived on new incoming
    const isIncoming = data.direction === 'incoming';
    const lastInbound = isIncoming ? data.watiTimestamp : null;
    const lastOutbound = !isIncoming ? data.watiTimestamp : null;

    if (isIncoming) {
      db.prepare(`
        UPDATE whatsapp_conversations
        SET last_message_at = ?,
            last_inbound_at = COALESCE(?, last_inbound_at),
            status = CASE WHEN status IN ('resolved', 'archived') THEN 'open' ELSE status END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(data.watiTimestamp, lastInbound, data.conversationId);
    } else {
      db.prepare(`
        UPDATE whatsapp_conversations
        SET last_message_at = ?,
            last_outbound_at = COALESCE(?, last_outbound_at),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(data.watiTimestamp, lastOutbound, data.conversationId);
    }
  })();

  return { success: true, messageId: id };
}

/**
 * Retrieve list of conversations with contact details
 */
/**
 * Retrieve list of conversations with contact details and CRM support
 */
export function getConversations(filters: {
  status?: string;
  search?: string;
  crmLabel?: string;
  dueFollowUp?: boolean;
  page?: number;
  limit?: number;
} = {}): { conversations: WhatsAppConversation[]; total: number } {
  const db = getDb();
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let query = `
    FROM whatsapp_conversations c
    JOIN whatsapp_contacts con ON c.contact_id = con.id
  `;
  const params: any[] = [];
  const conditions: string[] = [];

  if (filters.status && filters.status !== 'all') {
    conditions.push('c.status = ?');
    params.push(filters.status);
  }

  if (filters.crmLabel && filters.crmLabel !== 'all') {
    conditions.push('c.crm_label = ?');
    params.push(filters.crmLabel);
  }

  if (filters.dueFollowUp) {
    conditions.push("c.next_fu_at IS NOT NULL AND c.next_fu_at <= ?");
    params.push(new Date().toISOString());
    conditions.push("c.crm_label IN ('leads', 'warm', 'completed', 'testimoni')");
    conditions.push("c.status IN ('open', 'pending_human', 'resolved')");
  }

  if (filters.search) {
    conditions.push('(con.phone_number LIKE ? OR con.display_name LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // Get total count
  const countRow = db.prepare(`SELECT COUNT(*) as count ${query}`).get(...params) as { count: number };
  const total = countRow?.count || 0;

  // Get items
  const itemsQuery = `
    SELECT c.*, con.phone_number, con.display_name, con.linked_customer_id
    ${query}
    ORDER BY c.last_message_at DESC
    LIMIT ? OFFSET ?
  `;

  const conversations = db.prepare(itemsQuery).all(...params, limit, offset) as WhatsAppConversation[];

  return { conversations, total };
}

/**
 * Update CRM pipeline metadata for a conversation
 */
export function updateConversationCrm(
  id: string,
  data: {
    crmLabel?: string;
    nextFuAt?: string | null;
    fuNote?: string | null;
    fuTemplateKey?: string | null;
    labelSource?: string;
  }
): void {
  const db = getDb();
  const updates: string[] = [];
  const params: any[] = [];

  if (data.crmLabel !== undefined) {
    updates.push('crm_label = ?');
    params.push(data.crmLabel);
  }
  if (data.nextFuAt !== undefined) {
    updates.push('next_fu_at = ?');
    params.push(data.nextFuAt);
  }
  if (data.fuNote !== undefined) {
    updates.push('fu_note = ?');
    params.push(data.fuNote);
  }
  if (data.fuTemplateKey !== undefined) {
    updates.push('fu_template_key = ?');
    params.push(data.fuTemplateKey);
  }
  if (data.labelSource !== undefined) {
    updates.push('label_source = ?');
    params.push(data.labelSource);
  }

  if (updates.length === 0) return;

  updates.push('label_updated_at = CURRENT_TIMESTAMP');
  updates.push('updated_at = CURRENT_TIMESTAMP');

  db.prepare(`
    UPDATE whatsapp_conversations
    SET ${updates.join(', ')}
    WHERE id = ?
  `).run(...params, id);
}

/**
 * Mark a follow-up as sent, increment fu_count, set last_fu_at, and clear/reschedule next_fu_at
 */
export function markFollowUpSent(
  id: string,
  mode: 'copied' | 'sent_wati' | 'manual',
  note?: string
): void {
  const db = getDb();

  db.prepare(`
    UPDATE whatsapp_conversations
    SET last_fu_at = CURRENT_TIMESTAMP,
        fu_count = fu_count + 1,
        next_fu_at = NULL,
        fu_note = NULL,
        fu_template_key = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);

  logger.info(`[CRM] Follow-up marked as sent for conversation ${id}`, { mode, note });
}

/**
 * Classify incoming message based on keywords and suggest CRM stages
 */
export function classifyIncomingMessage(
  text: string,
  currentLabel: string,
  labelSource: string
): {
  crmLabel: string;
  nextFuAt: string | null;
  fuTemplateKey: string | null;
  fuNote: string | null;
} | null {
  if (labelSource === 'admin') {
    return null;
  }

  const normalized = text.toLowerCase();

  // Escalate / Complaint / Reschedule keywords (disable auto-FU)
  const escalateKeywords = ['reschedule', 'ubah jadwal', 'cancel', 'batal', 'komplain', 'refund', 'salah'];
  const hasEscalate = escalateKeywords.some(keyword => normalized.includes(keyword));
  if (hasEscalate) {
    return {
      crmLabel: currentLabel,
      nextFuAt: null,
      fuTemplateKey: null,
      fuNote: null
    };
  }

  // Testimoni candidate
  const testimoniKeywords = ['review', 'testimoni', 'makasih', 'terima kasih', 'puas', 'bagus', 'keren'];
  const hasTestimoni = testimoniKeywords.some(keyword => normalized.includes(keyword));
  if (hasTestimoni && (currentLabel === 'booking' || currentLabel === 'completed')) {
    const nextFuDate = new Date();
    nextFuDate.setDate(nextFuDate.getDate() + 30);
    return {
      crmLabel: 'testimoni',
      nextFuAt: nextFuDate.toISOString(),
      fuTemplateKey: 'repeat_30d',
      fuNote: 'Halo kak, kapan-kapan mau foto lagi di CeritaKita? Kami siap bantu kalau mau booking sesi berikutnya.'
    };
  }

  // Price/detail inquiry -> Warm
  const priceKeywords = ['harga', 'paket', 'berapa', 'detail', 'promo', 'include', 'pricelist'];
  const hasPrice = priceKeywords.some(keyword => normalized.includes(keyword));
  if (hasPrice && currentLabel === 'leads') {
    const nextFuDate = new Date();
    nextFuDate.setDate(nextFuDate.getDate() + 3);
    return {
      crmLabel: 'warm',
      nextFuAt: nextFuDate.toISOString(),
      fuTemplateKey: 'warm_3d',
      fuNote: 'Halo kak, masih tertarik untuk sesi foto di CeritaKita? Kalau ada yang ingin ditanyakan, kami bantu ya.'
    };
  }

  // New lead / generic chat -> leads (+1 day FU)
  if (currentLabel === 'leads') {
    const nextFuDate = new Date();
    nextFuDate.setDate(nextFuDate.getDate() + 1);
    return {
      crmLabel: 'leads',
      nextFuAt: nextFuDate.toISOString(),
      fuTemplateKey: 'leads_1d',
      fuNote: 'Halo kak, ada yang bisa CeritaKita bantu?'
    };
  }

  return null;
}

/**
 * Get messages inside a conversation
 */
export function getMessages(conversationId: string): WhatsAppMessage[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM whatsapp_messages
    WHERE conversation_id = ?
    ORDER BY wati_timestamp ASC
  `).all(conversationId) as WhatsAppMessage[];
}

/**
 * Get conversation by ID with contact details
 */
export function getConversationById(id: string): WhatsAppConversation | null {
  const db = getDb();
  return db.prepare(`
    SELECT c.*, con.phone_number, con.display_name, con.linked_customer_id
    FROM whatsapp_conversations c
    JOIN whatsapp_contacts con ON c.contact_id = con.id
    WHERE c.id = ?
  `).get(id) as WhatsAppConversation | null;
}

/**
 * Link booking to conversation
 */
export function linkBookingToConversation(conversationId: string, bookingId: string | null): void {
  const db = getDb();
  db.prepare(`
    UPDATE whatsapp_conversations
    SET booking_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(bookingId, conversationId);
}

/**
 * Queue a message in the outbox
 */
export function queueOutbox(
  conversationId: string,
  contactId: string,
  text: string,
  sendType: 'session_text' | 'template' = 'session_text'
): string {
  const db = getDb();
  const id = randomUUID();

  db.prepare(`
    INSERT INTO message_outbox (id, conversation_id, contact_id, channel, send_type, payload, status, scheduled_at)
    VALUES (?, ?, ?, 'wati', ?, ?, 'pending', datetime('now'))
  `).run(id, conversationId, contactId, sendType, JSON.stringify({ text }));

  return id;
}

/**
 * Attempt sending pending outbox messages to WATI
 */
export async function processOutboxQueue(): Promise<void> {
  const db = getDb();
  const pending = db.prepare(`
    SELECT o.*, con.phone_number
    FROM message_outbox o
    JOIN whatsapp_contacts con ON o.contact_id = con.id
    WHERE o.status = 'pending' AND o.scheduled_at <= CURRENT_TIMESTAMP
    ORDER BY o.created_at ASC
    LIMIT 10
  `).all() as (OutboxMessage & { phone_number: string })[];

  if (pending.length === 0) return;

  const watiEndpoint = process.env.WATI_API_ENDPOINT;
  const watiToken = process.env.WATI_API_TOKEN;

  for (const item of pending) {
    db.prepare("UPDATE message_outbox SET status = 'sending', attempt_count = attempt_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(item.id);

    try {
      if (!watiEndpoint || !watiToken) {
        throw new Error('WATI credentials (WATI_API_ENDPOINT / WATI_API_TOKEN) are not configured');
      }

      const payloadObj = JSON.parse(item.payload);
      const text = payloadObj.text;
      let success = false;
      let watiMessageId: string | null = null;

      // Try Endpoint v3 first: https://live-mt-server.wati.io/api/ext/v3/conversations/messages/text
      // Body format: { "target": "628...", "text": "Message content" }
      try {
        const v3Url = `${watiEndpoint.replace(/\/$/, '')}/api/ext/v3/conversations/messages/text`;
        logger.info(`Attempting WATI send v3 message for outbox ${item.id}`, { url: v3Url });

        const res = await fetch(v3Url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${watiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            target: item.phone_number,
            text: text
          })
        });

        if (res.ok) {
          const resData = await res.json();
          success = true;
          watiMessageId = resData.id || resData.messageId || null;
          logger.info(`WATI send v3 succeeded for outbox ${item.id}`, { watiMessageId });
        } else {
          const errText = await res.text();
          logger.warn(`WATI send v3 failed for outbox ${item.id}`, { status: res.status, error: errText });
        }
      } catch (v3Err) {
        logger.warn(`WATI send v3 error for outbox ${item.id}`, { error: String(v3Err) });
      }

      // Fallback to Endpoint v1: POST {WATI_API_ENDPOINT}/api/v1/sendSessionMessage/{whatsappNumber}?messageText={text}
      if (!success) {
        const v1Url = `${watiEndpoint.replace(/\/$/, '')}/api/v1/sendSessionMessage/${item.phone_number}?messageText=${encodeURIComponent(text)}`;
        logger.info(`Attempting WATI send v1 fallback for outbox ${item.id}`, { url: v1Url });

        const res = await fetch(v1Url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${watiToken}`
          }
        });

        if (res.ok) {
          const resData = await res.json();
          success = true;
          watiMessageId = resData.id || resData.messageId || null;
          logger.info(`WATI send v1 fallback succeeded for outbox ${item.id}`, { watiMessageId });
        } else {
          const errText = await res.text();
          throw new Error(`WATI v1 fallback failed: ${res.status} ${errText}`);
        }
      }

      if (success) {
        db.transaction(() => {
          db.prepare(`
            UPDATE message_outbox
            SET status = 'sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(item.id);

          // Add this sent message to local whatsapp_messages
          insertMessageIdempotent({
            watiMessageId,
            conversationId: item.conversation_id,
            contactId: item.contact_id,
            direction: 'outgoing',
            senderType: 'cs',
            text: text,
            watiTimestamp: new Date().toISOString()
          });
        })();
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Outbox processing failed for ${item.id}`, { error: errMsg });

      const newStatus = item.attempt_count >= 3 ? 'failed' : 'pending';
      db.prepare(`
        UPDATE message_outbox
        SET status = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newStatus, errMsg, item.id);
    }
  }
}
