import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getExpenses } from '@/lib/storage-expenses';
import { readData as readBookings } from '@/lib/repositories/bookings';
import { getSystemSettings } from '@/lib/repositories/settings';
import { logger, createErrorResponse } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Handle GET /api/reports/cash-position
 */
export async function GET(req: NextRequest) {
    try {
        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        const { searchParams } = new URL(req.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        // Defaults to last 6 months if no dates provided
        const end = endDateParam ? new Date(endDateParam) : new Date();
        const start = startDateParam ? new Date(startDateParam) : new Date(new Date().setMonth(end.getMonth() - 5));
        start.setDate(1); // Start from beginning of the month

        const settings = getSystemSettings();
        const initialCashBalance = settings.initial_cash_balance || 0;

        // Fetch data
        const allBookings = readBookings();
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

        // 1. Process Payments (Cash In)
        allBookings.forEach(booking => {
            booking.finance.payments.forEach(payment => {
                const pDate = new Date(payment.date);
                const key = pDate.toISOString().substring(0, 7);
                // We only care about payments within the specified range for the chart, 
                // but we need to calculate running balance from the very beginning of the system or at least prior months
                if (monthlyData[key]) {
                    monthlyData[key].cashIn += payment.amount;
                }
            });
        });

        // 2. Process Expenses (Cash Out)
        expenses.forEach(expense => {
            const eDate = new Date(expense.date);
            const key = eDate.toISOString().substring(0, 7);
            if (monthlyData[key]) {
                monthlyData[key].cashOut += expense.amount;
            }
        });

        // 3. Calculate Running Balance
        // For total current position, we need sum of ALL payments and ALL expenses since beginning + initial balance
        let totalCashIn = 0;
        let totalCashOut = 0;

        allBookings.forEach(b => {
            b.finance.payments.forEach(p => totalCashIn += p.amount);
        });
        expenses.forEach(e => totalCashOut += e.amount);

        const currentPosition = initialCashBalance + totalCashIn - totalCashOut;

        // Prepare monthly breakdown with running balance
        // Note: For a true running balance, we'd need to sum everything PRIOR to the 'start' date first.
        let priorCashIn = 0;
        let priorCashOut = 0;

        allBookings.forEach(booking => {
            booking.finance.payments.forEach(payment => {
                if (new Date(payment.date) < start) {
                    priorCashIn += payment.amount;
                }
            });
        });
        expenses.forEach(expense => {
            if (new Date(expense.date) < start) {
                priorCashOut += expense.amount;
            }
        });

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

        return NextResponse.json({
            currentPosition,
            initialBalance: initialCashBalance,
            period: {
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0]
            },
            summary: periodSummary,
            monthlyBreakdown: breakdown
        });

    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        logger.error('Error generating cash position report', {}, error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
