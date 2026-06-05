import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';
import { normalizePhoneNumber } from '@/lib/whatsapp-template';
import { logger } from '@/lib/logger';

type SendResult = { success: boolean; providerMessageId: string | null; error?: string };

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
  provider_conversation_id?: string | null;
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
  provider_message_id?: string | null;
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
 * Save raw JSON payload from provider (legacy table name kept: wati_raw_events)
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
  providerConversationId: string | null,
  status: 'open' | 'pending_human' | 'resolved' | 'archived' = 'open'
): string {
  const db = getDb();

  const existing = db.prepare(`
    SELECT id FROM whatsapp_conversations
    WHERE contact_id = ? AND status IN ('open', 'pending_human')
    LIMIT 1
  `).get(contactId) as { id: string } | undefined;

  if (existing) {
    if (providerConversationId) {
      db.prepare(`
        UPDATE whatsapp_conversations
        SET wati_conversation_id = COALESCE(?, wati_conversation_id), updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(providerConversationId, existing.id);
    }
    return existing.id;
  }

  const id = randomUUID();
  db.prepare(`
    INSERT INTO whatsapp_conversations (id, wati_conversation_id, contact_id, status)
    VALUES (?, ?, ?, ?)
  `).run(id, providerConversationId, contactId, status);
  return id;
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

export function updateMessageStatusByProviderMessageId(
  providerMessageId: string,
  status: 'sent' | 'delivered' | 'read' | 'failed'
): boolean {
  const db = getDb();

  const existing = db.prepare(`
    SELECT id, status FROM whatsapp_messages
    WHERE wati_message_id = ?
    LIMIT 1
  `).get(providerMessageId) as { id: string; status: string | null } | undefined;

  if (!existing) return false;

  if (existing.status !== status) {
    db.prepare(`
      UPDATE whatsapp_messages
      SET status = ?
      WHERE id = ?
    `).run(status, existing.id);
  }

  return true;
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
  sendType: 'session_text' | 'template' = 'session_text',
  options?: {
    templateName?: string;
    templateLanguage?: string;
    parameter?: Array<Record<string, string>>;
  }
): string {
  const db = getDb();
  const id = randomUUID();
  const provider = (process.env.WHATSAPP_PROVIDER || (process.env.WATZAP_API_KEY ? 'watzap' : 'wati')).toLowerCase();

  const payload: Record<string, any> = { text };
  if (sendType === 'template') {
    payload.template_name = options?.templateName || '';
    if (options?.templateLanguage) payload.template_language = options.templateLanguage;
    if (Array.isArray(options?.parameter)) payload.parameter = options?.parameter;
  }

  db.prepare(`
    INSERT INTO message_outbox (id, conversation_id, contact_id, channel, send_type, payload, status, scheduled_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
  `).run(id, conversationId, contactId, provider, sendType, JSON.stringify(payload));

  return id;
}

async function sendViaWatzapTemplate(phoneNumber: string, templateName: string, parameter?: Array<Record<string, string>>, templateLanguage?: string): Promise<SendResult> {
  const apiKey = process.env.WATZAP_API_KEY;
  const baseUrl = (process.env.WATZAP_BASE_URL || 'https://api.watzap.id/v1').replace(/\/$/, '');

  if (!apiKey) {
    return { success: false, providerMessageId: null, error: 'WATZAP_API_KEY is not configured' };
  }

  const payload: any = {
    api_key: apiKey,
    phone_no: phoneNumber,
    template_name: templateName
  };

  if (templateLanguage) payload.template_language = templateLanguage;
  if (Array.isArray(parameter) && parameter.length > 0) payload.parameter = parameter;

  const url = `${baseUrl}/waba_send_message_template`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const raw = await res.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // keep raw for error
  }

  const success = res.ok && (data?.status === '200' || data?.status === 200 || data?.ack === 'successfully');
  if (!success) {
    return {
      success: false,
      providerMessageId: null,
      error: `WATZAP template send failed: HTTP ${res.status} ${raw}`
    };
  }

  return {
    success: true,
    providerMessageId: data?.wamid || data?.data?.wamid || null
  };
}

async function sendViaWatzap(phoneNumber: string, payload: Record<string, any>, sendType: string): Promise<SendResult> {
  const apiKey = process.env.WATZAP_API_KEY;
  const baseUrl = (process.env.WATZAP_BASE_URL || 'https://api.watzap.id/v1').replace(/\/$/, '');

  if (!apiKey) {
    return { success: false, providerMessageId: null, error: 'WATZAP_API_KEY is not configured' };
  }

  if (sendType === 'template') {
    const templateName = String(payload?.template_name || '').trim();
    if (!templateName) {
      return { success: false, providerMessageId: null, error: 'Outbox template_name is required for template send' };
    }
    const parameter = Array.isArray(payload?.parameter) ? payload.parameter : undefined;
    const templateLanguage = payload?.template_language ? String(payload.template_language) : undefined;
    return sendViaWatzapTemplate(phoneNumber, templateName, parameter, templateLanguage);
  }

  const text = String(payload?.text || '').trim();
  if (!text) {
    return { success: false, providerMessageId: null, error: 'Outbox payload text is empty' };
  }

  const url = `${baseUrl}/waba_send_message`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      phone_no: phoneNumber,
      message: text
    })
  });

  const raw = await res.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // keep raw for error
  }

  const success = res.ok && (data?.status === '200' || data?.status === 200 || data?.status === true || data?.ack === 'successfully');
  if (!success) {
    return {
      success: false,
      providerMessageId: null,
      error: `WATZAP send failed: HTTP ${res.status} ${raw}`
    };
  }

  return {
    success: true,
    providerMessageId: data?.wamid || data?.data?.wamid || null
  };
}

async function sendViaWati(phoneNumber: string, text: string, sendType: string = 'session_text'): Promise<SendResult> {
  if (sendType === 'template') {
    return {
      success: false,
      providerMessageId: null,
      error: 'WATI template sending is not implemented in outbox. Use WHATSAPP_PROVIDER=watzap for template sends.'
    };
  }
  const watiEndpoint = process.env.WATI_API_ENDPOINT;
  const watiToken = process.env.WATI_API_TOKEN;

  if (!watiEndpoint || !watiToken) {
    return {
      success: false,
      providerMessageId: null,
      error: 'WATI credentials (WATI_API_ENDPOINT / WATI_API_TOKEN) are not configured'
    };
  }

  // Try v3 first
  try {
    const v3Url = `${watiEndpoint.replace(/\/$/, '')}/api/ext/v3/conversations/messages/text`;
    const v3Res = await fetch(v3Url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${watiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ target: phoneNumber, text })
    });

    if (v3Res.ok) {
      const v3Data = await v3Res.json();
      return { success: true, providerMessageId: v3Data?.id || v3Data?.messageId || null };
    }
  } catch (err) {
    logger.warn('WATI v3 send error', { error: String(err) });
  }

  // Fallback v1
  const v1Url = `${watiEndpoint.replace(/\/$/, '')}/api/v1/sendSessionMessage/${phoneNumber}?messageText=${encodeURIComponent(text)}`;
  const v1Res = await fetch(v1Url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${watiToken}` }
  });

  if (!v1Res.ok) {
    const errText = await v1Res.text();
    return { success: false, providerMessageId: null, error: `WATI v1 fallback failed: ${v1Res.status} ${errText}` };
  }

  const v1Data = await v1Res.json();
  return { success: true, providerMessageId: v1Data?.id || v1Data?.messageId || null };
}

/**
 * Attempt sending pending outbox messages
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

  const provider = (process.env.WHATSAPP_PROVIDER || (process.env.WATZAP_API_KEY ? 'watzap' : 'wati')).toLowerCase();

  for (const item of pending) {
    db.prepare("UPDATE message_outbox SET status = 'sending', attempt_count = attempt_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(item.id);

    try {
      const payloadObj = JSON.parse(item.payload || '{}');
      const outgoingText = item.send_type === 'template'
        ? String(payloadObj.template_name || '[template]').trim()
        : String(payloadObj.text || '').trim();

      const result = provider === 'watzap'
        ? await sendViaWatzap(item.phone_number, payloadObj, item.send_type)
        : await sendViaWati(item.phone_number, outgoingText, item.send_type);

      if (!result.success) {
        throw new Error(result.error || `${provider} send failed`);
      }

      db.transaction(() => {
        db.prepare(`
          UPDATE message_outbox
          SET status = 'sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(item.id);

        insertMessageIdempotent({
          watiMessageId: result.providerMessageId,
          conversationId: item.conversation_id,
          contactId: item.contact_id,
          direction: 'outgoing',
          senderType: 'cs',
          text: outgoingText,
          watiTimestamp: new Date().toISOString()
        });
      })();

      logger.info('Outbox message sent', { outboxId: item.id, provider, providerMessageId: result.providerMessageId });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Outbox processing failed for ${item.id}`, { error: errMsg, provider });

      const newStatus = item.attempt_count >= 3 ? 'failed' : 'pending';
      db.prepare(`
        UPDATE message_outbox
        SET status = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newStatus, errMsg, item.id);
    }
  }
}
