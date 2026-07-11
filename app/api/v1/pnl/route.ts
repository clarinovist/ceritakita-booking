import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/api-v1-auth';
import { getRevenueForPnL, getExpensesForPnL } from '@/lib/repositories/finance';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/pnl
 * Profit & Loss report.
 * Query params: startDate, endDate
 */
export async function GET(req: NextRequest) {
  const authError = requireAgentAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 1. Revenue (from bookings, excluding cancelled)
    const bookings = getRevenueForPnL({ startDate, endDate });

    const revenueByCategory = new Map<string, number>();
    let totalRevenue = 0;

    for (const b of bookings) {
      const category = b.customer_category || 'Uncategorized';
      const current = revenueByCategory.get(category) || 0;
      revenueByCategory.set(category, current + b.total_price);
      totalRevenue += b.total_price;
    }

    const revenueBreakdown = Array.from(revenueByCategory.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // 2. Expenses
    const expenses = getExpensesForPnL({ startDate, endDate });

    const expensesByCategory = new Map<string, number>();
    let totalExpenses = 0;

    for (const e of expenses) {
      const category = e.category || 'Other';
      const current = expensesByCategory.get(category) || 0;
      expensesByCategory.set(category, current + e.amount);
      totalExpenses += e.amount;
    }

    const expenseBreakdown = Array.from(expensesByCategory.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // 3. Net Profit
    const netProfit = totalRevenue - totalExpenses;

    logger.info('Agent API: PnL', { totalRevenue, totalExpenses, netProfit });

    return NextResponse.json({
      period: {
        start: startDate,
        end: searchParams.get('endDate'),
      },
      revenue: {
        total: totalRevenue,
        breakdown: revenueBreakdown,
      },
      expenses: {
        total: totalExpenses,
        breakdown: expenseBreakdown,
      },
      netProfit,
    });
  } catch (error) {
    logger.error('Agent API: PnL error', { error: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
