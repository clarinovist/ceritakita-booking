import React from 'react';
import { Download } from 'lucide-react';
import { DateRange } from '@/lib/types';

interface FinanceReportsProps {
    dateRange: DateRange;
}

export const FinanceReports: React.FC<FinanceReportsProps> = ({ dateRange }) => {

    const handleExport = async (type: 'financial' | 'expenses') => {
        try {
            const params = new URLSearchParams({
                type,
                format: 'excel',
                startDate: dateRange.start,
                endDate: dateRange.end
            });

            // Assuming we have an export API or we reuse the existing export hook/logic
            // Ideally we should create a new export endpoint or update the existing one
            // allowing export of expenses specifically.
            // For now, let's trigger a download link construction if API exists.

            // Reusing existing export endpoint if possible, or new one.
            // Existing export hooks use: /api/export

            const url = `/api/export?${params.toString()}`;

            // Trigger download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_report_${dateRange.start}_${dateRange.end}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export report');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Financial Report Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                        <Download size={24} />
                    </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Financial Report</h3>
                <p className="text-slate-500 text-sm mb-6">
                    Complete breakdown of income, including booking details and payment status.
                </p>
                <button
                    onClick={() => handleExport('financial')}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors text-sm"
                >
                    Download Excel
                </button>
            </div>

            {/* Expense Report Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-red-100 rounded-lg text-red-600">
                        <Download size={24} />
                    </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Expense Report</h3>
                <p className="text-slate-500 text-sm mb-6">
                    Detailed list of all operational expenses, categorized by type and date.
                </p>
                <button
                    onClick={() => handleExport('expenses')}
                    className="w-full py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors text-sm"
                >
                    Download Excel
                </button>
            </div>

            {/* Profit/Loss Card (Placeholder for future PDF) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow opacity-75">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600">
                        <Download size={24} />
                    </div>
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium">Coming Soon</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Profit & Loss</h3>
                <p className="text-slate-500 text-sm mb-6">
                    Monthly P&L statement summarizing total revenue, COGS, and expenses.
                </p>
                <button
                    disabled
                    className="w-full py-2.5 bg-slate-100 text-slate-400 rounded-lg font-medium cursor-not-allowed text-sm"
                >
                    Download PDF
                </button>
            </div>
        </div>
    );
};
