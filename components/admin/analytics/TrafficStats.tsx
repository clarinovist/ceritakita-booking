'use client';

import React, { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer
} from 'recharts';
import { TrafficStats as TrafficStatsType, TopPageData, TrafficSourceData } from '@/lib/repositories/analytics';


interface TrafficStatsProps {
    dateRange: { start: string; end: string };
}

export function TrafficStats({ dateRange }: TrafficStatsProps) {
    const [trafficData, setTrafficData] = useState<TrafficStatsType[]>([]);
    const [topPages, setTopPages] = useState<TopPageData[]>([]);
    const [trafficSources, setTrafficSources] = useState<TrafficSourceData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Helper to format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    // Helper to get friendly page names
    const getPageTitle = (path: string) => {
        if (path === '/') return 'Homepage';
        if (path === '/login') return 'Login';
        if (path === '/admin') return 'Admin Dashboard';
        if (path.startsWith('/admin')) {
            if (path.includes('/bookings')) return 'Admin Bookings';
            if (path.includes('/services')) return 'Admin Services';
            return 'Admin Area';
        }
        if (path.startsWith('/packages')) return 'Packages';
        if (path.startsWith('/portfolio')) return 'Portfolio';
        if (path.startsWith('/about')) return 'About Us';
        if (path.startsWith('/contact')) return 'Contact';
        if (path.startsWith('/gallery')) return 'Gallery';
        // Capitalize and clean up others
        return path.split('/').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') || path;
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
                    setTrafficSources(data.sources || []);
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

                {/* Traffic Sources */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Traffic Sources</h3>
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={trafficSources}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="visitors"
                                >
                                    {trafficSources.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <p className="text-xs text-slate-500 font-medium">Top Source</p>
                            <p className="text-lg font-bold text-slate-800">{trafficSources[0]?.source || '-'}</p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        {trafficSources.slice(0, 5).map((source, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5] }}></div>
                                    <span className="text-slate-600 font-medium">{source.source}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-800 font-bold">{source.visitors}</span>
                                    <span className="text-slate-400 text-xs w-8 text-right">{source.percent}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Pages Table - Full Width on Mobile, Span 2 on Desktop if needed, currently 1 */}
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
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
                                            <div className="font-medium text-slate-800">{getPageTitle(page.path)}</div>
                                            <div className="text-xs text-slate-400 truncate">{page.path}</div>
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
