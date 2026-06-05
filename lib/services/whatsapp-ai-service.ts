import { z } from 'zod';
import { logger } from '@/lib/logger';

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

/**
 * Checks if the AI features are enabled globally via environment variables
 */
export function isAIEnabled(): boolean {
  return process.env.AI_CS_ENABLED === 'true';
}

export function isAIInsightEnabled(): boolean {
  return process.env.AI_CS_INSIGHT_ENABLED === 'true';
}

export function isAIDraftEnabled(): boolean {
  return process.env.AI_CS_DRAFT_ENABLED === 'true';
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

  const provider = (process.env.AI_CS_PROVIDER || 'openai').toLowerCase();
  const model = process.env.AI_CS_MODEL || (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');
  const temp = parseFloat(process.env.AI_CS_TEMPERATURE || '0.2');
  
  let apiKey = '';
  let apiUrl = '';

  if (provider === 'gemini') {
    apiKey = process.env.GEMINI_API_KEY || '';
    apiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
  } else {
    apiKey = process.env.OPENAI_API_KEY || '';
    apiUrl = 'https://api.openai.com/v1/chat/completions';
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

  const chatHistory = customerContext.messageHistory.map((m: any) => {
    const roleName = m.direction === 'incoming' ? 'Customer' : 'CS Agent';
    return `[${roleName}] at ${m.wati_timestamp}: ${m.text}`;
  }).join('\n');

  const systemInstructions = `
You are the central brain AI assistant for CeritaKita Studio customer service.
Analyze the provided customer history and context to reply intelligently.

CUSTOMER CONTEXT SUMMARY:
${contextString}

CHAT HISTORY:
${chatHistory}

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
  "guardrail_notes": "Note if any safety rule was triggered or if any information was missing."
}
`;

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
