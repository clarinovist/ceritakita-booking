import { NextRequest, NextResponse } from 'next/server';
import { handleWhatsAppWebhook } from '@/lib/whatsapp-webhook-handler';

export const dynamic = 'force-dynamic';

/**
 * POST /api/watzap/webhook
 * Ingests incoming messages or status updates from Watzap.id
 * (Meta WABA standard webhook format)
 */
export async function POST(req: NextRequest) {
  return handleWhatsAppWebhook(req, { source: 'watzap' });
}

/**
 * GET /api/watzap/webhook
 * Handle Watzap/Meta WABA webhook verification challenge.
 * Watzap sends a GET with hub.mode, hub.verify_token, hub.challenge
 * to verify the endpoint before enabling the webhook.
 */
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode');
  const token = req.nextUrl.searchParams.get('hub.verify_token');
  const challenge = req.nextUrl.searchParams.get('hub.challenge');

  const expectedToken = process.env.WATZAP_VERIFY_TOKEN || '';

  if (mode === 'subscribe' && token === expectedToken && challenge) {
    console.log('[watzap] Webhook verification challenge accepted');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}
