'use client';

import { Booking } from "@/lib/storage";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, Users, CalendarX, Target, TrendingUp, ArrowUpRight, ArrowDownRight, Megaphone, MousePointerClick, CheckCircle, CheckCircle2, History } from 'lucide-react';
import { MetaInsightsData } from "@/app/api/meta/insights/route";
import { useState, useEffect } from 'react';

interface Props {
    bookings: Booking[];
    dateRange?: { start: string; end: string };
}

interface AdsData {
    spend: number;
    impressions: number;
    inlineLinkClicks: number;
    reach: number;
    isLoading: boolean;
    error: string | null;
}

export default function DashboardMetrics({ bookings, dateRange }: Props) {
    const [adsData, setAdsData] = useState<AdsData>({
        spend: 0,
        impressions: 0,
        inlineLinkClicks: 0,
        reach: 0,
        isLoading: true,
        error: null
    });
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // Fetch ads data on mount and when dateRange changes
    useEffect(() => {
        const fetchAdsData = async () => {
            try {
                // Build URL with date range params if provided
                let url = '/api/meta/insights';
                if (dateRange?.start && dateRange?.end) {
                    const params = new URLSearchParams({
                        since: dateRange.start,
                        until: dateRange.end,
                    });
                    url = `${url}?${params.toString()}`;
                }

                const response = await fetch(url);
                const result = await response.json();

                if (result.success && result.data) {
                    setAdsData({
                        ...result.data,
                        isLoading: false,
                        error: null
                    });
                    // Update last updated timestamp on successful fetch
                    const now = new Date();
                    setLastUpdated(now.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }));
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
    }, [dateRange]);

    // Function to fetch history data
    const fetchHistoryData = async () => {
        setHistoryLoading(true);
        try {
            const response = await fetch('/api/meta/history?limit=7');
            const result = await response.json();
            
            if (result.success && result.data) {
                setHistoryData(result.data);
            } else {
                console.error('Failed to fetch history:', result.error);
                setHistoryData([]);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            setHistoryData([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Function to open history modal
    const openHistoryModal = () => {
        setShowHistoryModal(true);
        fetchHistoryData();
    };

    // 1. Calculate Summary
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.finance.total_price || 0), 0);
    const revenueFromActive = bookings.filter(b => b.status !== 'Cancelled').reduce((sum, b) => sum + (b.finance.total_price || 0), 0);
    const canceledOrRescheduled = bookings.filter(b => b.status === 'Cancelled' || b.status === 'Rescheduled').length;
    const completedBookings = bookings.filter(b => b.status === 'Completed').length;

    // 2. Calculate ROI Metrics
    const adsSpend = adsData.spend;
    const adsRevenue = revenueFromActive; // Revenue from bookings (excluding cancelled)
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                        <p className="text-sm text-gray-500">Est. Revenue</p>
                        <p className="text-2xl font-bold">Rp {revenueFromActive.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Excludes cancelled</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Completed</p>
                        <p className="text-2xl font-bold">{completedBookings}</p>
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
                    {/* Last Updated Indicator */}
                    {lastUpdated && !adsData.isLoading && !adsData.error && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 justify-end">
                            <CheckCircle2 size={12} className="text-green-500" />
                            <span>Data synced: {lastUpdated}</span>
                        </div>
                    )}
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

            {/* History Button in Ads Performance Section */}
            <div className="flex justify-end">
                <button
                    onClick={openHistoryModal}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-md"
                >
                    <History size={16} />
                    View Ads History
                </button>
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

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowHistoryModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <History size={20} className="text-purple-600" />
                                <h3 className="text-lg font-bold text-gray-800">Ads Performance History</h3>
                            </div>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <span className="text-2xl font-bold">×</span>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {historyLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                    <span className="ml-3 text-gray-600">Loading history...</span>
                                </div>
                            ) : historyData.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No history data available</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-gray-600 pb-2 border-b border-gray-200">
                                        <div className="col-span-1">Date</div>
                                        <div className="text-right">Spend</div>
                                        <div className="text-right">Clicks</div>
                                        <div className="text-right">Impressions</div>
                                        <div className="text-right">Reach</div>
                                        <div className="text-right">Updated</div>
                                    </div>
                                    
                                    {/* Table Rows */}
                                    {historyData.map((record, index) => (
                                        <div key={index} className="grid grid-cols-6 gap-2 text-sm py-2 hover:bg-gray-50 rounded">
                                            <div className="col-span-1 font-medium text-gray-900">
                                                {record.date_record}
                                            </div>
                                            <div className="text-right text-purple-700 font-semibold">
                                                Rp {record.spend.toLocaleString()}
                                            </div>
                                            <div className="text-right text-orange-700">
                                                {record.clicks.toLocaleString()}
                                            </div>
                                            <div className="text-right text-gray-600">
                                                {record.impressions.toLocaleString()}
                                            </div>
                                            <div className="text-right text-teal-700">
                                                {record.reach.toLocaleString()}
                                            </div>
                                            <div className="text-right text-xs text-gray-400">
                                                {new Date(record.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Showing last 7 records</span>
                                <span>Total: {historyData.length} entries</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
