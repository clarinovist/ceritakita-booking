import { logger } from '@/lib/logger';

export interface WatzapResult<T = any> {
  ok: boolean;
  statusCode: number;
  data: T | null;
  raw: string;
  error?: string;
}

export interface WatzapTemplateItem {
  id?: string;
  template_id?: string;
  name?: string;
  language?: string;
  category?: string;
  status?: string;
  [key: string]: any;
}

function resolveBaseUrl() {
  return (process.env.WATZAP_BASE_URL || 'https://api.watzap.id/v1').replace(/\/$/, '');
}

function resolveApiKey() {
  return process.env.WATZAP_API_KEY || '';
}

export function isWatzapConfigured() {
  return !!resolveApiKey();
}

async function watzapPost<T = any>(path: string, payload: Record<string, any>): Promise<WatzapResult<T>> {
  const apiKey = resolveApiKey();
  const baseUrl = resolveBaseUrl();

  if (!apiKey) {
    return {
      ok: false,
      statusCode: 500,
      data: null,
      raw: '',
      error: 'WATZAP_API_KEY is not configured'
    };
  }

  const url = `${baseUrl}${path}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: apiKey,
        ...payload
      })
    });

    const raw = await res.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      // ignore parse error, keep raw
    }

    const status = data?.status;
    const ok = res.ok && (
      status === '200' || status === 200 || status === true || data?.ack === 'success' || data?.ack === 'successfully'
    );

    return {
      ok,
      statusCode: res.status,
      data,
      raw,
      error: ok ? undefined : `Watzap request failed: HTTP ${res.status} ${raw}`
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      statusCode: 500,
      data: null,
      raw: '',
      error: `Watzap request exception: ${msg}`
    };
  }
}

export async function watzapHealthCheck() {
  const host = process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '') || undefined;
  return watzapPost('/checking_key', {
    ...(host ? { host } : {})
  });
}

export async function watzapListTemplates() {
  return watzapPost<{ data?: { items?: WatzapTemplateItem[] } }>('/waba_templates', {
    action: 'list'
  });
}

export async function watzapSyncTemplates() {
  return watzapPost('/waba_templates', {
    action: 'sync'
  });
}

export function parseWatzapTemplateItems(resp: any): WatzapTemplateItem[] {
  const items = resp?.data?.items;
  return Array.isArray(items) ? items : [];
}

export interface WatzapMessageLogItem {
  log_id?: string;
  message_id?: string | null;
  wamid?: string | null;
  api_name?: string | null;
  recipient?: string | null;
  status?: string | null;
  error?: string | null;
  http_code?: number | null;
  api_response_status?: string | number | null;
  payload?: Record<string, any> | null;
  created_at?: string | null;
  [key: string]: any;
}

/**
 * List outbound message logs from Watzap (status / error audit).
 * Useful to detect Meta rejections like "Re-engagement message".
 */
export async function watzapListMessages(options?: {
  limit?: number;
  offset?: number;
  status?: string;
  phoneNo?: string;
  recipient?: string;
}) {
  const payload: Record<string, any> = {
    action: 'list',
    limit: options?.limit ?? 20,
    offset: options?.offset ?? 0
  };
  if (options?.status) payload.status = options.status;
  if (options?.phoneNo) payload.phone_no = options.phoneNo;
  if (options?.recipient) payload.recipient = options.recipient;

  return watzapPost<{ data?: { items?: WatzapMessageLogItem[] } }>('/messages', payload);
}

export function parseWatzapMessageItems(resp: any): WatzapMessageLogItem[] {
  const items = resp?.data?.items;
  return Array.isArray(items) ? items : [];
}

/** Normalize Watzap/Meta delivery status string to our message status enum */
export function mapWatzapDeliveryStatus(raw: string | null | undefined): 'sent' | 'delivered' | 'read' | 'failed' | null {
  if (!raw) return null;
  const s = String(raw).toLowerCase();
  if (s.includes('fail') || s.includes('error') || s.includes('reject')) return 'failed';
  if (s.includes('read')) return 'read';
  if (s.includes('deliver')) return 'delivered';
  if (s.includes('sent') || s.includes('success') || s.includes('accepted')) return 'sent';
  return null;
}

export function extractWatzapInboundEvents(payload: any): Array<{
  providerMessageId: string | null;
  phone: string | null;
  senderName: string | null;
  text: string;
  messageType: string;
  mediaUrl: string | null;
  mediaMimeType: string | null;
  status: string | null;
  direction: 'incoming' | 'outgoing';
  timestampIso: string;
}> {
  const out: Array<{
    providerMessageId: string | null;
    phone: string | null;
    senderName: string | null;
    text: string;
    messageType: string;
    mediaUrl: string | null;
    mediaMimeType: string | null;
    status: string | null;
    direction: 'incoming' | 'outgoing';
    timestampIso: string;
  }> = [];

  // Meta/WABA-style payload — try top-level first, then Watzap Plus nested format
  let entries = Array.isArray(payload?.entry) ? payload.entry : [];

  // Watzap Plus wraps the Meta WABA payload inside payload.data.root_value
  if (entries.length === 0 && payload?.data?.root_value) {
    const rv = payload.data.root_value;
    if (Array.isArray(rv.messages) || Array.isArray(rv.contacts) || Array.isArray(rv.statuses)) {
      entries = [{ changes: [{ value: rv }] }];
    }
  }

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const ch of changes) {
      const value = ch?.value || {};
      const contacts = Array.isArray(value?.contacts) ? value.contacts : [];
      const messages = Array.isArray(value?.messages) ? value.messages : [];
      const statuses = Array.isArray(value?.statuses) ? value.statuses : [];

      const senderName = contacts[0]?.profile?.name || null;

      for (const m of messages) {
        const from = m?.from ? String(m.from) : null;
        const messageType = m?.type ? String(m.type) : 'text';
        const text = m?.text?.body || '';
        const ts = Number(m?.timestamp);
        const timestampIso = Number.isFinite(ts)
          ? new Date((ts < 9999999999 ? ts * 1000 : ts)).toISOString()
          : new Date().toISOString();

        out.push({
          providerMessageId: m?.id ? String(m.id) : null,
          phone: from,
          senderName,
          text,
          messageType,
          mediaUrl: null,
          mediaMimeType: null,
          status: null,
          direction: 'incoming',
          timestampIso
        });
      }

      for (const s of statuses) {
        const recipient = s?.recipient_id ? String(s.recipient_id) : null;
        const ts = Number(s?.timestamp);
        const timestampIso = Number.isFinite(ts)
          ? new Date((ts < 9999999999 ? ts * 1000 : ts)).toISOString()
          : new Date().toISOString();

        out.push({
          providerMessageId: s?.id ? String(s.id) : null,
          phone: recipient,
          senderName: null,
          text: '',
          messageType: 'status',
          mediaUrl: null,
          mediaMimeType: null,
          status: s?.status ? String(s.status) : null,
          direction: 'outgoing',
          timestampIso
        });
      }
    }
  }

  // Fallback generic payload (compat existing + Watzap Plus data-level fields)
  if (out.length === 0) {
    const dataLevel = payload?.data || {};
    const phone = payload?.waId || payload?.phone || payload?.whatsappNumber || payload?.senderNumber
      || dataLevel.phone || dataLevel.waId || null;
    if (phone) {
      const tsRaw = payload?.timestamp;
      let timestampIso = new Date().toISOString();
      if (tsRaw) {
        const ts = Number(tsRaw);
        if (!Number.isNaN(ts)) {
          timestampIso = new Date((ts < 9999999999 ? ts * 1000 : ts)).toISOString();
        } else {
          const d = new Date(tsRaw);
          if (!Number.isNaN(d.getTime())) timestampIso = d.toISOString();
        }
      }

      const isOwner = payload?.owner === true || payload?.isOwner === true || payload?.direction === 'outgoing';
      out.push({
        providerMessageId: payload?.id || payload?.messageId || payload?.wamid
          || dataLevel.message_raw?.id || null,
        phone: String(phone),
        senderName: payload?.senderName || payload?.name || payload?.displayName
          || dataLevel.root_value?.contacts?.[0]?.profile?.name || null,
        text: payload?.text || payload?.messageText || payload?.message || payload?.body
          || dataLevel.message_text || '',
        messageType: payload?.messageType || payload?.type || 'text',
        mediaUrl: payload?.mediaUrl || null,
        mediaMimeType: payload?.mediaMimeType || null,
        status: payload?.status || payload?.messageStatus || null,
        direction: isOwner ? 'outgoing' : 'incoming',
        timestampIso
      });
    }
  }

  logger.info('Watzap payload extracted events', { count: out.length });
  return out;
}
