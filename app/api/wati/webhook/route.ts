import { NextRequest } from 'next/server';
import { handleWhatsAppWebhook, watiAuthVerifier } from '@/lib/whatsapp-webhook-handler';

export const dynamic = 'force-dynamic';

/**
 * POST /api/wati/webhook
 * Ingests incoming messages or status updates from WATI
 */
export async function POST(req: NextRequest) {
  return handleWhatsAppWebhook(req, {
    source: 'wati',
    verifyAuth: watiAuthVerifier
  });
}
