import { getExpenses } from '@/lib/repositories/expenses';
import { readData } from '@/lib/repositories/bookings';
import { getSystemSettings } from '@/lib/repositories/settings';

export interface CashPositionReport {
  currentPosition: number;
  initialBalance: number;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalCashIn: number;
    totalCashOut: number;
    netCashFlow: number;
  };
  monthlyBreakdown: Array<{
    month: string;
    cashIn: number;
    cashOut: number;
    netFlow: number;
    runningBalance: number;
  }>;
}

export function getCashPositionReport(startDateParam?: string | null, endDateParam?: string | null): CashPositionReport {
  const end = endDateParam ? new Date(endDateParam) : new Date();
  const start = startDateParam ? new Date(startDateParam) : new Date(new Date().setMonth(end.getMonth() - 5));
  start.setDate(1); // Start from beginning of the month

  const settings = getSystemSettings();
  const initialCashBalance = settings.initial_cash_balance || 0;

  // Fetch data
  const allBookings = readData();
  const expenses = getExpenses(); // Fetch all for running balance logic

  // Group by month
  const monthlyData: Record<string, { cashIn: number; cashOut: number }> = {};

  // Generate months range
  let current = new Date(start);
  while (current <= end) {
    const key = current.toISOString().substring(0, 7); // YYYY-MM
    monthlyData[key] = { cashIn: 0, cashOut: 0 };
    current.setMonth(current.getMonth() + 1);
  }

  let totalCashIn = 0;
  let totalCashOut = 0;
  let priorCashIn = 0;
  let priorCashOut = 0;

  // Single Pass for Bookings
  for (let i = 0; i < allBookings.length; i++) {
    const booking = allBookings[i];
    if (!booking) continue;
    const payments = booking.finance.payments;
    for (let j = 0; j < payments.length; j++) {
      const payment = payments[j];
      if (!payment) continue;
      const amount = payment.amount;
      totalCashIn += amount;

      const pDate = new Date(payment.date);
      if (pDate < start) {
        priorCashIn += amount;
      }

      const key = pDate.toISOString().substring(0, 7);
      if (monthlyData[key]) {
        monthlyData[key].cashIn += amount;
      }
    }
  }

  // Single Pass for Expenses
  for (let i = 0; i < expenses.length; i++) {
    const expense = expenses[i];
    if (!expense) continue;
    const amount = expense.amount;
    totalCashOut += amount;

    const eDate = new Date(expense.date);
    if (eDate < start) {
      priorCashOut += amount;
    }

    const key = eDate.toISOString().substring(0, 7);
    if (monthlyData[key]) {
      monthlyData[key].cashOut += amount;
    }
  }

  const currentPosition = initialCashBalance + totalCashIn - totalCashOut;
  let runningBalance = initialCashBalance + priorCashIn - priorCashOut;

  const breakdown = Object.keys(monthlyData).sort().map(month => {
    const data = monthlyData[month];
    if (!data) return null; // Should not happen given the keys
    runningBalance += (data.cashIn - data.cashOut);
    return {
      month,
      cashIn: data.cashIn,
      cashOut: data.cashOut,
      netFlow: data.cashIn - data.cashOut,
      runningBalance
    };
  }).filter(Boolean) as Array<{
    month: string;
    cashIn: number;
    cashOut: number;
    netFlow: number;
    runningBalance: number;
  }>;

  const periodSummary = breakdown.reduce((acc, curr) => ({
    totalCashIn: acc.totalCashIn + curr.cashIn,
    totalCashOut: acc.totalCashOut + curr.cashOut,
    netCashFlow: acc.netCashFlow + curr.netFlow
  }), { totalCashIn: 0, totalCashOut: 0, netCashFlow: 0 });

  return {
    currentPosition,
    initialBalance: initialCashBalance,
    period: {
      start: start.toISOString().split('T')[0] ?? '',
      end: end.toISOString().split('T')[0] ?? ''
    },
    summary: periodSummary,
    monthlyBreakdown: breakdown
  };
}

export interface PnLReport {
  period: {
    start: string | null;
    end: string | null;
  };
  revenue: {
    total: number;
    breakdown: Array<{ category: string; amount: number }>;
  };
  expenses: {
    total: number;
    breakdown: Array<{ category: string; amount: number }>;
  };
  netProfit: number;
}

export function getPnLReport(startDate?: string | null, endDate?: string | null): PnLReport {
  // 1. Calculate Revenue (from Bookings)
  let bookings = readData(startDate || undefined, endDate || undefined);

  // Only include active/completed bookings for P&L
  bookings = bookings.filter(b => b.status !== 'Cancelled');

  const revenueByCategory = new Map<string, number>();
  let totalRevenue = 0;

  bookings.forEach(b => {
    const category = b.customer.category || 'Uncategorized';
    const amount = b.finance.total_price;

    const current = revenueByCategory.get(category) || 0;
    revenueByCategory.set(category, current + amount);
    totalRevenue += amount;
  });

  const revenueBreakdown = Array.from(revenueByCategory.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // 2. Calculate Expenses
  const expenses = getExpenses(startDate || undefined, endDate || undefined);

  const expensesByCategory = new Map<string, number>();
  let totalExpenses = 0;

  expenses.forEach(e => {
    const category = e.category || 'Other';
    const amount = e.amount;

    const current = expensesByCategory.get(category) || 0;
    expensesByCategory.set(category, current + amount);
    totalExpenses += amount;
  });

  const expenseBreakdown = Array.from(expensesByCategory.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // 3. Net Profit
  const netProfit = totalRevenue - totalExpenses;

  return {
    period: {
      start: startDate || null,
      end: endDate || null
    },
    revenue: {
      total: totalRevenue,
      breakdown: revenueBreakdown
    },
    expenses: {
      total: totalExpenses,
      breakdown: expenseBreakdown
    },
    netProfit
  };
}
