import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getExpenses } from '@/lib/storage-expenses';
import { readData as readBookings } from '@/lib/storage-sqlite';
import { createErrorResponse } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
    try {
        const rateLimitResult = rateLimiters.moderate(req);
        if (rateLimitResult) return rateLimitResult;

        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;

        // 1. Get Expenses
        const expenses = getExpenses(startDate, endDate);
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        // 2. Get Revenue (from Bookings)
        // Filter bookings by date (Completed bookings? Or Active? Usually revenue is counted when paid or when service delivered)
        // For now, let's count TOTAL REVENUE from payments actually made in that period?
        // Or just total price of bookings in that period?
        // Let's use payments for cash flow accuracy.

        const bookings = readBookings();
        let totalRevenue = 0;
        let outstandingRevenue = 0;

        // Filter logic
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date(8640000000000000);

        // Ensure we handle date filtering correctly
        // If filtering by payment date, we iterate payments.
        // If filtering by booking date, we iterate bookings.
        // Summary usually implies "In this period, what happened?"

        // Revenue logic: Sum of payments made within the date range
        bookings.forEach(booking => {
            // Skip cancelled bookings for revenue check?
            // If they paid, it's revenue until refunded.
            // Assuming non-refunded payments are revenue.

            booking.finance.payments.forEach(payment => {
                const paymentDate = new Date(payment.date);
                if (paymentDate >= start && paymentDate <= end) {
                    totalRevenue += payment.amount;
                }
            });

            // Outstanding calculation
            // Only for active/rescheduled bookings in the period?
            // Or all time outstanding?
            // Usually, dashboard shows CURRENT outstanding.
            if (booking.status === 'Active' || booking.status === 'Rescheduled') {
                const paid = booking.finance.payments.reduce((s, p) => s + p.amount, 0);
                const remaining = booking.finance.total_price - paid;
                if (remaining > 0) {
                    outstandingRevenue += remaining;
                }
            }
        });

        const netProfit = totalRevenue - totalExpenses;

        // 3. Category Breakdown (Revenue)
        const revenueByCategory: Record<string, number> = {};
        bookings.forEach(booking => {
            const bookingDate = new Date(booking.booking.date);
            // Attribute revenue to booking date or payment date?
            // For "Revenue by Category", usually it's based on sales (booking date).
            if (bookingDate >= start && bookingDate <= end && booking.status !== 'Cancelled') {
                const cat = booking.customer.category || 'Uncategorized';
                revenueByCategory[cat] = (revenueByCategory[cat] || 0) + booking.finance.total_price;
            }
        });

        // 4. Monthly Trends (Last 6 months or selected range)
        // Prepare daily or monthly data series

        return NextResponse.json({
            period: { startDate, endDate },
            summary: {
                revenue: totalRevenue,
                expenses: totalExpenses,
                profit: netProfit,
                outstanding: outstandingRevenue
            },
            revenueByCategory,
            expenseDetails: expenses // Return expenses for list view if needed, or separate call
        });

    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
