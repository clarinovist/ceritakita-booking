import React from 'react';
import { Users, TrendingUp, Award, AlertCircle } from 'lucide-react';

export interface AgentStat {
    name: string;
    total: number;
    won: number;
    conversion_rate: number;
}

export interface LeadAnalyticsData {
    total_leads: number;
    total_won: number;
    conversion_rate: number;
    by_agent: AgentStat[];
    isLoading?: boolean;
    error?: string | null;
}

interface LeadPerformanceProps {
    data: LeadAnalyticsData;
}

export default function LeadPerformance({ data }: LeadPerformanceProps) {
    if (data.isLoading) return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (data.error) return (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-3 border border-red-100">
            <AlertCircle size={20} />
            <div>
                <p className="font-semibold">Failed to load lead analytics</p>
                <p className="text-sm">{data.error}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                    <Users size={20} className="text-blue-600" />
                    Lead Performance & Team Activity
                </h3>
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    All Sources
                </span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={48} className="text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Total Leads</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{data.total_leads}</p>
                    <p className="text-xs text-gray-400 mt-2">In selected period</p>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Award size={48} className="text-green-600" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Won / Converted</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{data.total_won}</p>
                    <div className="flex items-center mt-2">
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mr-2 max-w-[100px]">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${data.conversion_rate}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={48} className="text-indigo-600" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Avg Conversion Rate</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-1">{data.conversion_rate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-400 mt-2">From Total Leads</p>
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h4 className="font-semibold text-gray-700">Admin Leaderboard</h4>
                    <span className="text-xs text-gray-500">Sorted by Volume</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3 min-w-[150px]">Agent</th>
                                <th className="px-6 py-3 text-right">Leads Handled</th>
                                <th className="px-6 py-3 text-right">Won</th>
                                <th className="px-6 py-3 text-right">Conversion Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.by_agent.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No data available for this period</td></tr>
                            ) : (
                                data.by_agent.map((agent, idx) => (
                                    <tr key={agent.name} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-800 flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm
                            ${idx === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-50' :
                                                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                        idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-blue-50 text-blue-600'}
                        `}>
                                                {agent.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{agent.name}</div>
                                                {idx === 0 && <div className="text-[10px] text-yellow-600 font-bold">👑 Top Performer</div>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600 font-mono">{agent.total}</td>
                                        <td className="px-6 py-4 text-right text-green-600 font-mono font-bold">{agent.won}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block min-w-[60px] text-center ${agent.conversion_rate >= 20 ? 'bg-green-100 text-green-700' :
                                                agent.conversion_rate >= 10 ? 'bg-blue-100 text-blue-700' :
                                                    agent.conversion_rate > 0 ? 'bg-gray-100 text-gray-600' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                {agent.conversion_rate.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
