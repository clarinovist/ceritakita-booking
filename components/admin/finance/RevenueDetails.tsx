import React, { useMemo, useState } from 'react';
import { FinanceSummaryData } from '../hooks/useFinanceSummary';


interface RevenueDetailsProps {
    data: FinanceSummaryData | null;
}

export const RevenueDetails: React.FC<RevenueDetailsProps> = ({ data }) => {
    const [categoryFilter, setCategoryFilter] = useState<string>('All');


    const categories = useMemo(() => {
        if (!data) return [];
        return ['All', ...Object.keys(data.revenueByCategory)];
    }, [data]);

    const filteredRevenue = useMemo(() => {
        if (!data) return {};
        if (categoryFilter === 'All') return data.revenueByCategory;
        return { [categoryFilter]: data.revenueByCategory[categoryFilter] || 0 };
    }, [data, categoryFilter]);

    if (!data) return <div className="p-4">Loading data...</div>;

    // Calculate total from filtered view
    const totalFiltered = Object.values(filteredRevenue).reduce((a, b) => a + b, 0);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Revenue Breakdown</h3>
                    <p className="text-sm text-slate-500">Revenue distribution by service category</p>
                </div>

                <div className="flex gap-2">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3 text-right">Revenue</th>
                            <th className="px-4 py-3 text-right">% of Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {Object.entries(filteredRevenue).map(([category, amount]) => {
                            const percentage = data.summary.revenue > 0
                                ? ((amount / data.summary.revenue) * 100).toFixed(1)
                                : '0.0';

                            return (
                                <tr key={category} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-700 capitalize">
                                        {category}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-800">
                                        Rp {amount.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-500">
                                        {percentage}%
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
                        <tr>
                            <td className="px-4 py-3">Total</td>
                            <td className="px-4 py-3 text-right">Rp {totalFiltered.toLocaleString('id-ID')}</td>
                            <td className="px-4 py-3 text-right">
                                {categoryFilter === 'All' ? '100.0%' : ((totalFiltered / data.summary.revenue) * 100).toFixed(1) + '%'}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {(Object.keys(filteredRevenue).length === 0) && (
                <div className="text-center py-8 text-slate-400">
                    No revenue data available for this selection.
                </div>
            )}
        </div>
    );
};
