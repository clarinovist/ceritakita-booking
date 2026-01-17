import React from 'react';
import { FinanceSummaryData } from '../hooks/useFinanceSummary';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { Wallet, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface FinanceDashboardProps {
    data: FinanceSummaryData | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ data }) => {
    if (!data) return <div className="p-8 text-center text-slate-500">Loading dashboard data...</div>;

    const { summary, revenueByCategory } = data;

    // Prepare chart data
    const pieData = Object.entries(revenueByCategory).map(([name, value]) => ({ name, value }));
    const profitMargin = summary.revenue > 0 ? ((summary.profit / summary.revenue) * 100).toFixed(1) : '0';

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-100 rounded-lg text-green-600">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            +Revenue
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                        Rp {summary.revenue.toLocaleString('id-ID')}
                    </h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-100 rounded-lg text-red-600">
                            <TrendingDown size={24} />
                        </div>
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                            -Expenses
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Total Expenses</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                        Rp {summary.expenses.toLocaleString('id-ID')}
                    </h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                            <Wallet size={24} />
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${summary.profit >= 0 ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50'}`}>
                            {profitMargin}% Margin
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Net Profit</p>
                    <h3 className={`text-2xl font-bold mt-1 ${summary.profit >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                        Rp {summary.profit.toLocaleString('id-ID')}
                    </h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                            <AlertCircle size={24} />
                        </div>
                        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                            Unpaid
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Outstanding</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                        Rp {summary.outstanding.toLocaleString('id-ID')}
                    </h3>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Breakdown */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue by Category</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number | undefined) => `Rp ${(value || 0).toLocaleString('id-ID')}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Income vs Expenses (Simple Bar) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Income vs Expenses</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={[
                                    { name: 'Income', amount: summary.revenue },
                                    { name: 'Expenses', amount: summary.expenses },
                                    { name: 'Profit', amount: summary.profit }
                                ]}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(val) => `Rp${val / 1000000}M`} />
                                <Tooltip formatter={(value: number | undefined) => `Rp ${(value || 0).toLocaleString('id-ID')}`} />
                                <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                                    {
                                        [
                                            { name: 'Income', fill: '#10B981' }, // Green
                                            { name: 'Expenses', fill: '#EF4444' }, // Red
                                            { name: 'Profit', fill: '#3B82F6' } // Blue
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
