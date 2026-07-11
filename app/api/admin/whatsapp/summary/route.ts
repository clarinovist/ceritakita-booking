import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getWhatsappSummaryMetrics } from '@/lib/repositories/whatsapp';
import { AppError, createErrorResponse } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/whatsapp/summary
 * Retrieve conversation analytics and key metrics
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const user = session.user as any;
    if (user.role !== 'admin' && user.permissions?.whatsapp !== true) {
      throw new AppError('Forbidden. WhatsApp permission required.', 403, 'FORBIDDEN');
    }

    const {
      last24hIncoming,
      last24hOutgoing,
      openConversations,
      resolvedConversations,
      pendingHumanConversations,
      responseTimes
    } = getWhatsappSummaryMetrics();

    let medianResponseTimeMinutes = 0;
    if (responseTimes.length > 0) {
      const mid = Math.floor(responseTimes.length / 2);
      if (responseTimes.length % 2 !== 0) {
        medianResponseTimeMinutes = responseTimes[mid]?.diff_minutes || 0;
      } else {
        const val1 = responseTimes[mid - 1]?.diff_minutes || 0;
        const val2 = responseTimes[mid]?.diff_minutes || 0;
        medianResponseTimeMinutes = (val1 + val2) / 2;
      }
    }

    return NextResponse.json({
      last24h: {
        incoming: last24hIncoming,
        outgoing: last24hOutgoing,
        total: last24hIncoming + last24hOutgoing
      },
      conversations: {
        open: openConversations,
        resolved: resolvedConversations,
        pending_human: pendingHumanConversations
      },
      analytics: {
        medianResponseTimeMinutes: Math.round(medianResponseTimeMinutes * 10) / 10
      }
    });

  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
