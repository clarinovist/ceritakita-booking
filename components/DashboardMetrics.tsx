'use client';

import { Booking } from "@/lib/storage";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, Users, CalendarX, CheckCircle } from 'lucide-react';

interface Props {
    sessionBookings: Booking[];
    createdBookings: Booking[];
    dateRange: { start: string; end: string };
}

export default function DashboardMetrics({ sessionBookings, createdBookings, dateRange }: Props) {

    // History modal state kept temporarily if needed for other history, otherwise remove if ads specific. 
    // Wait, the history modal IS ads specific. Removing it too.

    // Metrics calculations
    const pipelineTotalBookings = createdBookings.length;
    const pipelineRevenue = createdBookings.filter(b => b.status !== 'Cancelled').reduce((sum, b) => sum + (b.finance.total_price || 0), 0);
    const pipelineCancelled = createdBookings.filter(b => b.status === 'Cancelled').length;

    const completedSessions = sessionBookings.filter(b => b.status === 'Completed');
    const sessionsCompleted = completedSessions.length;
    const sessionsTotal = sessionBookings.length;
    const sessionsCancelled = sessionBookings.filter(b => b.status === 'Cancelled' || b.status === 'Rescheduled').length;

    const realizedRevenue = completedSessions.reduce((sum, b) => sum + (b.finance.total_price || 0), 0);

    const actualCashReceived = completedSessions.reduce((sum, b) => {
        const totalPaid = b.finance.payments.reduce((paidSum, payment) => paidSum + payment.amount, 0);
        return sum + totalPaid;
    }, 0);

    const outstandingBalance = realizedRevenue - actualCashReceived;

    const categories = [
        'Wedding', 'Prewedding Bronze', 'Prewedding Gold', 'Prewedding Silver',
        'Wisuda', 'Family', 'Birthday', 'Pas Foto', 'Self Photo', 'Indoor', 'Outdoor'
    ];

    const chartData = categories.map(cat => ({
        name: cat,
        count: sessionBookings.filter(b => b.customer.category === cat).length
    })).filter(d => d.count > 0);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6699'];

    return (
        <div className="space-y-8">
            {/* ========== SALES PIPELINE SECTION ========== */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sales Pipeline</h3>
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-xs text-gray-400">
                        Created in range
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">New Bookings</p>
                            <p className="text-2xl font-bold">{pipelineTotalBookings}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-full">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pipeline Revenue</p>
                            <p className="text-2xl font-bold">Rp {pipelineRevenue.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">Future revenue potential</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-full">
                            <CalendarX size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Cancelled</p>
                            <p className="text-2xl font-bold">{pipelineCancelled}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== REVENUE REALIZATION SECTION ========== */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 pt-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Revenue Realization</h3>
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-xs text-gray-400">
                        Sessions in range
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Completed</p>
                            <p className="text-2xl font-bold">{sessionsCompleted}</p>
                            <p className="text-xs text-gray-400">of {sessionsTotal} sessions</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl shadow-lg border-2 border-teal-300 flex items-center gap-4">
                        <div className="p-3 bg-teal-600 text-white rounded-full shadow-md">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm text-teal-900 font-bold">Cash Received</p>
                                <span className="text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full">ROI Metric</span>
                            </div>
                            <p className="text-2xl font-black text-teal-700">Rp {actualCashReceived.toLocaleString()}</p>
                            <p className="text-xs text-teal-600 font-semibold">Real money in</p>
                        </div>
                    </div>

                    {outstandingBalance > 0 && (
                        <div className="bg-white p-6 rounded-xl shadow border border-orange-200 flex items-center gap-4">
                            <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-orange-700 font-semibold">Outstanding</p>
                                <p className="text-2xl font-bold text-orange-600">Rp {outstandingBalance.toLocaleString()}</p>
                                <p className="text-xs text-orange-500">Receivables / Piutang</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-gray-100 text-gray-600 rounded-full">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-2xl font-bold">{sessionsTotal - sessionsCompleted - sessionsCancelled}</p>
                            <p className="text-xs text-gray-400">Active/Rescheduled</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-gray-700">Services Distribution</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" fontSize={12} tickMargin={10} />
                            <YAxis allowDecimals={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}