'use client';

import { Booking } from "@/lib/storage";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, Users, CalendarX, Target, TrendingUp, ArrowUpRight, ArrowDownRight, Megaphone, MousePointerClick, CheckCircle } from 'lucide-react';
import { MetaInsightsData } from "@/app/api/meta/insights/route";
import { useState, useEffect } from 'react';

interface Props {
    bookings: Booking[];
}

interface AdsData {
    spend: number;
    impressions: number;
    inlineLinkClicks: number;
    reach: number;
    isLoading: boolean;
    error: string | null;
}

export default function DashboardMetrics({ bookings }: Props) {
    const [adsData, setAdsData] = useState<AdsData>({
        spend: 0,
        impressions: 0,
        inlineLinkClicks: 0,
        reach: 0,
        isLoading: true,
        error: null
    });

    // Fetch ads data on mount
    useEffect(() => {
        const fetchAdsData = async () => {
            try {
                const response = await fetch('/api/meta/insights');
                const result = await response.json();

                if (result.success && result.data) {
                    setAdsData({
                        ...result.data,
                        isLoading: false,
                        error: null
                    });
                } else {
                    setAdsData(prev => ({
                        ...prev,
                        isLoading: false,
                        error: result.error || 'Failed to fetch ads data'
                    }));
                }
            } catch (error) {
                console.error('Error fetching ads data:', error);
                setAdsData(prev => ({
                    ...prev,
                    isLoading: false,
                    error: error instanceof Error ? error.message : 'Connection error'
                }));
            }
        };

        fetchAdsData();
    }, []);

    // 1. Calculate Summary
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter(b => b.status !== 'Canceled');
    const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.finance.total_price || 0), 0);
    const canceledOrRescheduled = bookings.filter(b => b.status === 'Canceled' || b.status === 'Rescheduled').length;

    // 2. Calculate ROI Metrics
    const adsSpend = adsData.spend;
    const adsRevenue = totalRevenue; // Revenue from bookings
    const roi = adsSpend > 0 ? ((adsRevenue - adsSpend) / adsSpend) * 100 : 0;
    const roas = adsSpend > 0 ? (adsRevenue / adsSpend) : 0;

    // Marketing Funnel Metrics
    const impressions = adsData.impressions;
    const clicks = adsData.inlineLinkClicks;
    const conversions = totalBookings;

    // Calculate conversion rates
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0; // Click-Through Rate
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0; // Conversion Rate
    const overallConversionRate = impressions > 0 ? (conversions / impressions) * 100 : 0;

    // 3. Prepare Chart Data
    const categories = [
        'Wedding', 'Prewedding Bronze', 'Prewedding Gold', 'Prewedding Silver',
        'Wisuda', 'Family', 'Birthday', 'Pas Foto', 'Self Photo', 'Indoor', 'Outdoor'
    ];

    const chartData = categories.map(cat => ({
        name: cat,
        count: bookings.filter(b => b.customer.category === cat).length
    })).filter(d => d.count > 0);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6699'];

    return (
        <div className="space-y-6">
            {/* Booking Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Bookings</p>
                        <p className="text-2xl font-bold">{totalBookings}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Est. Revenue (Active)</p>
                        <p className="text-2xl font-bold">Rp {totalRevenue.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-full">
                        <CalendarX size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Canceled / Rescheduled</p>
                        <p className="text-2xl font-bold">{canceledOrRescheduled}</p>
                    </div>
                </div>
            </div>

            {/* Ads Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <Target size={20} className="text-purple-600" />
                        {adsData.isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>}
                    </div>
                    <p className="text-sm text-gray-500">Ads Spend (This Month)</p>
                    <p className="text-2xl font-bold text-purple-700">
                        {adsData.isLoading ? '...' : `Rp ${adsSpend.toLocaleString()}`}
                    </p>
                    {adsData.error && <p className="text-xs text-red-500 mt-1">{adsData.error}</p>}
                </div>

                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp size={20} className="text-orange-600" />
                    </div>
                    <p className="text-sm text-gray-500">WhatsApp Clicks</p>
                    <p className="text-2xl font-bold text-orange-700">
                        {adsData.isLoading ? '...' : adsData.inlineLinkClicks.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">from {adsData.impressions.toLocaleString()} impressions</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <Users size={20} className="text-teal-600" />
                    </div>
                    <p className="text-sm text-gray-500">Reach</p>
                    <p className="text-2xl font-bold text-teal-700">
                        {adsData.isLoading ? '...' : adsData.reach.toLocaleString()}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <DollarSign size={20} className="text-indigo-600" />
                    </div>
                    <p className="text-sm text-gray-500">ROAS</p>
                    <p className="text-2xl font-bold text-indigo-700">
                        {adsData.isLoading ? '...' : (roas > 0 ? `${roas.toFixed(2)}x` : 'N/A')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {adsSpend > 0 ? `${roi > 0 ? '+' : ''}${roi.toFixed(1)}% ROI` : 'No spend data'}
                    </p>
                </div>
            </div>

            {/* ROI Comparison */}
            {adsSpend > 0 && (
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 text-gray-700 flex items-center gap-2">
                        <DollarSign size={20} /> ROI & Performance Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-500 mb-1">Total Spend</p>
                            <p className="text-xl font-bold text-purple-700">Rp {adsSpend.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-500 mb-1">Revenue Generated</p>
                            <p className="text-xl font-bold text-green-700">Rp {adsRevenue.toLocaleString()}</p>
                        </div>
                        <div className={`p-4 rounded-lg border ${roi >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <p className="text-sm text-gray-500 mb-1">Net Profit / ROI</p>
                            <p className={`text-xl font-bold ${roi >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {roi >= 0 ? '+' : ''}Rp {(adsRevenue - adsSpend).toLocaleString()}
                            </p>
                            <p className={`text-sm font-semibold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {roi >= 0 ? <ArrowUpRight size={14} className="inline" /> : <ArrowDownRight size={14} className="inline" />}
                                {roi.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        * ROI calculated as: ((Revenue - Spend) / Spend) × 100
                    </p>
                </div>
            )}

            {/* Marketing Funnel */}
            {!adsData.isLoading && impressions > 0 && (
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <h3 className="text-lg font-bold mb-6 text-gray-700 flex items-center gap-2">
                        <Target size={20} /> Marketing Funnel Analysis
                    </h3>

                    <div className="space-y-4">
                        {/* Stage 1: Impressions */}
                        <div className="relative">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <Megaphone size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Impressions</p>
                                        <p className="text-xs text-gray-500">People who saw your ads</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-blue-600">{impressions.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">100%</p>
                                </div>
                            </div>
                            <div className="h-12 bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg shadow-md"></div>
                        </div>

                        {/* Arrow & CTR */}
                        <div className="flex items-center justify-center">
                            <div className="text-center px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500">Click-Through Rate</p>
                                <p className="text-lg font-bold text-purple-600">{ctr.toFixed(2)}%</p>
                                <p className="text-xs text-gray-400">{clicks.toLocaleString()} clicks</p>
                            </div>
                        </div>

                        {/* Stage 2: Clicks */}
                        <div className="relative">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                        <MousePointerClick size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">WhatsApp Clicks</p>
                                        <p className="text-xs text-gray-500">Visitors who clicked</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-orange-600">{clicks.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">{((clicks / impressions) * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                            <div
                                className="h-12 bg-gradient-to-r from-orange-500 to-orange-400 rounded-lg shadow-md"
                                style={{ width: `${Math.max((clicks / impressions) * 100, 5)}%` }}
                            ></div>
                        </div>

                        {/* Arrow & Conversion Rate */}
                        <div className="flex items-center justify-center">
                            <div className="text-center px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500">Conversion Rate</p>
                                <p className="text-lg font-bold text-green-600">{conversionRate.toFixed(2)}%</p>
                                <p className="text-xs text-gray-400">{conversions.toLocaleString()} bookings</p>
                            </div>
                        </div>

                        {/* Stage 3: Conversions */}
                        <div className="relative">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                        <CheckCircle size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Conversions</p>
                                        <p className="text-xs text-gray-500">Confirmed bookings</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-green-600">{conversions.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">{((conversions / impressions) * 100).toFixed(2)}%</p>
                                </div>
                            </div>
                            <div
                                className="h-12 bg-gradient-to-r from-green-500 to-green-400 rounded-lg shadow-md"
                                style={{ width: `${Math.max((conversions / impressions) * 100, 3)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-xs text-gray-600 mb-1">Overall Conversion</p>
                                <p className="text-xl font-bold text-blue-700">{overallConversionRate.toFixed(3)}%</p>
                                <p className="text-xs text-gray-500 mt-1">Impression → Booking</p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <p className="text-xs text-gray-600 mb-1">Cost Per Click</p>
                                <p className="text-xl font-bold text-orange-700">
                                    {clicks > 0 ? `Rp ${Math.round(adsSpend / clicks).toLocaleString()}` : 'N/A'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Average CPC</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <p className="text-xs text-gray-600 mb-1">Cost Per Acquisition</p>
                                <p className="text-xl font-bold text-green-700">
                                    {conversions > 0 ? `Rp ${Math.round(adsSpend / conversions).toLocaleString()}` : 'N/A'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Average CPA</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-4">
                        * Funnel shows the customer journey from ad impression to confirmed booking
                    </p>
                </div>
            )}

            {/* Chart */}
            <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-gray-700">Services Distribution</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" fontSize={12} tickMargin={10} />
                            <YAxis allowDecimals={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
