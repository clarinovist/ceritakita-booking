/**
 * GET /api/admin/whatsapp/metrics
 *
 * Returns AI/CS metrics for the WhatsApp workspace:
 * - Draft generation stats (total, sent, edited, rejected)
 * - % drafts sent without edit (from events, not status)
 * - First-response time stats
 * - Chat → booking conversion
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getWhatsAppCsMetrics } from '@/lib/repositories/whatsapp';
import { AppError, createErrorResponse } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const user = session.user as { role?: string; permissions?: { whatsapp?: boolean } };
    if (user.role !== 'admin' && user.permissions?.whatsapp !== true) {
      throw new AppError('Forbidden. WhatsApp permission required.', 403, 'FORBIDDEN');
    }

    const metrics = getWhatsAppCsMetrics();

    return NextResponse.json({
      period: 'last_30_days',
      ...metrics,
    });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
