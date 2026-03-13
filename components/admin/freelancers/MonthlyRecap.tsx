import React, { useState, useEffect, useMemo } from 'react';
import { useFreelancers } from '../hooks/useFreelancers';
import { Download, ChevronLeft, ChevronRight, Calculator } from 'lucide-react';

export const MonthlyRecap = () => {
    const { fetchRecap, recap, loading } = useFreelancers();
    
    // Default to current month/year
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState((today.getMonth() + 1).toString().padStart(2, '0'));
    const [selectedYear, setSelectedYear] = useState(today.getFullYear().toString());

    useEffect(() => {
        fetchRecap(selectedYear, selectedMonth);
    }, [selectedYear, selectedMonth, fetchRecap]);

    // Generate year options (current year back to 2023)
    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const startYear = 2023; // Assumed starting year of business/app
        const result = [];
        for (let y = currentYear; y >= startYear; y--) {
            result.push(y.toString());
        }
        return result;
    }, []);

    const months = [
        { value: '01', label: 'January' },
        { value: '02', label: 'February' },
        { value: '03', label: 'March' },
        { value: '04', label: 'April' },
        { value: '05', label: 'May' },
        { value: '06', label: 'June' },
        { value: '07', label: 'July' },
        { value: '08', label: 'August' },
        { value: '09', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];

    const changeMonth = (direction: -1 | 1) => {
        let newMonth = parseInt(selectedMonth) + direction;
        let newYear = parseInt(selectedYear);

        if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        } else if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        }

        setSelectedMonth(newMonth.toString().padStart(2, '0'));
        setSelectedYear(newYear.toString());
    };

    const handleExportCSV = () => {
        const monthLabel = months.find(m => m.value === selectedMonth)?.label;
        const filename = `Freelancer_Recap_${monthLabel}_${selectedYear}.csv`;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Header
        csvContent += "Freelancer Name,Total Jobs,Total Fee (Rp)\n";
        
        // Data rows
        recap.forEach(row => {
            const escapedName = row.freelancer_name.replace(/"/g, '""');
            csvContent += `"${escapedName}",${row.total_jobs},${row.total_fee}\n`;
        });
        
        // Total row
        const totalAmount = recap.reduce((s, r) => s + r.total_fee, 0);
        csvContent += `"GRAND TOTAL","",${totalAmount}\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate Grand Totals
    const grandTotalFees = recap.reduce((sum, item) => sum + item.total_fee, 0);
    const grandTotalJobs = recap.reduce((sum, item) => sum + item.total_jobs, 0);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            {/* Header / Filter Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Calculator className="text-blue-600" /> Monthly Recap Report
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Summary of fees owed to freelancers for the selected month.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <button 
                        onClick={() => changeMonth(-1)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    
                    <select 
                        value={selectedMonth} 
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                    >
                        {months.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>

                    <select 
                        value={selectedYear} 
                        onChange={e => setSelectedYear(e.target.value)}
                        className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer mr-2"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    
                    <button 
                        onClick={() => changeMonth(1)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
                
                {recap.length > 0 && (
                    <button
                        onClick={handleExportCSV}
                        className="hidden md:flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-bold transition-colors shadow-sm"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                )}
            </div>

            {/* Content Display */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-800 text-white font-medium">
                        <tr>
                            <th className="px-6 py-4 rounded-tl-lg">Freelancer Name</th>
                            <th className="px-6 py-4 text-center">Total Jobs</th>
                            <th className="px-6 py-4 text-right rounded-tr-lg">Total Fee (Rp)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {loading ? (
                            <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500">Loading data...</td></tr>
                        ) : recap.length === 0 ? (
                            <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500 bg-slate-50 font-medium">No freelancer jobs recorded for this month.</td></tr>
                        ) : (
                            <>
                                {recap.map((row) => (
                                    <tr key={row.freelancer_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-blue-600">
                                            {row.freelancer_name}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center min-w-[32px] h-[32px] bg-slate-100 rounded-full font-bold text-slate-700">
                                                {row.total_jobs}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-base font-medium text-slate-800">
                                            {row.total_fee.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                                
                                {/* Grand Total Row */}
                                <tr className="bg-blue-50/50 border-t-2 border-blue-100">
                                    <td className="px-6 py-5 font-black text-slate-800 uppercase text-sm tracking-wider">
                                        Grand Total
                                    </td>
                                    <td className="px-6 py-5 text-center font-black text-slate-800 text-lg">
                                        {grandTotalJobs}
                                    </td>
                                    <td className="px-6 py-5 text-right font-black text-blue-700 text-xl">
                                        Rp {grandTotalFees.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            {recap.length > 0 && (
                <button
                    onClick={handleExportCSV}
                    className="mt-6 md:hidden w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-bold transition-colors shadow-sm"
                >
                    <Download size={16} />
                    Export to CSV
                </button>
            )}
        </div>
    );
};
