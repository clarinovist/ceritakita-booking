import 'server-only';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';
import { normalizePhoneNumber } from '@/lib/whatsapp-template';
import { logger } from '@/lib/logger';
import {
  mapWatzapDeliveryStatus,
  parseWatzapMessageItems,
  watzapListMessages
} from '@/lib/watzap';

type SendResult = { success: boolean; providerMessageId: string | null; error?: string };

/** WhatsApp Cloud API customer care window (hours) for free-form session messages */
export const WA_SESSION_WINDOW_HOURS = 24;

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
  status_error?: string | null;
  wati_timestamp: string;
  created_at: string;
  raw_event_id: string | null;
}

export interface SessionWindowInfo {
  isOpen: boolean;
  lastInboundAt: string | null;
  expiresAt: string | null;
  hoursRemaining: number | null;
  windowHours: number;
  reason: 'open' | 'expired' | 'no_inbound';
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
 * Save raw JSON payload from provider.
 * Note: table/column names still use legacy `wati_*` identifiers for DB compatibility.
 */
export function saveRawEvent(eventType: string, providerEventId: string | null, payload: string): string {
  const db = getDb();
  const id = randomUUID();
  db.prepare(`
    INSERT INTO wati_raw_events (id, event_type, wati_id, payload, processing_status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(id, eventType, providerEventId, payload);
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
  mode: 'copied' | 'sent_watzap' | 'manual',
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
      SET status = ?, status_error = CASE WHEN ? = 'failed' THEN status_error ELSE NULL END
      WHERE id = ?
    `).run(status, status, existing.id);
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
 * Compute Meta 24h customer-care session window for free-form replies.
 * Window opens from last inbound customer message.
 */
export function getSessionWindow(conversationId: string): SessionWindowInfo {
  const db = getDb();
  const row = db.prepare(`
    SELECT last_inbound_at FROM whatsapp_conversations WHERE id = ?
  `).get(conversationId) as { last_inbound_at: string | null } | undefined;

  const lastInboundAt = row?.last_inbound_at || null;
  if (!lastInboundAt) {
    return {
      isOpen: false,
      lastInboundAt: null,
      expiresAt: null,
      hoursRemaining: null,
      windowHours: WA_SESSION_WINDOW_HOURS,
      reason: 'no_inbound'
    };
  }

  const lastMs = new Date(lastInboundAt).getTime();
  if (!Number.isFinite(lastMs)) {
    return {
      isOpen: false,
      lastInboundAt,
      expiresAt: null,
      hoursRemaining: null,
      windowHours: WA_SESSION_WINDOW_HOURS,
      reason: 'no_inbound'
    };
  }

  const expiresMs = lastMs + WA_SESSION_WINDOW_HOURS * 60 * 60 * 1000;
  const remainingMs = expiresMs - Date.now();
  const isOpen = remainingMs > 0;

  return {
    isOpen,
    lastInboundAt,
    expiresAt: new Date(expiresMs).toISOString(),
    hoursRemaining: isOpen ? Math.round((remainingMs / (60 * 60 * 1000)) * 10) / 10 : 0,
    windowHours: WA_SESSION_WINDOW_HOURS,
    reason: isOpen ? 'open' : 'expired'
  };
}

export function updateMessageDeliveryByProviderId(
  providerMessageId: string,
  status: 'sent' | 'delivered' | 'read' | 'failed',
  statusError?: string | null
): boolean {
  const db = getDb();
  const existing = db.prepare(`
    SELECT id FROM whatsapp_messages WHERE wati_message_id = ? LIMIT 1
  `).get(providerMessageId) as { id: string } | undefined;
  if (!existing) return false;

  db.prepare(`
    UPDATE whatsapp_messages
    SET status = ?, status_error = ?
    WHERE id = ?
  `).run(status, statusError ?? null, existing.id);
  return true;
}

export function updateMessageDeliveryById(
  messageId: string,
  status: 'sent' | 'delivered' | 'read' | 'failed',
  statusError?: string | null
): void {
  const db = getDb();
  db.prepare(`
    UPDATE whatsapp_messages
    SET status = ?, status_error = ?
    WHERE id = ?
  `).run(status, statusError ?? null, messageId);
}

/**
 * Pull recent outbound logs from Watzap and reconcile local message statuses.
 */
export async function syncOutgoingStatusesForPhone(
  phoneNumber: string,
  options?: { limit?: number }
): Promise<number> {
  const normalized = normalizePhoneNumber(phoneNumber) || phoneNumber;
  const resp = await watzapListMessages({
    limit: options?.limit ?? 30,
    phoneNo: normalized,
    recipient: normalized
  });
  if (!resp.ok) {
    logger.warn('Failed to list Watzap messages for status sync', { error: resp.error, phone: normalized });
    return 0;
  }

  const items = parseWatzapMessageItems(resp.data);
  let updated = 0;
  for (const item of items) {
    const providerId = item.wamid || item.message_id || null;
    if (!providerId) continue;
    const mapped = mapWatzapDeliveryStatus(item.status);
    if (!mapped) continue;
    const errText = item.error ? String(item.error) : null;
    if (updateMessageDeliveryByProviderId(providerId, mapped, errText)) {
      updated += 1;
    }
  }
  return updated;
}

function isPermanentSendError(errMsg: string): boolean {
  return /re-engagement|session|24\s*hour|outside the|template|not connected|invalid api|expired|1003|1004|1005|1007|1009/i.test(
    errMsg
  );
}

function extractWatzapSendFailure(data: any, raw: string, httpStatus: number): string | null {
  const candidates = [
    data?.error,
    data?.message,
    data?.data?.error,
    data?.data?.message,
    typeof data?.status === 'string' && data.status !== '200' ? data.status : null
  ]
    .filter(Boolean)
    .map(String);

  const joined = candidates.join(' | ');
  if (/re-engagement/i.test(joined) || /re-engagement/i.test(raw)) {
    return 'Re-engagement message: session 24 jam sudah lewat. Gunakan template message.';
  }
  if (data?.status && data.status !== '200' && data.status !== 200 && data?.ack !== 'successfully' && data?.ack !== 'success') {
    return joined || `Watzap send failed HTTP ${httpStatus}`;
  }
  if (!httpStatus || httpStatus >= 400) {
    return joined || `Watzap send failed HTTP ${httpStatus}`;
  }
  return null;
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
 * Queue a message in the outbox and immediately insert a local outgoing bubble
 * so the admin UI can show the reply without waiting for provider round-trip.
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
): { outboxId: string; messageId: string } {
  const db = getDb();
  const id = randomUUID();
  const provider = 'watzap';
  const displayText =
    sendType === 'template'
      ? String(options?.templateName || text || '[template]').trim()
      : String(text || '').trim();
  const nowIso = new Date().toISOString();
  const localProviderMessageId = `local-outbox-${id}`;

  const payload: Record<string, any> = { text };
  if (sendType === 'template') {
    payload.template_name = options?.templateName || '';
    if (options?.templateLanguage) payload.template_language = options.templateLanguage;
    if (Array.isArray(options?.parameter)) payload.parameter = options?.parameter;
  }
  payload.local_message_id = localProviderMessageId;

  db.prepare(`
    INSERT INTO message_outbox (id, conversation_id, contact_id, channel, send_type, payload, status, scheduled_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
  `).run(id, conversationId, contactId, provider, sendType, JSON.stringify(payload));

  // Persist outgoing bubble immediately (status pending until provider ack)
  const inserted = insertMessageIdempotent({
    watiMessageId: localProviderMessageId,
    conversationId,
    contactId,
    direction: 'outgoing',
    senderType: 'cs',
    messageType: sendType === 'template' ? 'template' : 'text',
    text: displayText || '[template]',
    status: 'sent',
    watiTimestamp: nowIso
  });

  return { outboxId: id, messageId: inserted.messageId };
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

  const hardFail = extractWatzapSendFailure(data, raw, res.status);
  const success = !hardFail && res.ok && (data?.status === '200' || data?.status === 200 || data?.ack === 'successfully' || data?.ack === 'success');
  if (!success) {
    return {
      success: false,
      providerMessageId: data?.wamid || data?.data?.wamid || null,
      error: hardFail || `WATZAP template send failed: HTTP ${res.status} ${raw}`
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

  const hardFail = extractWatzapSendFailure(data, raw, res.status);
  const success = !hardFail && res.ok && (
    data?.status === '200' || data?.status === 200 || data?.status === true
    || data?.ack === 'successfully' || data?.ack === 'success'
  );
  if (!success) {
    return {
      success: false,
      providerMessageId: data?.wamid || data?.data?.wamid || null,
      error: hardFail || `WATZAP send failed: HTTP ${res.status} ${raw}`
    };
  }

  return {
    success: true,
    providerMessageId: data?.wamid || data?.data?.wamid || null
  };
}

/**
 * Attempt sending pending outbox messages via Watzap (sole WhatsApp provider).
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

  const provider = 'watzap';

  for (const item of pending) {
    db.prepare("UPDATE message_outbox SET status = 'sending', attempt_count = attempt_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(item.id);

    try {
      const payloadObj = JSON.parse(item.payload || '{}');
      const outgoingText = item.send_type === 'template'
        ? String(payloadObj.template_name || '[template]').trim()
        : String(payloadObj.text || '').trim();

      const result = await sendViaWatzap(item.phone_number, payloadObj, item.send_type);

      if (!result.success) {
        throw new Error(result.error || `${provider} send failed`);
      }

      const payloadLocalId =
        typeof payloadObj.local_message_id === 'string' && payloadObj.local_message_id
          ? payloadObj.local_message_id
          : `local-outbox-${item.id}`;

      db.transaction(() => {
        db.prepare(`
          UPDATE message_outbox
          SET status = 'sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, last_error = NULL
          WHERE id = ?
        `).run(item.id);

        // Prefer updating the local placeholder bubble with the real provider message id
        const existingLocal = db.prepare(`
          SELECT id FROM whatsapp_messages WHERE wati_message_id = ? LIMIT 1
        `).get(payloadLocalId) as { id: string } | undefined;

        if (existingLocal && result.providerMessageId) {
          // If provider id already exists (rare race), drop the placeholder and keep provider row
          const existingProvider = db.prepare(`
            SELECT id FROM whatsapp_messages WHERE wati_message_id = ? LIMIT 1
          `).get(result.providerMessageId) as { id: string } | undefined;

          if (existingProvider && existingProvider.id !== existingLocal.id) {
            db.prepare('DELETE FROM whatsapp_messages WHERE id = ?').run(existingLocal.id);
          } else {
            db.prepare(`
              UPDATE whatsapp_messages
              SET wati_message_id = ?, status = 'sent', status_error = NULL
              WHERE id = ?
            `).run(result.providerMessageId, existingLocal.id);
          }
        } else if (existingLocal) {
          db.prepare(`
            UPDATE whatsapp_messages
            SET status = 'sent', status_error = NULL
            WHERE id = ?
          `).run(existingLocal.id);
        } else {
          // Fallback for older outbox rows without local placeholder
          insertMessageIdempotent({
            watiMessageId: result.providerMessageId,
            conversationId: item.conversation_id,
            contactId: item.contact_id,
            direction: 'outgoing',
            senderType: 'cs',
            text: outgoingText,
            status: 'sent',
            watiTimestamp: new Date().toISOString()
          });
        }
      })();

      // Reconcile async Meta delivery failures (e.g. re-engagement) from Watzap logs
      try {
        await new Promise((r) => setTimeout(r, 800));
        await syncOutgoingStatusesForPhone(item.phone_number, { limit: 20 });
      } catch (syncErr) {
        logger.warn('Post-send status sync failed', { outboxId: item.id, error: String(syncErr) });
      }

      logger.info('Outbox message sent', { outboxId: item.id, provider, providerMessageId: result.providerMessageId });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Outbox processing failed for ${item.id}`, { error: errMsg, provider });

      const permanent = isPermanentSendError(errMsg);
      const newStatus = permanent || item.attempt_count >= 3 ? 'failed' : 'pending';
      db.prepare(`
        UPDATE message_outbox
        SET status = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newStatus, errMsg, item.id);

      // Surface failure on the local bubble immediately for permanent errors (and final fail)
      if (newStatus === 'failed') {
        try {
          const payloadObj = JSON.parse(item.payload || '{}');
          const payloadLocalId =
            typeof payloadObj.local_message_id === 'string' && payloadObj.local_message_id
              ? payloadObj.local_message_id
              : `local-outbox-${item.id}`;
          db.prepare(`
            UPDATE whatsapp_messages
            SET status = 'failed', status_error = ?
            WHERE wati_message_id = ?
          `).run(errMsg.slice(0, 500), payloadLocalId);
        } catch {
          // ignore secondary update errors
        }
      }
    }
  }
}

/**
 * Save or update conversation insight
 */
export function saveConversationInsight(data: {
  conversationId: string;
  summary: string | null;
  intent: string | null;
  sentiment: string | null;
  urgency: string | null;
  riskLevel: string | null;
  needsHuman: boolean;
  suggestedNextAction: string | null;
  confidence: number;
  modelName: string | null;
  sourceMessageId: string | null;
}): string {
  const db = getDb();
  
  const existing = db.prepare('SELECT id FROM whatsapp_conversation_insights WHERE conversation_id = ?').get(data.conversationId) as { id: string } | undefined;
  const needsHumanInt = data.needsHuman ? 1 : 0;
  
  if (existing) {
    db.prepare(`
      UPDATE whatsapp_conversation_insights
      SET summary = ?, intent = ?, sentiment = ?, urgency = ?, risk_level = ?, 
          needs_human = ?, suggested_next_action = ?, confidence = ?, 
          model_name = ?, source_message_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.summary, data.intent, data.sentiment, data.urgency, data.riskLevel,
      needsHumanInt, data.suggestedNextAction, data.confidence,
      data.modelName, data.sourceMessageId, existing.id
    );
    return existing.id;
  } else {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO whatsapp_conversation_insights (
        id, conversation_id, summary, intent, sentiment, urgency, risk_level, 
        needs_human, suggested_next_action, confidence, model_name, source_message_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.conversationId, data.summary, data.intent, data.sentiment, data.urgency, data.riskLevel,
      needsHumanInt, data.suggestedNextAction, data.confidence,
      data.modelName, data.sourceMessageId
    );
    return id;
  }
}

/**
 * Retrieve latest conversation insight
 */
export function getLatestConversationInsight(conversationId: string) {
  const db = getDb();
  const row = db.prepare(`
    SELECT * FROM whatsapp_conversation_insights
    WHERE conversation_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(conversationId) as any;
  
  if (!row) return null;
  return {
    ...row,
    needs_human: row.needs_human === 1
  };
}

/**
 * Save new AI Draft
 */
export function saveAIDraft(data: {
  conversationId: string;
  messageId: string | null;
  draftText: string;
  draftType: string;
  status?: string;
  riskLevel: string | null;
  guardrailNotes: string | null;
  createdBy?: string;
  modelName: string | null;
  promptVersion: string | null;
}): string {
  const db = getDb();
  const id = randomUUID();
  const status = data.status || 'drafted';
  const createdBy = data.createdBy || 'ai';
  
  db.prepare(`
    INSERT INTO whatsapp_ai_drafts (
      id, conversation_id, message_id, draft_text, draft_type, status,
      risk_level, guardrail_notes, created_by, model_name, prompt_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.conversationId, data.messageId, data.draftText, data.draftType, status,
    data.riskLevel, data.guardrailNotes, createdBy, data.modelName, data.promptVersion
  );
  
  return id;
}

/**
 * Update AI Draft Status
 */
export function updateAIDraftStatus(
  draftId: string,
  status: 'drafted' | 'edited' | 'approved' | 'sent' | 'rejected' | 'expired',
  extra?: {
    approvedBy?: string | null;
    sentOutboxId?: string | null;
    draftText?: string;
  }
): void {
  const db = getDb();
  const updates: string[] = ['status = ?'];
  const params: any[] = [status];
  
  if (extra?.approvedBy !== undefined) {
    updates.push('approved_by = ?');
    params.push(extra.approvedBy);
  }
  
  if (extra?.sentOutboxId !== undefined) {
    updates.push('sent_outbox_id = ?');
    params.push(extra.sentOutboxId);
  }
  
  if (extra?.draftText !== undefined) {
    updates.push('draft_text = ?');
    params.push(extra.draftText);
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  
  db.prepare(`
    UPDATE whatsapp_ai_drafts
    SET ${updates.join(', ')}
    WHERE id = ?
  `).run(...params, draftId);
}

/**
 * Retrieve AI Draft by ID
 */
export function getAIDraftById(draftId: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM whatsapp_ai_drafts WHERE id = ?').get(draftId) as any;
}

/**
 * Log an AI event audit log
 */
export function logAIEvent(data: {
  conversationId: string;
  eventType: string;
  inputSnapshot: string | null;
  outputSnapshot: string | null;
  actor: string;
}): string {
  const db = getDb();
  const id = randomUUID();
  
  db.prepare(`
    INSERT INTO whatsapp_ai_events (id, conversation_id, event_type, input_snapshot, output_snapshot, actor)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.conversationId, data.eventType, data.inputSnapshot, data.outputSnapshot, data.actor);
  
  return id;
}

/**
 * Build Customer 360 context for WhatsApp conversation
 */
export function buildWhatsAppCustomerContext(conversationId: string) {
  const db = getDb();
  const conv = getConversationById(conversationId);
  if (!conv) return null;
  
  const maxMessages = parseInt(process.env.AI_CS_MAX_CONTEXT_MESSAGES || '30', 10);
  const messages = db.prepare(`
    SELECT id, direction, sender_type, text, wati_timestamp
    FROM whatsapp_messages
    WHERE conversation_id = ?
    ORDER BY wati_timestamp DESC
    LIMIT ?
  `).all(conversationId, maxMessages) as any[];
  
  // Order messages chronologically
  messages.reverse();
  
  const phone = conv.phone_number || '';
  const cleanPhone = (p: string) => p.replace(/\D/g, '');
  const targetClean = cleanPhone(phone);
  
  // Find matching bookings
  const allBookings = db.prepare(`
    SELECT id, status, customer_name, customer_whatsapp, customer_category, booking_date, total_price
    FROM bookings
  `).all() as any[];
  
  const customerBookings = allBookings.filter(b => {
    const bClean = cleanPhone(b.customer_whatsapp);
    if (bClean.length < 8 || targetClean.length < 8) return false;
    return bClean === targetClean || bClean.includes(targetClean) || targetClean.includes(bClean);
  });
  
  const bookingIds = customerBookings.map(b => b.id);
  let payments: any[] = [];
  if (bookingIds.length > 0) {
    const placeholders = bookingIds.map(() => '?').join(',');
    payments = db.prepare(`
      SELECT booking_id, amount, date, note
      FROM payments
      WHERE booking_id IN (${placeholders})
    `).all(...bookingIds);
  }
  
  const bookingsWithFinance = customerBookings.map(b => {
    const bookingPayments = payments.filter(p => p.booking_id === b.id);
    const totalPaid = bookingPayments.reduce((sum, p) => sum + p.amount, 0);
    const sisa = b.total_price - totalPaid;
    return {
      id: b.id,
      status: b.status,
      category: b.customer_category,
      date: b.booking_date,
      totalPrice: b.total_price,
      totalPaid,
      sisa,
      payments: bookingPayments
    };
  });
  
  const activeBookings = bookingsWithFinance.filter(b => b.status === 'Active' || b.status === 'Rescheduled');
  const linkedBooking = bookingsWithFinance.find(b => b.id === conv.booking_id) || null;
  
  return {
    conversationId,
    status: conv.status,
    crmLabel: conv.crm_label || 'leads',
    assignedTo: conv.assigned_to,
    bookingId: conv.booking_id,
    contact: {
      id: conv.contact_id,
      phone: conv.phone_number,
      displayName: conv.display_name
    },
    messageHistory: messages,
    bookings: bookingsWithFinance,
    summary: {
      totalBookingsCount: bookingsWithFinance.length,
      activeBookingsCount: activeBookings.length,
      totalAmountPaid: bookingsWithFinance.reduce((sum, b) => sum + b.totalPaid, 0),
      totalOutstanding: bookingsWithFinance.reduce((sum, b) => sum + Math.max(0, b.sisa), 0),
      linkedBooking
    }
  };
}

export interface WhatsappSummaryMetrics {
  last24hIncoming: number;
  last24hOutgoing: number;
  openConversations: number;
  resolvedConversations: number;
  pendingHumanConversations: number;
  responseTimes: Array<{ diff_minutes: number }>;
}

export function getWhatsappSummaryMetrics(): WhatsappSummaryMetrics {
  const db = getDb();
  
  const last24hIncoming = db.prepare(`
    SELECT COUNT(*) as count FROM whatsapp_messages
    WHERE direction = 'incoming' AND wati_timestamp >= datetime('now', '-1 day')
  `).get() as { count: number };

  const last24hOutgoing = db.prepare(`
    SELECT COUNT(*) as count FROM whatsapp_messages
    WHERE direction = 'outgoing' AND wati_timestamp >= datetime('now', '-1 day')
  `).get() as { count: number };

  const openConversations = db.prepare(`
    SELECT COUNT(*) as count FROM whatsapp_conversations WHERE status = 'open'
  `).get() as { count: number };

  const resolvedConversations = db.prepare(`
    SELECT COUNT(*) as count FROM whatsapp_conversations WHERE status = 'resolved'
  `).get() as { count: number };

  const pendingHumanConversations = db.prepare(`
    SELECT COUNT(*) as count FROM whatsapp_conversations WHERE status = 'pending_human'
  `).get() as { count: number };

  const responseTimes = db.prepare(`
    WITH first_replies AS (
      SELECT 
        inc.id as inc_id,
        inc.wati_timestamp as inc_time,
        MIN(out.wati_timestamp) as reply_time
      FROM whatsapp_messages inc
      JOIN whatsapp_messages out ON inc.conversation_id = out.conversation_id
        AND out.direction = 'outgoing'
        AND out.wati_timestamp > inc.wati_timestamp
      WHERE inc.direction = 'incoming'
        AND inc.wati_timestamp >= datetime('now', '-7 days')
      GROUP BY inc.id
    )
    SELECT 
      (strftime('%s', reply_time) - strftime('%s', inc_time)) / 60.0 as diff_minutes
    FROM first_replies
    WHERE diff_minutes >= 0
    ORDER BY diff_minutes ASC
  `).all() as { diff_minutes: number }[];

  return {
    last24hIncoming: last24hIncoming?.count || 0,
    last24hOutgoing: last24hOutgoing?.count || 0,
    openConversations: openConversations?.count || 0,
    resolvedConversations: resolvedConversations?.count || 0,
    pendingHumanConversations: pendingHumanConversations?.count || 0,
    responseTimes
  };
}

export function getWhatsappConversationById(id: string): { id: string } | undefined {
  const db = getDb();
  return db.prepare('SELECT id FROM whatsapp_conversations WHERE id = ?').get(id) as { id: string } | undefined;
}

export function updateWhatsappConversation(id: string, data: { status?: string; assignedTo?: string }): void {
  const db = getDb();
  const updates: string[] = [];
  const values: any[] = [];

  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
  }

  if (data.assignedTo !== undefined) {
    updates.push('assigned_to = ?');
    values.push(data.assignedTo);
  }

  if (updates.length > 0) {
    db.prepare(`
      UPDATE whatsapp_conversations
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(...values, id);
  }
}

export interface WhatsappConversationDetail {
  id: string;
  contact_id: string;
  last_inbound_at: string | null;
  phone_number: string;
}

export function getWhatsappConversationDetail(id: string): WhatsappConversationDetail | undefined {
  const db = getDb();
  return db.prepare(`
    SELECT c.id, c.contact_id, c.last_inbound_at, con.phone_number
    FROM whatsapp_conversations c
    JOIN whatsapp_contacts con ON con.id = c.contact_id
    WHERE c.id = ?
  `).get(id) as WhatsappConversationDetail | undefined;
}

export function getWhatsappConversationContactPhone(id: string): { contact_id: string; phone_number: string } | undefined {
  const db = getDb();
  return db.prepare(`
    SELECT c.contact_id, con.phone_number
    FROM whatsapp_conversations c
    JOIN whatsapp_contacts con ON con.id = c.contact_id
    WHERE c.id = ?
  `).get(id) as { contact_id: string; phone_number: string } | undefined;
}

export function getMessageOutboxStatus(outboxId: string): { id: string; status: string; last_error: string | null } | undefined {
  const db = getDb();
  return db.prepare(`
    SELECT id, status, last_error FROM message_outbox WHERE id = ?
  `).get(outboxId) as { id: string; status: string; last_error: string | null } | undefined;
}
