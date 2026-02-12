'use client';

import React, { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, Wallet, Calendar,
    Download, Loader2, Info
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CashPositionData {
    currentPosition: number;
    initialBalance: number;
    period: { start: string; end: string };
    summary: {
        totalCashIn: number;
        totalCashOut: number;
        netCashFlow: number;
    };
    monthlyBreakdown: Array<{
        month: string;
        cashIn: number;
        cashOut: number;
        netFlow: number;
        runningBalance: number;
    }>;
}

interface CashPositionReportProps {
    dateRange: { start: string; end: string };
    onClose: () => void;
}

export const CashPositionReport: React.FC<CashPositionReportProps> = ({ dateRange, onClose }) => {
    const [data, setData] = useState<CashPositionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    startDate: dateRange.start,
                    endDate: dateRange.end
                });
                const res = await fetch(`/api/reports/cash-position?${params.toString()}`);
                if (!res.ok) throw new Error('Failed to fetch cash position data');
                const result = await res.json();
                setData(result);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [dateRange]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleExportPDF = () => {
        if (!data) return;
        setExporting(true);

        try {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(22);
            doc.setTextColor(15, 23, 42);
            doc.text('Monthly Cash Position Report', 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(`Period: ${data.period.start} to ${data.period.end}`, 14, 28);
            doc.text(`Initial Balance: ${formatCurrency(data.initialBalance)}`, 14, 34);
            doc.text(`Generated on: ${new Date().toLocaleString('id-ID')}`, 14, 40);

            // Current Position Box
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, 50, 180, 25, 2, 2, 'F');
            doc.setFontSize(12);
            doc.setTextColor(71, 85, 105);
            doc.text('Current Cash Position', 20, 60);
            doc.setFontSize(18);
            doc.setTextColor(15, 23, 42);
            doc.text(formatCurrency(data.currentPosition), 20, 70);

            // Table
            const tableData = data.monthlyBreakdown.map(m => [
                m.month,
                formatCurrency(m.cashIn),
                formatCurrency(m.cashOut),
                formatCurrency(m.netFlow),
                formatCurrency(m.runningBalance)
            ]);

            autoTable(doc, {
                startY: 85,
                head: [['Month', 'Cash In', 'Cash Out', 'Net Flow', 'Balance']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [15, 23, 42] },
                foot: [['TOTAL', formatCurrency(data.summary.totalCashIn), formatCurrency(data.summary.totalCashOut), formatCurrency(data.summary.netCashFlow), '']],
                footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' }
            });

            doc.save(`Cash_Position_Report_${data.period.start}_${data.period.end}.pdf`);
        } catch (err) {
            console.error(err);
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center">
                    <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                    <p className="text-slate-600 font-medium">Generating Report...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-50 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Monthly Cash Position</h2>
                        <p className="text-sm text-slate-500">Real-time liquidity and cash flow tracking</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportPDF}
                            disabled={exporting}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            Export PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 text-slate-500 mb-2">
                                <Info size={16} />
                                <span className="text-xs font-semibold uppercase tracking-wider">Starting Balance</span>
                            </div>
                            <div className="text-xl font-bold text-slate-900">{formatCurrency(data.initialBalance)}</div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 text-green-600 mb-2">
                                <TrendingUp size={16} />
                                <span className="text-xs font-semibold uppercase tracking-wider">Total Cash In</span>
                            </div>
                            <div className="text-xl font-bold text-slate-900">{formatCurrency(data.summary.totalCashIn)}</div>
                            <div className="text-[10px] text-slate-400 mt-1">Payments received in period</div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 text-red-600 mb-2">
                                <TrendingDown size={16} />
                                <span className="text-xs font-semibold uppercase tracking-wider">Total Cash Out</span>
                            </div>
                            <div className="text-xl font-bold text-slate-900">{formatCurrency(data.summary.totalCashOut)}</div>
                            <div className="text-[10px] text-slate-400 mt-1">Expenses paid in period</div>
                        </div>

                        <div className="bg-blue-600 p-5 rounded-xl border border-blue-700 shadow-lg text-white">
                            <div className="flex items-center gap-3 opacity-80 mb-2">
                                <Wallet size={16} />
                                <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">Current Position</span>
                            </div>
                            <div className="text-2xl font-bold">{formatCurrency(data.currentPosition)}</div>
                            <div className="text-[10px] text-blue-200 mt-1 italic">Total available cash liquidity</div>
                        </div>
                    </div>

                    {/* Chart & Table */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Trend Chart */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Calendar size={16} className="text-blue-500" />
                                6-Month Liquidity Trend
                            </h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.monthlyBreakdown}>
                                        <defs>
                                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fontSize: 10 }}
                                            tickFormatter={(val) => {
                                                const [y, m] = val.split('-');
                                                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
                                            }}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10 }}
                                            tickFormatter={(val) => `Rp${val / 1000000}M`}
                                        />
                                        <Tooltip
                                            formatter={(value: any) => [formatCurrency(value as number), 'Balance']}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="runningBalance"
                                            stroke="#3B82F6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorBalance)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Summary Details */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 mb-6">Cash Flow Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span className="text-sm text-slate-500">Net Cash Flow</span>
                                    <span className={`text-sm font-bold ${data.summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {data.summary.netCashFlow >= 0 ? '+' : ''}{formatCurrency(data.summary.netCashFlow)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span className="text-sm text-slate-500">Starting Balance</span>
                                    <span className="text-sm font-medium text-slate-700">{formatCurrency(data.initialBalance)}</span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg mt-4">
                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Calculation Advice</div>
                                    <p className="text-xs text-slate-600 leading-relaxed italic">
                                        &quot;Posisi kas dihitung berdasarkan cash basis (uang masuk - uang keluar). Pastikan semua payment dan expense sudah terinput dengan benar.&quot;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-700">Month</th>
                                    <th className="px-6 py-4 font-bold text-green-600">Cash In</th>
                                    <th className="px-6 py-4 font-bold text-red-600">Cash Out</th>
                                    <th className="px-6 py-4 font-bold text-slate-700">Net Flow</th>
                                    <th className="px-6 py-4 font-bold text-blue-600 text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.monthlyBreakdown.map((row) => (
                                    <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{row.month}</td>
                                        <td className="px-6 py-4 text-green-600">{formatCurrency(row.cashIn)}</td>
                                        <td className="px-6 py-4 text-red-600">{formatCurrency(row.cashOut)}</td>
                                        <td className={`px-6 py-4 font-medium ${row.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(row.netFlow)}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900 text-right">{formatCurrency(row.runningBalance)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
