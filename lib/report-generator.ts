import { readData as readBookings } from '@/lib/repositories/bookings';
import { getExpenses } from '@/lib/storage-expenses';
import { getLeads } from '@/lib/leads';
import { getSystemSettings } from '@/lib/repositories/settings';
import { Booking, Payment } from '@/lib/types';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export interface DailyReportData {
    date: string;
    metrics: {
        revenueThisMonth: number;
        newBookingsThisMonthCount: number;
        newLeadsThisMonthCount: number;
    };
    newBookings: Booking[];
    paymentsReceived: Array<{ booking: Booking; payment: Payment }>;
    newLeads: any[]; // Using any for simplicity since Lead type isn't fully exported in index
    upcomingBookings: Booking[];
    overdueFollowUps: any[];
}

export interface WeeklyReportData {
    startDate: string;
    endDate: string;
    metrics: {
        revenue: number;
        revenuePrevWeek: number;
        revenueGrowth: number;
        bookingsCount: number;
        bookingsPrevWeek: number;
        leadsCount: number;
        conversionRate: number;
    };
    topServices: Array<{ name: string; count: number; revenue: number }>;
}

export interface MonthlyReportData {
    month: string;
    metrics: {
        revenue: number;
        expenses: number;
        netProfit: number;
        cashPosition: number;
    };
    revenueByCategory: Array<{ category: string; amount: number }>;
    expenseByCategory: Array<{ category: string; amount: number }>;
}

/**
 * Generates data for the Daily Digest email
 */
export async function generateDailyReport(dateInput?: Date): Promise<DailyReportData> {
    const now = dateInput || new Date();
    // If the report runs in the morning (e.g., 8 AM local or 00:00 UTC), 
    // it's almost certainly intended to recap the *previous* day's full data.
    // Otherwise, it recaps the current day's progress.
    const targetDate = now.getHours() < 12 ? subDays(now, 1) : now;
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');

    // Calculate upcoming window (next 3 days)
    const upcomingStart = new Date(targetDate);
    const upcomingEnd = new Date(targetDate);
    upcomingEnd.setDate(upcomingEnd.getDate() + 3);

    const allBookings = readBookings();
    const allLeads = await getLeads();

    // 1. New Bookings This Month
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    
    const newBookings = allBookings.filter(b => {
        const bDate = new Date(b.created_at);
        return isWithinInterval(bDate, { start: monthStart, end: monthEnd });
    });
    // Sort descending so the latest bookings appear first
    newBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // 2. Payments and Monthly Revenue
    const paymentsReceived: Array<{ booking: Booking; payment: Payment }> = [];
    let revenueThisMonth = 0;

    allBookings.forEach(booking => {
        booking.finance.payments.forEach(payment => {
            // Keep tracking today's individual payments if needed
            if (payment.date.startsWith(targetDateStr)) {
                paymentsReceived.push({ booking, payment });
            }
            
            // Accumulate monthly revenue
            const pDate = new Date(payment.date);
            if (isWithinInterval(pDate, { start: monthStart, end: monthEnd })) {
                revenueThisMonth += payment.amount;
            }
        });
    });

    // 3. New Leads This Month
    const newLeads = allLeads.filter(l => {
        const lDate = new Date(l.created_at);
        return isWithinInterval(lDate, { start: monthStart, end: monthEnd });
    });

    // 4. Upcoming Bookings (Next 3 days)
    const upcomingBookings = allBookings.filter(b => {
        if (b.status === 'Cancelled') return false;

        // Ensure we parse booking.date correctly (might be YYYY-MM-DD)
        // If it lacks time, appending T00:00:00 ensures local parsing in most environments,
        // but simple string comparison might be safer if format is consistent.
        const bDate = new Date(b.booking.date);
        return isWithinInterval(bDate, { start: upcomingStart, end: upcomingEnd });
    }).sort((a, b) => new Date(a.booking.date).getTime() - new Date(b.booking.date).getTime());

    // 5. Overdue Follow-ups
    const overdueFollowUps = allLeads.filter(l => {
        // Exclude closed leads
        if (['Won', 'Lost', 'Converted'].includes(l.status as string)) return false;

        if (!l.next_follow_up) return false;
        const followUpDate = new Date(l.next_follow_up);
        return followUpDate < targetDate;
    }).sort((a, b) => {
        const dateA = new Date(a.next_follow_up as string).getTime();
        const dateB = new Date(b.next_follow_up as string).getTime();
        return dateA - dateB; // Oldest first
    });

    return {
        date: targetDateStr,
        metrics: {
            revenueThisMonth,
            newBookingsThisMonthCount: newBookings.length,
            newLeadsThisMonthCount: newLeads.length
        },
        newBookings,
        paymentsReceived,
        newLeads,
        upcomingBookings,
        overdueFollowUps
    };
}

/**
 * Generates data for the Weekly Summary email
 */
export async function generateWeeklyReport(): Promise<WeeklyReportData> {
    const today = new Date();
    // Assuming week starts on Monday (1)
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const prevWeekStart = startOfWeek(subDays(currentWeekStart, 1), { weekStartsOn: 1 });
    const prevWeekEnd = endOfWeek(subDays(currentWeekStart, 1), { weekStartsOn: 1 });

    const allBookings = readBookings();
    const allLeads = await getLeads();

    // Helper to get revenue for a date range
    const getRevenue = (start: Date, end: Date) => {
        let revenue = 0;
        allBookings.forEach(b => {
            b.finance.payments.forEach(p => {
                const pDate = new Date(p.date);
                if (isWithinInterval(pDate, { start, end })) {
                    revenue += p.amount;
                }
            });
        });
        return revenue;
    };

    // Helper to get booking count created in a range
    const getBookingsCount = (start: Date, end: Date) => {
        return allBookings.filter(b => {
            const bDate = new Date(b.created_at);
            return isWithinInterval(bDate, { start, end });
        }).length;
    };

    const revenue = getRevenue(currentWeekStart, currentWeekEnd);
    const revenuePrevWeek = getRevenue(prevWeekStart, prevWeekEnd);

    // Calculate growth percentage
    let revenueGrowth = 0;
    if (revenuePrevWeek > 0) {
        revenueGrowth = ((revenue - revenuePrevWeek) / revenuePrevWeek) * 100;
    } else if (revenue > 0) {
        revenueGrowth = 100; // From 0 to something
    }

    const bookingsCount = getBookingsCount(currentWeekStart, currentWeekEnd);
    const bookingsPrevWeek = getBookingsCount(prevWeekStart, prevWeekEnd);

    // Leads logic for current week
    const currentWeekLeads = allLeads.filter(l => {
        const lDate = new Date(l.created_at);
        return isWithinInterval(lDate, { start: currentWeekStart, end: currentWeekEnd });
    });

    const leadsCount = currentWeekLeads.length;

    // Check conversions (leads created this week that are now converted)
    const convertedLeads = currentWeekLeads.filter(l => ['Won', 'Converted'].includes(l.status as string)).length;
    const conversionRate = leadsCount > 0 ? (convertedLeads / leadsCount) * 100 : 0;

    // Top Services this week
    const serviceStats = new Map<string, { count: number; revenue: number }>();
    allBookings.filter(b => {
        const bDate = new Date(b.created_at);
        return isWithinInterval(bDate, { start: currentWeekStart, end: currentWeekEnd }) && b.status !== 'Cancelled';
    }).forEach(b => {
        const cat = b.customer.category || 'Uncategorized';
        const current = serviceStats.get(cat) || { count: 0, revenue: 0 };

        serviceStats.set(cat, {
            count: current.count + 1,
            revenue: current.revenue + b.finance.total_price
        });
    });

    const topServices = Array.from(serviceStats.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    return {
        startDate: format(currentWeekStart, 'yyyy-MM-dd'),
        endDate: format(currentWeekEnd, 'yyyy-MM-dd'),
        metrics: {
            revenue,
            revenuePrevWeek,
            revenueGrowth,
            bookingsCount,
            bookingsPrevWeek,
            leadsCount,
            conversionRate
        },
        topServices
    };
}

/**
 * Generates data for the Monthly P&L email
 */
export async function generateMonthlyReport(): Promise<MonthlyReportData> {
    const today = new Date();
    // Usually run on 1st of the month for the *previous* month
    // So if today is May 1st, we want April's data. 
    // If we run mid-month, it generates current month-to-date.

    const targetMonthDate = today.getDate() === 1 ? subDays(today, 1) : today;
    const monthStart = startOfMonth(targetMonthDate);
    const monthEnd = endOfMonth(targetMonthDate);

    const allBookings = readBookings();
    const allExpenses = getExpenses();
    const settings = getSystemSettings();

    // 1. Revenue
    let revenue = 0;
    const revenueByCategoryMap = new Map<string, number>();

    allBookings.forEach(b => {
        if (b.status === 'Cancelled') return;

        // Sum total price of bookings made in this month OR
        // Should it be cash-based (payments received this month)? P&L is usually accrual or cash.
        // Let's use the same logic as the P&L API which looks at booking total_price within date range.
        // Actually, the P&L API uses the booking creation date (passed as startDate/endDate to readData).

        const bDate = new Date(b.created_at);
        if (isWithinInterval(bDate, { start: monthStart, end: monthEnd })) {
            const amount = b.finance.total_price;
            revenue += amount;

            const cat = b.customer.category || 'Uncategorized';
            revenueByCategoryMap.set(cat, (revenueByCategoryMap.get(cat) || 0) + amount);
        }
    });

    // 2. Expenses
    let expenses = 0;
    const expenseByCategoryMap = new Map<string, number>();

    allExpenses.forEach(e => {
        const eDate = new Date(e.date);
        if (isWithinInterval(eDate, { start: monthStart, end: monthEnd })) {
            expenses += e.amount;
            const cat = e.category || 'Other';
            expenseByCategoryMap.set(cat, (expenseByCategoryMap.get(cat) || 0) + e.amount);
        }
    });

    const netProfit = revenue - expenses;

    // 3. Overall Cash Position (All Time)
    let totalCashIn = 0;
    let totalCashOut = 0;

    allBookings.forEach(b => {
        b.finance.payments.forEach(p => totalCashIn += p.amount);
    });
    allExpenses.forEach(e => totalCashOut += e.amount);

    const initialCashBalance = settings.initial_cash_balance || 0;
    const cashPosition = initialCashBalance + totalCashIn - totalCashOut;

    // Formatting breakdowns
    const revenueByCategory = Array.from(revenueByCategoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

    const expenseByCategory = Array.from(expenseByCategoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

    return {
        month: format(targetMonthDate, 'MMMM yyyy'),
        metrics: {
            revenue,
            expenses,
            netProfit,
            cashPosition
        },
        revenueByCategory,
        expenseByCategory
    };
}
