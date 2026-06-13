import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getSystemSettings } from '@/lib/repositories/settings';

// Validation Schema matching prompt expectation
export const WhatsAppAIInsightSchema = z.object({
  intent: z.enum([
    'price_inquiry', 'schedule_check', 'booking_request', 'payment_confirmation',
    'reschedule_request', 'cancel_request', 'complaint', 'testimonial',
    'follow_up_needed', 'unknown'
  ]),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  urgency: z.enum(['low', 'normal', 'high']),
  risk_level: z.enum(['low', 'medium', 'high']),
  needs_human: z.boolean(),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  suggested_next_action: z.string(),
  draft_reply: z.string(),
  guardrail_notes: z.string().optional()
});

export type WhatsAppAIInsight = z.infer<typeof WhatsAppAIInsightSchema>;

export interface AIRuntimeConfig {
  enabled: boolean;
  insightEnabled: boolean;
  draftEnabled: boolean;
  autoSendEnabled: boolean;
  provider: string;
  model: string;
  baseUrl: string;
  temperature: number;
  maxContextMessages: number;
  confidenceAutoSendThreshold: number;
  allowedAutoIntents: string;
  systemPromptTemplate: string;
}

function getDefaultBaseUrl(provider: string): string {
  if (provider === 'gemini') return 'https://generativelanguage.googleapis.com/v1beta/openai';
  if (provider === 'deepseek') return 'https://api.deepseek.com/v1';
  if (provider === 'openrouter') return 'https://openrouter.ai/api/v1';
  return 'https://api.openai.com/v1';
}

function sanitizeBaseUrl(rawUrl: string | undefined, provider: string): string {
  const fallback = getDefaultBaseUrl(provider);
  if (!rawUrl || !rawUrl.trim()) return fallback;

  try {
    const u = new URL(rawUrl.trim());
    if (u.protocol !== 'https:') return fallback;

    const hostname = u.hostname.toLowerCase();
    // Block obvious local/private hosts to reduce SSRF/key-exfil risk
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      /^10\./.test(hostname) ||
      /^127\./.test(hostname) ||
      /^169\.254\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
      hostname.startsWith('fe80:') ||
      hostname.startsWith('fc') ||
      hostname.startsWith('fd')
    ) {
      return fallback;
    }

    return u.origin + (u.pathname === '/' ? '' : u.pathname.replace(/\/$/, ''));
  } catch {
    return fallback;
  }
}

function resolveBaseUrl(provider: string, rawUrl?: string): string {
  const allowedProviders = new Set(['openai', 'gemini', 'deepseek', 'openrouter', 'custom']);
  const normalizedProvider = allowedProviders.has(provider) ? provider : 'openai';

  // Prevent custom endpoint override for known providers.
  // Only provider=custom may define a custom base URL.
  if (normalizedProvider !== 'custom') return getDefaultBaseUrl(normalizedProvider);

  const sanitized = sanitizeBaseUrl(rawUrl, normalizedProvider);
  if (!rawUrl || !rawUrl.trim()) return sanitized;

  // Defense-in-depth: custom endpoints must be explicitly allowlisted.
  const allowlist = (process.env.AI_CS_CUSTOM_BASE_URL_ALLOWLIST || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.length === 0) {
    logger.warn('[AI Brain] Custom base URL rejected: allowlist is empty');
    return getDefaultBaseUrl('openai');
  }

  try {
    const host = new URL(sanitized).hostname.toLowerCase();
    const allowed = allowlist.some(pattern => host === pattern || host.endsWith(`.${pattern}`));
    if (!allowed) {
      logger.warn('[AI Brain] Custom base URL rejected: host not in allowlist', { host });
      return getDefaultBaseUrl('openai');
    }
  } catch {
    return getDefaultBaseUrl('openai');
  }

  return sanitized;
}

function toBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true' || value === '1';
  return fallback;
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getAIRuntimeConfig(): AIRuntimeConfig {
  const envProvider = (process.env.AI_CS_PROVIDER || 'openai').toLowerCase();
  const envModel = process.env.AI_CS_MODEL || (envProvider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');

  try {
    const settings = getSystemSettings();
    const ai = settings.ai_brain;

    if (!ai) {
      return {
        enabled: process.env.AI_CS_ENABLED === 'true',
        insightEnabled: process.env.AI_CS_INSIGHT_ENABLED === 'true',
        draftEnabled: process.env.AI_CS_DRAFT_ENABLED === 'true',
        autoSendEnabled: process.env.AI_CS_AUTO_SEND_ENABLED === 'true',
        provider: envProvider,
        model: envModel,
        baseUrl: resolveBaseUrl(envProvider, process.env.AI_CS_BASE_URL),
        temperature: parseFloat(process.env.AI_CS_TEMPERATURE || '0.2'),
        maxContextMessages: parseInt(process.env.AI_CS_MAX_CONTEXT_MESSAGES || '30', 10),
        confidenceAutoSendThreshold: parseFloat(process.env.AI_CS_CONFIDENCE_AUTO_SEND_THRESHOLD || '0.85'),
        allowedAutoIntents: process.env.AI_CS_ALLOWED_AUTO_INTENTS || 'schedule_check,booking_request,testimonial,unknown',
        systemPromptTemplate: ''
      };
    }

    const provider = (ai.ai_cs_provider || envProvider).toLowerCase();
    return {
      enabled: toBool(ai.ai_cs_enabled, process.env.AI_CS_ENABLED === 'true'),
      insightEnabled: toBool(ai.ai_cs_insight_enabled, process.env.AI_CS_INSIGHT_ENABLED === 'true'),
      draftEnabled: toBool(ai.ai_cs_draft_enabled, process.env.AI_CS_DRAFT_ENABLED === 'true'),
      autoSendEnabled: toBool(ai.ai_cs_auto_send_enabled, process.env.AI_CS_AUTO_SEND_ENABLED === 'true'),
      provider,
      model: ai.ai_cs_model || envModel,
      baseUrl: resolveBaseUrl(provider, ai.ai_cs_base_url || process.env.AI_CS_BASE_URL),
      temperature: clamp(toNumber(ai.ai_cs_temperature, parseFloat(process.env.AI_CS_TEMPERATURE || '0.2')), 0, 2),
      maxContextMessages: Math.floor(clamp(toNumber(ai.ai_cs_max_context_messages, parseInt(process.env.AI_CS_MAX_CONTEXT_MESSAGES || '30', 10)), 1, 200)),
      confidenceAutoSendThreshold: clamp(toNumber(ai.ai_cs_confidence_auto_send_threshold, parseFloat(process.env.AI_CS_CONFIDENCE_AUTO_SEND_THRESHOLD || '0.85')), 0, 1),
      allowedAutoIntents: ai.ai_cs_allowed_auto_intents || process.env.AI_CS_ALLOWED_AUTO_INTENTS || 'schedule_check,booking_request,testimonial,unknown',
      systemPromptTemplate: ai.ai_cs_system_prompt || ''
    };
  } catch {
    return {
      enabled: process.env.AI_CS_ENABLED === 'true',
      insightEnabled: process.env.AI_CS_INSIGHT_ENABLED === 'true',
      draftEnabled: process.env.AI_CS_DRAFT_ENABLED === 'true',
      autoSendEnabled: process.env.AI_CS_AUTO_SEND_ENABLED === 'true',
      provider: envProvider,
      model: envModel,
      baseUrl: resolveBaseUrl(envProvider, process.env.AI_CS_BASE_URL),
      temperature: parseFloat(process.env.AI_CS_TEMPERATURE || '0.2'),
      maxContextMessages: parseInt(process.env.AI_CS_MAX_CONTEXT_MESSAGES || '30', 10),
      confidenceAutoSendThreshold: parseFloat(process.env.AI_CS_CONFIDENCE_AUTO_SEND_THRESHOLD || '0.85'),
      allowedAutoIntents: process.env.AI_CS_ALLOWED_AUTO_INTENTS || 'schedule_check,booking_request,testimonial,unknown',
      systemPromptTemplate: ''
    };
  }
}

/**
 * Checks if the AI features are enabled globally via runtime config (DB settings with env fallback)
 */
export function isAIEnabled(): boolean {
  return getAIRuntimeConfig().enabled;
}

export function isAIInsightEnabled(): boolean {
  return getAIRuntimeConfig().insightEnabled;
}

export function isAIDraftEnabled(): boolean {
  return getAIRuntimeConfig().draftEnabled;
}

/**
 * Generate a local, deterministic fallback insight when AI is disabled or fails
 */
export function generateDeterministicFallback(lastMessageText: string): WhatsAppAIInsight {
  const text = (lastMessageText || '').toLowerCase();
  
  // Reschedule / Cancel / Refund / Complaint keywords
  const escalateKeywords = ['batal', 'cancel', 'refund', 'reschedule', 'ubah jadwal', 'komplain', 'kecewa', 'salah', 'lambat', 'rusak', 'jelek'];
  const hasEscalate = escalateKeywords.some(kw => text.includes(kw));
  
  if (hasEscalate) {
    return {
      intent: text.includes('komplain') || text.includes('kecewa') ? 'complaint' : 'reschedule_request',
      sentiment: 'negative',
      urgency: 'high',
      risk_level: 'high',
      needs_human: true,
      confidence: 0.9,
      summary: 'Pelanggan meminta perubahan jadwal, pembatalan, atau menyampaikan keluhan.',
      suggested_next_action: 'Segera tangani percakapan ini secara manual oleh tim CS.',
      draft_reply: 'Mohon maaf atas ketidaknyamanannya ya Kak. Pesan Kakak sudah masuk ke antrean tim CS kami dan akan segera dibantu langsung secara manual. Boleh diinfokan nomor booking atau nama pemesanannya?',
      guardrail_notes: 'Fallback deterministik dipicu. Topik sensitif terdeteksi.'
    };
  }

  // Payment confirmation keywords
  const paymentKeywords = ['bukti', 'transfer', 'lunas', 'bayar', 'dp', 'pembayaran', 'sudah kirim uang'];
  const hasPayment = paymentKeywords.some(kw => text.includes(kw));

  if (hasPayment) {
    return {
      intent: 'payment_confirmation',
      sentiment: 'neutral',
      urgency: 'normal',
      risk_level: 'medium',
      needs_human: true,
      confidence: 0.85,
      summary: 'Pelanggan mengonfirmasi pembayaran atau mengirim bukti transfer.',
      suggested_next_action: 'Periksa detail pembayaran di Linked Booking atau mutasi rekening secara manual.',
      draft_reply: 'Terima kasih Kak konfirmasinya. Pembayaran Kakak akan segera diverifikasi oleh tim administrasi kami ya. Mohon ditunggu sebentar.',
      guardrail_notes: 'Konfirmasi pembayaran memerlukan validasi manusia.'
    };
  }

  // Price inquiries
  const priceKeywords = ['harga', 'paket', 'berapa', 'pricelist', 'detail', 'include', 'biaya', 'promo'];
  const hasPrice = priceKeywords.some(kw => text.includes(kw));

  if (hasPrice) {
    return {
      intent: 'price_inquiry',
      sentiment: 'neutral',
      urgency: 'normal',
      risk_level: 'low',
      needs_human: false,
      confidence: 0.8,
      summary: 'Pelanggan menanyakan informasi paket harga foto studio.',
      suggested_next_action: 'Bagikan pricelist paket dan tanyakan tanggal/jenis sesi yang diinginkan.',
      draft_reply: 'Halo Kak! Untuk pricelist paket foto di CeritaKita, kami memiliki paket Prewedding, Wedding, Wisuda, dan Family. Kakak berencana mengambil sesi foto untuk kategori apa ya? Biar kami infokan paket terbaiknya.',
      guardrail_notes: 'Pertanyaan harga dapat dilayani dengan draft cepat.'
    };
  }

  // General check schedule
  if (text.includes('tanggal') || text.includes('slot') || text.includes('kosong') || text.includes('jam') || text.includes('booking')) {
    return {
      intent: 'schedule_check',
      sentiment: 'neutral',
      urgency: 'normal',
      risk_level: 'low',
      needs_human: false,
      confidence: 0.8,
      summary: 'Pelanggan menanyakan ketersediaan jadwal atau slot sesi.',
      suggested_next_action: 'Minta tanggal dan jam preferensi pelanggan untuk dicocokkan dengan ketersediaan studio.',
      draft_reply: 'Halo Kak! Bisa diinfokan rencana foto untuk tanggal berapa dan di jam berapa? Kami bantu periksa ketersediaan slot studio kami.',
      guardrail_notes: 'Draft menanyakan detail tanggal secara aman.'
    };
  }

  // Testimonials
  if (text.includes('makasih') || text.includes('terima kasih') || text.includes('bagus') || text.includes('puas') || text.includes('keren')) {
    return {
      intent: 'testimonial',
      sentiment: 'positive',
      urgency: 'low',
      risk_level: 'low',
      needs_human: false,
      confidence: 0.95,
      summary: 'Pelanggan menyatakan rasa puas atau mengucapkan terima kasih.',
      suggested_next_action: 'Ucapkan terima kasih kembali dan tawarkan bantuan lain.',
      draft_reply: 'Sama-sama Kak! Terima kasih banyak atas kepercayaannya berfoto di CeritaKita. Senang sekali bisa menjadi bagian dari momen berharga Kakak. Ditunggu sesi foto selanjutnya ya!',
      guardrail_notes: 'Feedback positif terdeteksi.'
    };
  }

  // Default fallback
  return {
    intent: 'unknown',
    sentiment: 'neutral',
    urgency: 'normal',
    risk_level: 'low',
    needs_human: false,
    confidence: 0.5,
    summary: 'Pelanggan mengirimkan pesan pembuka atau pesan umum.',
    suggested_next_action: 'Balas dengan menyapa dan menawarkan bantuan.',
    draft_reply: 'Halo Kak, ada yang bisa tim CeritaKita bantu hari ini?',
    guardrail_notes: 'Pesan umum/tidak terklasifikasi.'
  };
}

/**
 * Perform chat completion request to OpenAI or Gemini
 */
export async function getAICompletion(customerContext: any, _promptType: 'insight' | 'draft'): Promise<WhatsAppAIInsight> {
  if (!isAIEnabled()) {
    logger.info('[AI Brain] AI is disabled, using deterministic fallback');
    const lastMsgText = customerContext.messageHistory?.slice(-1)[0]?.text || '';
    return generateDeterministicFallback(lastMsgText);
  }

  const cfg = getAIRuntimeConfig();
  const provider = cfg.provider;
  const model = cfg.model;
  const temp = cfg.temperature;
  
  let apiKey = '';
  let apiUrl = '';

  const baseUrl = cfg.baseUrl;
  apiUrl = `${baseUrl}/chat/completions`;

  // API Key selection
  if (provider === 'gemini') {
    apiKey = process.env.GEMINI_API_KEY || '';
  } else {
    // OpenAI, DeepSeek, OpenRouter, and custom providers all use OPENAI_API_KEY env
    apiKey = process.env.OPENAI_API_KEY || '';
  }

  if (!apiKey || apiKey.startsWith('mock-')) {
    logger.warn(`[AI Brain] Provider API Key for ${provider} is missing or placeholder. Using fallback.`);
    const lastMsgText = customerContext.messageHistory?.slice(-1)[0]?.text || '';
    return generateDeterministicFallback(lastMsgText);
  }

  // Assemble contextual snapshots
  const contextString = JSON.stringify({
    crmLabel: customerContext.crmLabel,
    linkedBooking: customerContext.summary.linkedBooking,
    activeBookings: customerContext.bookings.filter((b: any) => b.status === 'Active' || b.status === 'Rescheduled').map((b: any) => ({
      id: b.id,
      status: b.status,
      category: b.category,
      date: b.date,
      totalPrice: b.totalPrice,
      totalPaid: b.totalPaid,
      sisa: b.sisa
    })),
    summary: {
      totalBookings: customerContext.summary.totalBookingsCount,
      activeBookings: customerContext.summary.activeBookingsCount,
      totalPaid: customerContext.summary.totalAmountPaid,
      totalOutstanding: customerContext.summary.totalOutstanding
    }
  });

  const messageHistory = Array.isArray(customerContext.messageHistory)
    ? customerContext.messageHistory.slice(-cfg.maxContextMessages)
    : [];

  const chatHistory = messageHistory.map((m: any) => {
    const roleName = m.direction === 'incoming' ? 'Customer' : 'CS Agent';
    return `[${roleName}] at ${m.wati_timestamp}: ${m.text}`;
  }).join('\n');

  const defaultSystemInstructions = `
You are the central brain AI assistant for CeritaKita Studio customer service.
Analyze the provided customer history and context to reply intelligently.

CUSTOMER CONTEXT SUMMARY:
{{contextString}}

CHAT HISTORY:
{{chatHistory}}

Aturan Wajib (Guardrails):
1. DILARANG KERAS mengarang/berhalusinasi mengenai harga paket, diskon, ketersediaan slot/jadwal, atau status pembayaran yang tidak tercantum di CUSTOMER CONTEXT SUMMARY.
2. Jika informasi pembayaran, refund, pembatalan (cancel), reschedule, komplain, atau kemarahan pelanggan terdeteksi:
   - Set "needs_human" to true.
   - Set "risk_level" to "high" or "medium".
   - Draft a polite, empathetic response stating that a human CS agent is checking the details.
3. Gunakan Bahasa Indonesia yang ramah, sopan, singkat, natural, dan hangat untuk WhatsApp (e.g. use "Kakak" or "Kak").
4. Dilarang menyebut bahwa Anda adalah AI kecuali ditanya secara eksplisit.
5. Bila pelanggan menanyakan harga atau paket:
   - Jawab hanya dengan informasi yang ada di context.
   - Jika tidak ada, sebutkan pilihan kategori (Prewedding, Wedding, Wisuda, Family) dan minta detail kebutuhan pelanggan.
6. Bila pelanggan ingin booking, arahkan untuk menentukan tanggal/jam sesi terlebih dahulu.
7. JANGAN PERNAH menyertakan data sensitif pelanggan lain.

You MUST respond strictly in the following JSON format:
{
  "intent": "price_inquiry" | "schedule_check" | "booking_request" | "payment_confirmation" | "reschedule_request" | "cancel_request" | "complaint" | "testimonial" | "follow_up_needed" | "unknown",
  "sentiment": "positive" | "neutral" | "negative",
  "urgency": "low" | "normal" | "high",
  "risk_level": "low" | "medium" | "high",
  "needs_human": boolean,
  "confidence": number (between 0.0 and 1.0),
  "summary": "Short 1-2 sentences summarizing the current chat context.",
  "suggested_next_action": "Recommended next action for CS.",
  "draft_reply": "Your recommended friendly draft reply for the customer.",
Formatting draft_reply (WhatsApp markdown):
  - Gunakan *text* untuk BOLD pada WhatsApp (ini format bold WhatsApp, bukan markdown **).
  - Struktur balasan harus terlihat rapi dan mudah dibaca:
    1. Baris 1: Sapaan singkat + konfirmasi/terima kasih (1 baris saja)
    2. Spasi kosong 1 baris
    3. Baris berikutnya: Informasi utama (paket/harga/detail) — boleh pakai *bold* untuk highlight nama paket atau harga
    4. Spasi kosong 1 baris
    5. Baris terakhir: Pertanyaan ke pelanggan (gabungkan semua pertanyaan di 1 block)
  - JANGAN jadikan semua kalimat 1 paragraf utuh tanpa jeda.
  - JANGAN pisah tiap kalimat jadi line break sendiri-sendiri.
  - Contoh format yang baik:
    "Halo Kak! Terima kasih sudah menghubungi CeritaKita 🙏

*Paket Self Photo* mulai dari *Rp 250.000* ya, sudah termasuk 2x ganti kostum dan 10 foto edit.

Kakak rencana foto untuk berapa orang dan kapan? Biar kami bantu cek ketersediaan slotnya."
  - Hindari lebih dari 1 spasi kosong berurutan.
  "guardrail_notes": "Note if any safety rule was triggered or if any information was missing."
}
`;

  const promptTemplate = cfg.systemPromptTemplate?.trim() || defaultSystemInstructions;
  const systemInstructions = promptTemplate
    .replaceAll('{{contextString}}', contextString)
    .replaceAll('{{chatHistory}}', chatHistory);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemInstructions },
          { role: 'user', content: 'Generate response object based on the context.' }
        ],
        temperature: temp,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP Error ${response.status} from ${provider}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No completion content returned');
    }

    const parsedJson = JSON.parse(content);
    // Parse and validate using Zod schema
    const result = WhatsAppAIInsightSchema.parse(parsedJson);
    
    return result;

  } catch (error) {
    logger.error('[AI Brain] Completion error, falling back to deterministic insight', { error: String(error) });
    const lastMsgText = customerContext.messageHistory?.slice(-1)[0]?.text || '';
    return generateDeterministicFallback(lastMsgText);
  }
}
