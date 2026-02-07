'use client';

import React, { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { TrafficStats as TrafficStatsType, TopPageData } from '@/lib/repositories/analytics';


interface TrafficStatsProps {
    dateRange: { start: string; end: string };
}

export function TrafficStats({ dateRange }: TrafficStatsProps) {
    const [trafficData, setTrafficData] = useState<TrafficStatsType[]>([]);
    const [topPages, setTopPages] = useState<TopPageData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Helper to format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const start = dateRange?.start || '';
                const end = dateRange?.end || '';

                const params = new URLSearchParams();
                if (start) params.append('start', start);
                if (end) params.append('end', end);

                const res = await fetch(`/api/analytics/traffic?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setTrafficData(data.traffic || []);
                    setTopPages(data.topPages || []);
                }
            } catch (error) {
                console.error('Failed to fetch traffic stats', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [dateRange]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96"></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96"></div>
            </div>
        );
    }

    const totalViews = trafficData.reduce((acc, curr) => acc + curr.views, 0);
    const totalVisitors = trafficData.reduce((acc, curr) => acc + curr.visitors, 0);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm text-slate-500 font-medium">Total Views</p>
                    <p className="text-2xl font-bold text-slate-800">{totalViews.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm text-slate-500 font-medium">Total Visitors</p>
                    <p className="text-2xl font-bold text-slate-800">{totalVisitors.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Website Traffic</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trafficData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="views"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    name="Page Views"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="visitors"
                                    stroke="#10B981"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    name="Unique Visitors"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Pages Table */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Top Pages</h3>
                    <div className="overflow-auto max-h-80 pr-1">
                        <table className="w-full">
                            <thead className="text-xs text-slate-500 font-medium bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left rounded-l-lg">Path</th>
                                    <th className="px-3 py-2 text-right rounded-r-lg">Views</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {topPages.map((page, index) => (
                                    <tr key={index} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-3 py-3 text-slate-700 truncate max-w-[200px]" title={page.path}>
                                            {page.path}
                                        </td>
                                        <td className="px-3 py-3 text-right font-medium text-slate-800">
                                            {page.views.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {topPages.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="px-3 py-4 text-center text-slate-400 text-sm">
                                            No data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
