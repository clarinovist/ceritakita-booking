import { NextRequest, NextResponse } from 'next/server';
import { readData } from '@/lib/storage-sqlite';
import { getExpenses } from '@/lib/storage-expenses';
import { requireAuth } from '@/lib/auth';
import { logger, createErrorResponse } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Get Profit & Loss data
 * GET /api/reports/pnl
 */
export async function GET(req: NextRequest) {
    // Require authentication
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    try {
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // 1. Calculate Revenue (from Bookings)
        let bookings = readData();

        // Apply date filters to bookings
        if (startDate) {
            bookings = bookings.filter(b => {
                const bDate = b.booking.date.split('T')[0] ?? '';
                return bDate >= startDate;
            });
        }

        if (endDate) {
            bookings = bookings.filter(b => {
                const bDate = b.booking.date.split('T')[0] ?? '';
                return bDate <= endDate;
            });
        }

        // Only include active/completed bookings for P&L?
        // Usually cancelled bookings might have refunds or no revenue.
        // Let's filter out 'Cancelled' unless we handle refunds explicitly (which implies negative revenue).
        // Current logic in financial report includes all bookings but summary counts them.
        // Generally P&L should only include realized revenue.
        // Let's exclude 'Cancelled' for revenue calculation to be safe, or include them if they have payments?
        // The financial report sums total_price. If a booking is cancelled, total_price might still be there but not valid revenue.
        // Let's exclude 'Cancelled'.
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
        // getExpenses handles date filtering
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

        return NextResponse.json({
            period: {
                start: startDate,
                end: endDate
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
        });

    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        logger.error('Error generating P&L report', {}, error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
