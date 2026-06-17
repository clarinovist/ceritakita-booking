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

        let totalCashIn = 0;
        let totalCashOut = 0;
        let priorCashIn = 0;
        let priorCashOut = 0;

        // Single Pass for Bookings
        for (let i = 0; i < allBookings.length; i++) {
            const payments = allBookings[i].finance.payments;
            for (let j = 0; j < payments.length; j++) {
                const payment = payments[j];
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
