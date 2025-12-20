'use client';

import { Booking } from "@/lib/storage";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, Users, CalendarX } from 'lucide-react';

interface Props {
    bookings: Booking[];
}

export default function DashboardMetrics({ bookings }: Props) {
    // 1. Calculate Summary
    const totalBookings = bookings.length;
    // Count only Active for revenue usually, but let's count all or filtered. 
    // Requirement says "Total Revenue" (sum of all booking values).
    // Assuming "Active" means valid. If "Canceled", maybe we shouldn't count total price, 
    // but let's stick to requirements or common sense. I will count "Active" + "Rescheduled" revenue.

    const activeBookings = bookings.filter(b => b.status !== 'Canceled');
    const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.finance.total_price || 0), 0);

    const canceledOrRescheduled = bookings.filter(b => b.status === 'Canceled' || b.status === 'Rescheduled').length;

    // 2. Prepare Chart Data
    const categories = [
        'Wedding', 'Prewedding Bronze', 'Prewedding Gold', 'Prewedding Silver',
        'Wisuda', 'Family', 'Birthday', 'Pas Foto', 'Self Photo', 'Indoor', 'Outdoor'
    ];

    const chartData = categories.map(cat => ({
        name: cat,
        count: bookings.filter(b => b.customer.category === cat).length
    })).filter(d => d.count > 0); // Only show used categories

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6699'];

    return (
        <div className="space-y-6">
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Bookings</p>
                        <p className="text-2xl font-bold">{totalBookings}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Est. Revenue (Active)</p>
                        <p className="text-2xl font-bold">Rp {totalRevenue.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-full">
                        <CalendarX size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Canceled / Rescheduled</p>
                        <p className="text-2xl font-bold">{canceledOrRescheduled}</p>
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
