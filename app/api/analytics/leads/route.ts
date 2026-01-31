import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Authentication check
    const authError = await requireAuth(req);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
        return NextResponse.json({ error: 'Missing date range (start, end)' }, { status: 400 });
    }

    // Ensure robust date handling
    // If end date is just YYYY-MM-DD, we want to include the whole day, so append time if missing
    const startDateStr = start.includes('T') ? start : `${start} 00:00:00`;
    const endDateStr = end.includes('T') ? end : `${end} 23:59:59`;

    try {
        const db = getDb();

        // 1. Total Leads
        const totalLeadsQuery = db.prepare(`
      SELECT COUNT(*) as count 
      FROM leads 
      WHERE created_at >= ? AND created_at <= ?
    `);
        const totalLeadsResult = totalLeadsQuery.get(startDateStr, endDateStr) as { count: number };
        const totalLeads = totalLeadsResult.count;

        // 2. Total Won
        const totalWonQuery = db.prepare(`
      SELECT COUNT(*) as count 
      FROM leads 
      WHERE status IN ('Won', 'Converted') 
      AND created_at >= ? AND created_at <= ?
    `);
        const totalWonResult = totalWonQuery.get(startDateStr, endDateStr) as { count: number };
        const totalWon = totalWonResult.count;

        // 3. By Agent Stats
        // Left join users to get names. Handle unassigned as well.
        const agentStatsQuery = db.prepare(`
      SELECT 
        u.username,
        l.assigned_to,
        COUNT(*) as total,
        SUM(CASE WHEN l.status IN ('Won', 'Converted') THEN 1 ELSE 0 END) as won
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.created_at >= ? AND l.created_at <= ?
      GROUP BY l.assigned_to
      ORDER BY total DESC
    `);

        const agentStatsRaw = agentStatsQuery.all(startDateStr, endDateStr) as Array<{
            username: string | null,
            assigned_to: string | null,
            total: number,
            won: number
        }>;

        // Process and format
        const by_agent = agentStatsRaw.map(stat => {
            const name = stat.username || (stat.assigned_to ? 'Unknown Admin' : 'Unassigned');
            const conversion_rate = stat.total > 0 ? (stat.won / stat.total) * 100 : 0;

            return {
                name,
                assigned_to: stat.assigned_to, // Keep ID for reference if needed
                total: stat.total,
                won: stat.won,
                conversion_rate
            };
        });

        // Calculate global conversion rate
        const globalConversionRate = totalLeads > 0 ? (totalWon / totalLeads) * 100 : 0;

        return NextResponse.json({
            total_leads: totalLeads,
            total_won: totalWon,
            conversion_rate: globalConversionRate,
            by_agent
        });

    } catch (error) {
        console.error('Analytics API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
