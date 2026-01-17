import React, { useState } from 'react';
import { Download, Eye, Loader2 } from 'lucide-react';
import { DateRange } from '@/lib/types';
import { FinanceReportPreview, FinanceReportData } from './FinanceReportPreview';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FinanceReportsProps {
    dateRange: DateRange;
}

export const FinanceReports: React.FC<FinanceReportsProps> = ({ dateRange }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<FinanceReportData | null>(null);

    const handleExport = async (type: 'financial' | 'expenses') => {
        try {
            // Fix: Point to the correct endpoint /api/export/[type]
            const endpoint = `/api/export/${type}`;

            const params = new URLSearchParams({
                type, // kept for backward compat if needed
                format: 'excel',
                startDate: dateRange.start,
                endDate: dateRange.end
            });

            const url = `${endpoint}?${params.toString()}`;

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

    const handlePreview = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                format: 'json',
                startDate: dateRange.start,
                endDate: dateRange.end
            });

            const response = await fetch(`/api/export/financial?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch report data');

            const data = await response.json();
            setPreviewData(data);
            setShowPreview(true);
        } catch (error) {
            console.error('Preview failed:', error);
            alert('Failed to load preview');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportPnL = async () => {
        setIsPdfLoading(true);
        try {
            const params = new URLSearchParams({
                startDate: dateRange.start,
                endDate: dateRange.end
            });

            const response = await fetch(`/api/reports/pnl?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch P&L data');

            const data = await response.json();

            // Generate PDF
            const doc = new jsPDF();
            const formatCurrency = (amount: number) => {
                return new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                }).format(amount);
            };

            // Header
            doc.setFontSize(20);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.text('Profit & Loss Statement', 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text(`Period: ${new Date(dateRange.start).toLocaleDateString('id-ID')} - ${new Date(dateRange.end).toLocaleDateString('id-ID')}`, 14, 32);
            doc.text(`Generated on: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 38);

            let yPos = 50;

            // Revenue Section
            doc.setFontSize(14);
            doc.setTextColor(22, 163, 74); // green-600
            doc.setFont('helvetica', 'bold');
            doc.text('Revenue', 14, yPos);
            yPos += 5;

            const revenueData = data.revenue.breakdown.map((item: any) => [
                item.category,
                formatCurrency(item.amount)
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Category', 'Amount']],
                body: revenueData,
                theme: 'striped',
                headStyles: { fillColor: [22, 163, 74] },
                foot: [['Total Revenue', formatCurrency(data.revenue.total)]],
                footStyles: { fillColor: [22, 163, 74], fontStyle: 'bold' }
            });

            yPos = (doc as any).lastAutoTable.finalY + 20;

            // Expenses Section
            doc.setFontSize(14);
            doc.setTextColor(220, 38, 38); // red-600
            doc.text('Expenses', 14, yPos);
            yPos += 5;

            const expenseData = data.expenses.breakdown.map((item: any) => [
                item.category,
                formatCurrency(item.amount)
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Category', 'Amount']],
                body: expenseData,
                theme: 'striped',
                headStyles: { fillColor: [220, 38, 38] },
                foot: [['Total Expenses', formatCurrency(data.expenses.total)]],
                footStyles: { fillColor: [220, 38, 38], fontStyle: 'bold' }
            });

            yPos = (doc as any).lastAutoTable.finalY + 20;

            // Net Profit Section
            // Draw a summary box
            doc.setFillColor(241, 245, 249); // slate-100
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.roundedRect(14, yPos, 180, 40, 3, 3, 'FD');

            doc.setFontSize(12);
            doc.setTextColor(71, 85, 105); // slate-600
            doc.setFont('helvetica', 'normal');
            doc.text('Net Profit / Loss', 24, yPos + 15);

            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');

            if (data.netProfit >= 0) {
                 doc.setTextColor(22, 163, 74); // Green
            } else {
                 doc.setTextColor(220, 38, 38); // Red
            }
            doc.text(formatCurrency(data.netProfit), 24, yPos + 30);

            doc.save(`Profit_Loss_${dateRange.start}_${dateRange.end}.pdf`);

        } catch (error) {
            console.error('P&L Export failed:', error);
            alert('Failed to export P&L report');
        } finally {
            setIsPdfLoading(false);
        }
    };

    return (
        <>
            {showPreview && previewData && (
                <FinanceReportPreview
                    data={previewData}
                    dateRange={dateRange}
                    onClose={() => setShowPreview(false)}
                />
            )}

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
                    <div className="flex gap-3">
                        <button
                            onClick={handlePreview}
                            disabled={isLoading}
                            className="flex-1 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                            Preview
                        </button>
                        <button
                            onClick={() => handleExport('financial')}
                            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <Download size={16} />
                            Download
                        </button>
                    </div>
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

                {/* Profit/Loss Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-lg text-green-600">
                            <Download size={24} />
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Profit & Loss</h3>
                    <p className="text-slate-500 text-sm mb-6">
                        Monthly P&L statement summarizing total revenue and expenses.
                    </p>
                    <button
                        onClick={handleExportPnL}
                        disabled={isPdfLoading}
                        className="w-full py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                    >
                        {isPdfLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        Download PDF
                    </button>
                </div>
            </div>
        </>
    );
};
