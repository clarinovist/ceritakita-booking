import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/api-v1-auth';
import { getDb } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/cash-position
 * Cash position summary with monthly breakdown.
 * Query params: startDate, endDate (defaults to last 6 months)
 */
export async function GET(req: NextRequest) {
  const authError = requireAgentAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const end = endDateParam ? new Date(endDateParam) : new Date();
    const start = startDateParam ? new Date(startDateParam) : new Date(new Date().setMonth(end.getMonth() - 5));
    start.setDate(1);

    const db = getDb();

    // Get initial cash balance from system_settings
    const settingRow = db.prepare("SELECT value FROM system_settings WHERE key = 'initial_cash_balance'").get() as { value: string } | undefined;
    const initialCashBalance = settingRow ? Number(settingRow.value) || 0 : 0;

    // Get all payments for cash-in
    const payments = db.prepare(`
      SELECT pay.amount, pay.date
      FROM payments pay
      ORDER BY pay.date ASC
    `).all() as Array<{ amount: number; date: string }>;

    // Get all expenses for cash-out
    const expenses = db.prepare(`
      SELECT amount, date
      FROM expenses
      ORDER BY date ASC
    `).all() as Array<{ amount: number; date: string }>;

    // Build monthly data
    const monthlyData: Record<string, { cashIn: number; cashOut: number }> = {};
    let current = new Date(start);
    while (current <= end) {
      const key = current.toISOString().substring(0, 7);
      monthlyData[key] = { cashIn: 0, cashOut: 0 };
      current.setMonth(current.getMonth() + 1);
    }

    let totalCashIn = 0;
    let totalCashOut = 0;
    let priorCashIn = 0;
    let priorCashOut = 0;

    for (const payment of payments) {
      totalCashIn += payment.amount;
      const pDate = new Date(payment.date);
      if (pDate < start) {
        priorCashIn += payment.amount;
      }
      const key = pDate.toISOString().substring(0, 7);
      if (monthlyData[key]) {
        monthlyData[key].cashIn += payment.amount;
      }
    }

    for (const expense of expenses) {
      totalCashOut += expense.amount;
      const eDate = new Date(expense.date);
      if (eDate < start) {
        priorCashOut += expense.amount;
      }
      const key = eDate.toISOString().substring(0, 7);
      if (monthlyData[key]) {
        monthlyData[key].cashOut += expense.amount;
      }
    }

    const currentPosition = initialCashBalance + totalCashIn - totalCashOut;
    let runningBalance = initialCashBalance + priorCashIn - priorCashOut;

    const breakdown = Object.keys(monthlyData).sort().map(month => {
      const data = monthlyData[month];
      if (!data) return null;
      runningBalance += (data.cashIn - data.cashOut);
      return {
        month,
        cashIn: data.cashIn,
        cashOut: data.cashOut,
        netFlow: data.cashIn - data.cashOut,
        runningBalance,
      };
    }).filter(Boolean);

    const periodSummary = breakdown.reduce(
      (acc, curr) => ({
        totalCashIn: acc.totalCashIn + (curr?.cashIn || 0),
        totalCashOut: acc.totalCashOut + (curr?.cashOut || 0),
        netCashFlow: acc.netCashFlow + (curr?.netFlow || 0),
      }),
      { totalCashIn: 0, totalCashOut: 0, netCashFlow: 0 }
    );

    logger.info('Agent API: cash-position', { currentPosition });

    return NextResponse.json({
      currentPosition,
      initialBalance: initialCashBalance,
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      summary: periodSummary,
      monthlyBreakdown: breakdown,
    });
  } catch (error) {
    logger.error('Agent API: cash-position error', { error: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
