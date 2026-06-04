import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getDb } from '@/lib/db';
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

    const db = getDb();

    // 1. Total Volume in last 24 hours
    const last24hIncoming = db.prepare(`
      SELECT COUNT(*) as count FROM whatsapp_messages
      WHERE direction = 'incoming' AND wati_timestamp >= datetime('now', '-1 day')
    `).get() as { count: number };

    const last24hOutgoing = db.prepare(`
      SELECT COUNT(*) as count FROM whatsapp_messages
      WHERE direction = 'outgoing' AND wati_timestamp >= datetime('now', '-1 day')
    `).get() as { count: number };

    // 2. Active conversations status breakdown
    const openConversations = db.prepare(`
      SELECT COUNT(*) as count FROM whatsapp_conversations WHERE status = 'open'
    `).get() as { count: number };

    const resolvedConversations = db.prepare(`
      SELECT COUNT(*) as count FROM whatsapp_conversations WHERE status = 'resolved'
    `).get() as { count: number };

    const pendingHumanConversations = db.prepare(`
      SELECT COUNT(*) as count FROM whatsapp_conversations WHERE status = 'pending_human'
    `).get() as { count: number };

    // 3. Response time calculation (median response time in minutes for the last 7 days)
    // Find each incoming message and its first outgoing reply
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
        incoming: last24hIncoming?.count || 0,
        outgoing: last24hOutgoing?.count || 0,
        total: (last24hIncoming?.count || 0) + (last24hOutgoing?.count || 0)
      },
      conversations: {
        open: openConversations?.count || 0,
        resolved: resolvedConversations?.count || 0,
        pending_human: pendingHumanConversations?.count || 0
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
