import React, { useState } from 'react';
import { X, DollarSign, CreditCard, AlertCircle } from 'lucide-react';

export interface FinanceReportData {
    summary: {
        byCategory: Array<{
            category: string;
            totalBookings: number;
            totalRevenue: number;
            totalPaid: number;
            outstandingBalance: number;
            collectionRate: number;
        }>;
        totals: {
            totalBookings: number;
            totalRevenue: number;
            totalPaid: number;
            totalOutstanding: number;
            collectionRate: number;
        };
    };
    details: Array<{
        bookingId: string;
        customerName: string;
        category: string;
        bookingDate: string;
        paymentIndex: number;
        paymentDate: string;
        amount: number;
        note: string;
        totalPrice: number;
        remainingBalance: number;
    }>;
    outstanding: Array<{
        customerName: string;
        whatsapp: string;
        category: string;
        sessionDate: string;
        totalPrice: number;
        paid: number;
        outstanding: number;
        daysUntilSession: number;
        status: string;
    }>;
}

interface FinanceReportPreviewProps {
    data: FinanceReportData;
    dateRange: { start: string; end: string };
    onClose: () => void;
}

export const FinanceReportPreview: React.FC<FinanceReportPreviewProps> = ({ data, dateRange, onClose }) => {
    const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'outstanding'>('summary');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Financial Report Preview</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Period: <span className="font-medium text-slate-700">{dateRange.start}</span> - <span className="font-medium text-slate-700">{dateRange.end}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50/50 px-6">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'summary'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <DollarSign size={16} />
                        Summary
                    </button>
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'details'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <CreditCard size={16} />
                        Payment Details
                    </button>
                    <button
                        onClick={() => setActiveTab('outstanding')}
                        className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'outstanding'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <AlertCircle size={16} />
                        Outstanding ({data.outstanding.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 bg-slate-50">

                    {/* SUMMARY TAB */}
                    {activeTab === 'summary' && (
                        <div className="space-y-6">
                            {/* Overview Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Total Revenue</p>
                                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(data.summary.totals.totalRevenue)}</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Total Paid</p>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.totals.totalPaid)}</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Outstanding</p>
                                    <p className="text-2xl font-bold text-red-600">{formatCurrency(data.summary.totals.totalOutstanding)}</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Coll. Rate</p>
                                    <p className="text-2xl font-bold text-slate-900">{data.summary.totals.collectionRate.toFixed(1)}%</p>
                                </div>
                            </div>

                            {/* Summary Table */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3">Category</th>
                                            <th className="px-6 py-3 text-right">Bookings</th>
                                            <th className="px-6 py-3 text-right">Revenue</th>
                                            <th className="px-6 py-3 text-right">Paid</th>
                                            <th className="px-6 py-3 text-right">Outstanding</th>
                                            <th className="px-6 py-3 text-right">Coll. Run</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.summary.byCategory.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-3 font-medium text-slate-900">{row.category}</td>
                                                <td className="px-6 py-3 text-right text-slate-600">{row.totalBookings}</td>
                                                <td className="px-6 py-3 text-right text-slate-600">{formatCurrency(row.totalRevenue)}</td>
                                                <td className="px-6 py-3 text-right text-green-600">{formatCurrency(row.totalPaid)}</td>
                                                <td className="px-6 py-3 text-right text-red-500">{formatCurrency(row.outstandingBalance)}</td>
                                                <td className="px-6 py-3 text-right text-slate-600">{row.collectionRate.toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                                        <tr>
                                            <td className="px-6 py-3">TOTAL</td>
                                            <td className="px-6 py-3 text-right">{data.summary.totals.totalBookings}</td>
                                            <td className="px-6 py-3 text-right">{formatCurrency(data.summary.totals.totalRevenue)}</td>
                                            <td className="px-6 py-3 text-right text-green-700">{formatCurrency(data.summary.totals.totalPaid)}</td>
                                            <td className="px-6 py-3 text-right text-red-700">{formatCurrency(data.summary.totals.totalOutstanding)}</td>
                                            <td className="px-6 py-3 text-right">{data.summary.totals.collectionRate.toFixed(1)}%</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* DETAILS TAB */}
                    {activeTab === 'details' && (
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Booking ID</th>
                                        <th className="px-4 py-3">Customer</th>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Payment</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="px-4 py-3 text-right">Total Price</th>
                                        <th className="px-4 py-3 text-right">Remaining</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.details.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.bookingId}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900">{row.customerName}</td>
                                            <td className="px-4 py-3 text-slate-600">{row.category}</td>
                                            <td className="px-4 py-3 text-slate-500">{row.paymentDate}</td>
                                            <td className="px-4 py-3 text-slate-600">
                                                <div className="flex flex-col">
                                                    <span>#{row.paymentIndex}</span>
                                                    <span className="text-xs text-slate-400">{row.note}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(row.amount)}</td>
                                            <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(row.totalPrice)}</td>
                                            <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(row.remainingBalance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* OUTSTANDING TAB */}
                    {activeTab === 'outstanding' && (
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            {data.outstanding.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">
                                    <p className="text-lg font-medium">No outstanding payments!</p>
                                    <p className="text-sm mt-1">Great job collecting payments.</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3">Customer</th>
                                            <th className="px-6 py-3">Category</th>
                                            <th className="px-6 py-3">Session Date</th>
                                            <th className="px-6 py-3 text-right">Total Price</th>
                                            <th className="px-6 py-3 text-right">Paid</th>
                                            <th className="px-6 py-3 text-right">Outstanding</th>
                                            <th className="px-6 py-3 text-center">Days left</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.outstanding.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-3 font-medium text-slate-900">
                                                    <div>{row.customerName}</div>
                                                    <div className="text-xs text-slate-400">{row.whatsapp}</div>
                                                </td>
                                                <td className="px-6 py-3 text-slate-600">{row.category}</td>
                                                <td className="px-6 py-3 text-slate-600">{row.sessionDate}</td>
                                                <td className="px-6 py-3 text-right text-slate-600">{formatCurrency(row.totalPrice)}</td>
                                                <td className="px-6 py-3 text-right text-green-600">{formatCurrency(row.paid)}</td>
                                                <td className="px-6 py-3 text-right text-red-600 font-medium">{formatCurrency(row.outstanding)}</td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${row.daysUntilSession < 7
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {row.daysUntilSession} days
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
                    >
                        Close Preview
                    </button>
                </div>
            </div>
        </div>
    );
};
