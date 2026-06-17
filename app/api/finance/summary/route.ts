import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getExpenses } from '@/lib/storage-expenses';
import { readData as readBookings } from '@/lib/storage-sqlite';
import { getFreelancerJobs } from '@/lib/services/freelancer-service';
import { createErrorResponse } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

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
        const manualExpenses = getExpenses(startDate, endDate);
        
        // 1.b Get Freelancer Fees (treated as expenses)
        const freelancerJobs = getFreelancerJobs(startDate, endDate);

        // Map freelancer jobs to virtual expense objects for the frontend
        const virtualExpensesFromFreelancers = freelancerJobs.map(job => ({
            id: `fj-${job.id}`,
            date: job.work_date,
            category: 'salary' as const, // Map to existing 'salary' category
            description: `Freelance Fee: ${job.freelancer_name} (${job.role_name})${job.booking_customer_name ? ` - ${job.booking_customer_name}` : ''}`,
            amount: job.fee,
            created_by: job.created_by || 'system',
            created_at: job.created_at || new Date().toISOString(),
            updated_at: job.updated_at || new Date().toISOString()
        }));

        const expenses = [...manualExpenses, ...virtualExpensesFromFreelancers];
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        // 2. Get Revenue (from Bookings)
        // Filter bookings by date (Completed bookings? Or Active? Usually revenue is counted when paid or when service delivered)
        // For now, let's count TOTAL REVENUE from payments actually made in that period?
        // Or just total price of bookings in that period?
        // Let's use payments for cash flow accuracy.

        const bookings = readBookings(startDate, endDate);
        let totalRevenue = 0;
        let outstandingRevenue = 0;

        // Filter logic
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date(8640000000000000);

        // Ensure we handle date filtering correctly
        // Summary usually implies "In this period, what happened?"
        // Bookings are already filtered by booking_date via readBookings(startDate, endDate)

        // Revenue logic: Sum of payments made within the date range
        bookings.forEach(booking => {
            // Skip cancelled bookings for revenue check?
            // If they paid, it's revenue until refunded.
            // Assuming non-refunded payments are revenue.

            booking.finance.payments.forEach(payment => {
                const paymentDate = new Date(payment.date);
                // We still check payment date because payments can happen outside the booking date range,
                // but since bookings are already restricted to the start/end date range, this means
                // we are ONLY calculating revenue for bookings CREATED in this period, and only counting
                // payments that also occurred in this period.
                if (paymentDate >= start && paymentDate <= end) {
                    totalRevenue += payment.amount;
                }
            });

            // Outstanding calculation
            // Dashboard shows CURRENT outstanding for all non-cancelled bookings.
            if (booking.status !== 'Cancelled') {
                const paid = (booking.finance.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
                const remaining = Math.max(0, booking.finance.total_price - paid);
                outstandingRevenue += remaining;
            }
        });

        const netProfit = totalRevenue - totalExpenses;

        // 3. Category Breakdown (Revenue)
        const revenueByCategory: Record<string, number> = {};
        bookings.forEach(booking => {
            // Attribute revenue to booking date or payment date?
            // For "Revenue by Category", usually it's based on sales (booking date).
            // Bookings are already filtered by date from DB.
            if (booking.status !== 'Cancelled') {
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
