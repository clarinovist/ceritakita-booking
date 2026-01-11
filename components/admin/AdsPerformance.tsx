'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Target, TrendingUp, Users, DollarSign, AlertCircle
} from 'lucide-react';

import { type Booking } from '@/lib/types';

export interface MetaInsightsData {
  spend: number;
  impressions: number;
  inlineLinkClicks: number;
  reach: number;
  cpc?: number;
  cpm?: number;
  ctr?: number;
  date_start: string;
  date_end: string;
}

interface AdsPerformanceProps {
  bookings: Booking[];
  dateRange: { start: string; end: string };
}

interface AdsData extends MetaInsightsData {
  isLoading: boolean;
  error: string | null;
}

export default function AdsPerformance({ bookings, dateRange }: AdsPerformanceProps) {
  const [adsData, setAdsData] = useState<AdsData>({
    spend: 0,
    impressions: 0,
    inlineLinkClicks: 0,
    reach: 0,
    date_start: '',
    date_end: '',
    isLoading: true,
    error: null
  });

  const fetchAdsData = useCallback(async () => {
    setAdsData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
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
  }, [dateRange]);

  useEffect(() => {
    fetchAdsData();
  }, [fetchAdsData]);

  // --- CALCULATIONS ---
  const totalRevenue = bookings
    .filter(b => b.status !== 'Cancelled')
    .reduce((sum, b) => sum + (b.finance?.total_price || 0), 0);

  const adsSpend = adsData.spend;
  const roi = adsSpend > 0 ? ((totalRevenue - adsSpend) / adsSpend) * 100 : 0;
  const roas = adsSpend > 0 ? (totalRevenue / adsSpend) : 0;
  const cpc = adsData.inlineLinkClicks > 0 ? (adsSpend / adsData.inlineLinkClicks) : 0;
  const cpm = adsData.impressions > 0 ? (adsSpend / adsData.impressions) * 1000 : 0;
  const ctr = adsData.impressions > 0 ? (adsData.inlineLinkClicks / adsData.impressions) * 100 : 0;



  return (
    <div className="space-y-6">
      {/* Header with Date Filter - Removed, moved to global header */}


      {/* Error Alert */}
      {adsData.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">API Error</p>
            <p className="text-sm text-red-600 mt-1">{adsData.error}</p>
            <p className="text-xs text-red-500 mt-2">
              Please ensure META_ACCESS_TOKEN and META_AD_ACCOUNT_ID are correctly set in your .env.local file.
            </p>
          </div>
        </div>
      )}

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <Target size={24} className="text-purple-600" />
            {adsData.isLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>}
          </div>
          <p className="text-sm text-gray-500">Total Spend</p>
          <p className="text-2xl font-bold text-purple-700">
            {adsData.isLoading ? '...' : `Rp ${adsSpend.toLocaleString()}`}
          </p>
          <p className="text-xs text-gray-400 mt-1">This Period</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp size={24} className="text-orange-600" />
          </div>
          <p className="text-sm text-gray-500">WhatsApp Clicks</p>
          <p className="text-2xl font-bold text-orange-700">
            {adsData.isLoading ? '...' : adsData.inlineLinkClicks.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {adsData.isLoading ? '' : `${ctr.toFixed(2)}% CTR`}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <Users size={24} className="text-blue-600" />
          </div>
          <p className="text-sm text-gray-500">Impressions</p>
          <p className="text-2xl font-bold text-blue-700">
            {adsData.isLoading ? '...' : adsData.impressions.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {adsData.isLoading ? '' : `CPM: Rp ${cpm.toFixed(2)}`}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <Users size={24} className="text-teal-600" />
          </div>
          <p className="text-sm text-gray-500">Unique Reach</p>
          <p className="text-2xl font-bold text-teal-700">
            {adsData.isLoading ? '...' : adsData.reach.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">Unique users</p>
        </div>
      </div>



      {/* ROI & Financial Analysis */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <h3 className="text-lg font-bold mb-4 text-gray-700 flex items-center gap-2">
          <DollarSign size={20} /> Financial Performance & ROI
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600 mb-1">Ads Spend</p>
            <p className="text-xl font-bold text-purple-700">Rp {adsSpend.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-1">Revenue Generated</p>
            <p className="text-xl font-bold text-green-700">Rp {totalRevenue.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-lg border ${roi >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-sm text-gray-600 mb-1">Net Profit</p>
            <p className={`text-xl font-bold ${roi >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {roi >= 0 ? '+' : ''}Rp {(totalRevenue - adsSpend).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">ROI</p>
            <p className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {roi.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 mt-1">Return on Investment</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">ROAS</p>
            <p className="text-2xl font-bold text-blue-600">
              {roas > 0 ? `${roas.toFixed(2)}x` : 'N/A'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Return on Ad Spend</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">CPC</p>
            <p className="text-2xl font-bold text-indigo-600">
              {cpc > 0 ? `Rp ${cpc.toFixed(0)}` : 'N/A'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Cost Per Click</p>
          </div>
        </div>
      </div>
    </div>
  );
}