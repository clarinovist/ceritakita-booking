'use client';

import { useMemo } from 'react';
import { Booking } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, Users, CalendarX, CheckCircle, TrendingUp, TrendingDown, Clock, Wallet } from 'lucide-react';

interface Props {
    sessionBookings: Booking[];
    createdBookings: Booking[];
    allBookings: Booking[];
    dateRange: { start: string; end: string };
}

// Date helpers
const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year!, month! - 1, day!);
};

const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const subtractMonth = (d: Date) => {
    const newDate = new Date(d);
    newDate.setMonth(d.getMonth() - 1);
    // Handle month overflow (e.g., March 31 -> Feb 28/29)
    if (d.getDate() !== newDate.getDate()) {
        newDate.setDate(0);
    }
    return newDate;
};

const getPreviousDateRange = (start: string, end: string) => {
    const startDate = parseLocalDate(start);
    const endDate = parseLocalDate(end);

    return {
        start: formatDate(subtractMonth(startDate)),
        end: formatDate(subtractMonth(endDate))
    };
};

const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) {
        if (current === 0) return { percent: 0, isPositive: true };
        return { percent: 100, isPositive: true };
    }
    const change = current - previous;
    const percent = Math.round((change / previous) * 100);
    return {
        percent: Math.abs(percent),
        isPositive: change >= 0
    };
};

export default function DashboardMetrics({ sessionBookings, createdBookings, allBookings, dateRange }: Props) {

    // Calculate previous period metrics for trends
    const prevDateRange = useMemo(() => getPreviousDateRange(dateRange.start, dateRange.end), [dateRange.start, dateRange.end]);

    const prevSessionBookings = useMemo(() => {
        return allBookings.filter(b => {
            const sessionDate = new Date(b.booking.date).toISOString().split('T')[0];
            return sessionDate && sessionDate >= prevDateRange.start && sessionDate <= prevDateRange.end;
        });
    }, [allBookings, prevDateRange]);

    const prevSessionsTotal = prevSessionBookings.length;
    const prevSessionRevenue = prevSessionBookings
        .filter(b => b.status !== 'Cancelled')
        .reduce((sum, b) => sum + (b.finance.total_price || 0), 0);

    // Metrics calculations
    const pipelineTotalBookings = createdBookings.length;
    // Sales Value (New Orders Value)
    // const salesValue = createdBookings.filter(b => b.status !== 'Cancelled').reduce((sum, b) => sum + (b.finance.total_price || 0), 0);
    const pipelineCancelled = createdBookings.filter(b => b.status === 'Cancelled').length;

    // Session Revenue (Operational Value - "Omzet Potensial")
    const sessionRevenue = sessionBookings.filter(b => b.status !== 'Cancelled').reduce((sum, b) => sum + (b.finance.total_price || 0), 0);

    // Calculate trends
    const bookingsTrend = calculateTrend(sessionBookings.length, prevSessionsTotal);
    const revenueTrend = calculateTrend(sessionRevenue, prevSessionRevenue);

    const completedSessions = sessionBookings.filter(b => b.status === 'Completed');
    const sessionsCompleted = completedSessions.length;
    const sessionsTotal = sessionBookings.length;
    const sessionsCancelled = sessionBookings.filter(b => b.status === 'Cancelled' || b.status === 'Rescheduled').length;

    // Calculate actual cash received based on PAYMENT DATE
    // We iterate through ALL bookings and check if any payment falls within the selected date range
    const actualCashReceived = allBookings.reduce((total, booking) => {
        const payments = booking.finance.payments || [];
        const paymentsInPeriod = payments.filter(p => {
            if (!p.date) return false;
            const paymentDate = p.date.split('T')[0]; // Ensure local date comparison
            return paymentDate && paymentDate >= dateRange.start && paymentDate <= dateRange.end;
        });

        const bookingTotal = paymentsInPeriod.reduce((sum, p) => sum + (p.amount || 0), 0);
        return total + bookingTotal;
    }, 0);

    // Calculate outstanding balance for REALIZED REVENUE only
    // This tracks how much of the completed sessions' value hasn't been paid yet
    // FIX: Calculate per booking to avoid negative outstanding (overpayments) reducing the total debt
    const outstandingBalance = completedSessions.reduce((total, b) => {
        const bookingTotal = b.finance.total_price || 0;
        const bookingPaid = b.finance.payments.reduce((sum, p) => sum + p.amount, 0);
        const bookingOutstanding = Math.max(0, bookingTotal - bookingPaid);
        return total + bookingOutstanding;
    }, 0);

    const categories = [
        'Wedding', 'Prewedding Bronze', 'Prewedding Gold', 'Prewedding Silver',
        'Wisuda', 'Family', 'Birthday', 'Pas Foto', 'Self Photo', 'Indoor', 'Outdoor'
    ];

    const chartData = categories.map(cat => ({
        name: cat,
        count: sessionBookings.filter(b => b.customer.category === cat).length
    })).filter(d => d.count > 0);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

    // Helper for rendering trend indicator
    const renderTrend = (trend: { percent: number; isPositive: boolean }) => (
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${trend.isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trend.isPositive ? '+' : '-'}{trend.percent}%</span>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* ========== OVERVIEW CARDS ========== */}
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Metrics Overview</h3>
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-xs text-slate-400 font-medium">
                    {new Date(dateRange.start).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                    {' - '}
                    {new Date(dateRange.end).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Bookings -> New Orders */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        {renderTrend(bookingsTrend)}
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Total Bookings</p>
                        <h3 className="text-3xl font-bold text-slate-800">{sessionsTotal}</h3>
                        <p className="text-xs text-slate-400 mt-2">Scheduled sessions</p>
                    </div>
                </div>

                {/* Pipeline Revenue -> Potential Revenue (Session Based) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                            <DollarSign size={24} />
                        </div>
                        {renderTrend(revenueTrend)}
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Potential Revenue</p>
                        <h3 className="text-3xl font-bold text-slate-800">
                            {(sessionRevenue / 1000000).toFixed(1)}M
                        </h3>
                        <p className="text-xs text-slate-400 mt-2">Rp {sessionRevenue.toLocaleString()}</p>
                    </div>
                </div>

                {/* Pending Sessions */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Clock size={24} />
                        </div>
                        <div className="bg-amber-50 text-amber-600 text-xs font-medium px-2 py-0.5 rounded-full">
                            Active
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Pending Sessions</p>
                        <h3 className="text-3xl font-bold text-slate-800">
                            {sessionsTotal - sessionsCompleted - sessionsCancelled}
                        </h3>
                        <p className="text-xs text-slate-400 mt-2">Upcoming schedules</p>
                    </div>
                </div>

                {/* Completed Rate */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                            <CheckCircle size={24} />
                        </div>
                        <div className="bg-blue-50 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">
                            Rate
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Completion</p>
                        <h3 className="text-3xl font-bold text-slate-800">
                            {sessionsTotal > 0 ? Math.round((sessionsCompleted / sessionsTotal) * 100) : 0}%
                        </h3>
                        <p className="text-xs text-slate-400 mt-2">{sessionsCompleted} sessions done</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Financial Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                <Wallet className="text-blue-300" size={20} />
                            </div>
                            <h3 className="font-semibold text-lg">Cash Flow</h3>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div>
                                <p className="text-slate-400 text-sm mb-1">Total Cash Received</p>
                                <p className="text-3xl font-bold tracking-tight">Rp {actualCashReceived.toLocaleString()}</p>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-slate-400 text-sm">Outstanding</p>
                                    <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/30">
                                        Unpaid
                                    </span>
                                </div>
                                <p className="text-xl font-semibold text-orange-200">Rp {outstandingBalance.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Mini Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                            <div className="flex items-center gap-2 text-red-600 mb-2">
                                <CalendarX size={16} />
                                <span className="text-xs font-bold uppercase">Cancelled</span>
                            </div>
                            <p className="text-xl font-bold text-slate-800">{pipelineCancelled}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                            <div className="flex items-center gap-2 text-purple-600 mb-2">
                                <TrendingUp size={16} />
                                <span className="text-xs font-bold uppercase">Conversion</span>
                            </div>
                            <p className="text-xl font-bold text-slate-800">
                                {pipelineTotalBookings > 0 ? Math.round(((pipelineTotalBookings - pipelineCancelled) / pipelineTotalBookings) * 100) : 0}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg text-slate-800">Service Distribution</h3>

                    </div>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis
                                    dataKey="name"
                                    className="text-xs text-slate-400 font-medium"
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                    interval={0}
                                    tick={props => {
                                        const { x, y, payload } = props;
                                        return (
                                            <g transform={`translate(${x},${y})`}>
                                                <text x={0} y={0} dy={16} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                                                    {payload.value.split(' ')[0]}
                                                </text>
                                            </g>
                                        );
                                    }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    className="text-xs text-slate-400"
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}