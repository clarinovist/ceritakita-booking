/**
 * GET /api/admin/whatsapp/metrics
 *
 * Returns AI/CS metrics for the WhatsApp workspace:
 * - Draft generation stats (total, sent, edited, rejected)
 * - % drafts sent without edit
 * - First-response time stats
 * - Chat → booking conversion
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getDb } from '@/lib/db';
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

    const db = getDb();

    // 1. Draft stats (last 30 days)
    const draftStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'edited' THEN 1 ELSE 0 END) as edited,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_only,
        SUM(CASE WHEN status = 'drafted' THEN 1 ELSE 0 END) as pending
      FROM whatsapp_ai_drafts
      WHERE created_at >= datetime('now', '-30 days')
    `).get() as {
      total: number;
      sent: number;
      edited: number;
      rejected: number;
      approved_only: number;
      pending: number;
    };

    // 2. % drafts sent without edit (sent directly from drafted, not via edited)
    const sentWithoutEdit = draftStats.total > 0
      ? Math.round(((draftStats.sent + draftStats.approved_only) / draftStats.total) * 100)
      : 0;

    // 3. First-response time (inbound → first outbound within same conversation, last 30 days)
    const responseTimes = db.prepare(`
      SELECT
        m1.conversation_id,
        m1.wati_timestamp as inbound_at,
        (
          SELECT MIN(m2.wati_timestamp)
          FROM whatsapp_messages m2
          WHERE m2.conversation_id = m1.conversation_id
            AND m2.direction = 'outgoing'
            AND m2.wati_timestamp > m1.wati_timestamp
        ) as first_outbound_at
      FROM whatsapp_messages m1
      WHERE m1.direction = 'incoming'
        AND m1.wati_timestamp >= datetime('now', '-30 days')
      GROUP BY m1.conversation_id
      HAVING first_outbound_at IS NOT NULL
      LIMIT 500
    `).all() as Array<{
      conversation_id: string;
      inbound_at: string;
      first_outbound_at: string;
    }>;

    let avgResponseMinutes = 0;
    let medianResponseMinutes = 0;
    if (responseTimes.length > 0) {
      const diffs = responseTimes.map(r => {
        const inbound = new Date(r.inbound_at).getTime();
        const outbound = new Date(r.first_outbound_at).getTime();
        return Math.max(0, (outbound - inbound) / (1000 * 60));
      }).sort((a, b) => a - b);

      const totalMinutes = diffs.reduce((sum, d) => sum + d, 0);
      avgResponseMinutes = Math.round(totalMinutes / diffs.length);
      medianResponseMinutes = Math.round(diffs[Math.floor(diffs.length / 2)] || 0);
    }

    // 4. Chat → booking conversion (conversations with booking_id set, last 30 days)
    const chatBookings = db.prepare(`
      SELECT
        COUNT(*) as total_with_booking,
        (SELECT COUNT(*) FROM whatsapp_conversations
         WHERE last_message_at >= datetime('now', '-30 days')
         AND status != 'archived') as total_active_conversations
      FROM whatsapp_conversations
      WHERE booking_id IS NOT NULL
        AND last_message_at >= datetime('now', '-30 days')
    `).get() as {
      total_with_booking: number;
      total_active_conversations: number;
    };

    const conversionRate = chatBookings.total_active_conversations > 0
      ? Math.round((chatBookings.total_with_booking / chatBookings.total_active_conversations) * 100)
      : 0;

    // 5. AI event summary (last 30 days)
    const aiEventStats = db.prepare(`
      SELECT
        event_type,
        COUNT(*) as count
      FROM whatsapp_ai_events
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY event_type
    `).all() as Array<{ event_type: string; count: number }>;

    return NextResponse.json({
      period: 'last_30_days',
      drafts: {
        total: draftStats.total || 0,
        sent: draftStats.sent || 0,
        edited: draftStats.edited || 0,
        rejected: draftStats.rejected || 0,
        approvedOnly: draftStats.approved_only || 0,
        pending: draftStats.pending || 0,
        sentWithoutEditPercent: sentWithoutEdit,
      },
      responseTime: {
        avgMinutes: avgResponseMinutes,
        medianMinutes: medianResponseMinutes,
        sampleSize: responseTimes.length,
      },
      conversion: {
        chatWithBooking: chatBookings.total_with_booking || 0,
        totalActiveChats: chatBookings.total_active_conversations || 0,
        conversionRatePercent: conversionRate,
      },
      aiEvents: aiEventStats,
    });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
