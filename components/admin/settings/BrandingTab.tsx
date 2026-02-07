'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { SystemSettings, SeoSettings } from '@/lib/types/settings';
import { FILE_CONSTRAINTS } from '@/lib/constants';
import { Globe, Shield, BarChart } from 'lucide-react';

interface BrandingTabProps {
  settings: SystemSettings;
  onChange: (key: keyof SystemSettings, value: any) => void;
  onLogoUpload: (file: File) => Promise<void>;
  uploading: boolean;
}

export default function BrandingTab({ settings, onChange, onLogoUpload, uploading }: BrandingTabProps) {
  const [seoPreview, setSeoPreview] = useState({
    title: '',
    description: '',
    url: ''
  });

  useEffect(() => {
    setSeoPreview({
      title: settings.meta_title || settings.site_name || 'Cerita Kita',
      description: settings.meta_description || 'Professional photography services in Jakarta',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://ceritakita.studio'
    });
  }, [settings.meta_title, settings.meta_description, settings.site_name]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = FILE_CONSTRAINTS.ALLOWED_IMAGE_TYPES as readonly string[];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Use JPG, PNG, GIF, or WEBP');
      return;
    }

    if (file.size > FILE_CONSTRAINTS.MAX_SIZE) {
      alert(`File too large. Maximum size is ${FILE_CONSTRAINTS.MAX_SIZE / (1024 * 1024)}MB`);
      return;
    }

    await onLogoUpload(file);
  };

  const handleSeoChange = (key: keyof SeoSettings, value: string) => {
    const currentSeo = settings.seo || { googleAnalyticsId: '', metaPixelId: '' };
    const updatedSeo = { ...currentSeo, [key]: value };
    onChange('seo', updatedSeo);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Site Branding */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Shield size={18} className="text-indigo-600" />
          <h3 className="font-display font-bold text-slate-800">Business Branding</h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Site Name</label>
              <input
                type="text"
                value={settings.site_name}
                onChange={(e) => onChange('site_name', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Cerita Kita"
                required
              />
              <p className="text-xs text-slate-500 mt-2 text-balance">Official business name for invoices and sidebar.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Site Logo</label>
              <div className="flex items-center gap-4">
                {settings.site_logo && (
                  <div className="relative w-12 h-12 rounded-xl border border-slate-200 p-2 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                    <Image
                      src={settings.site_logo}
                      alt=""
                      fill
                      className="p-1 object-contain"
                    />
                  </div>
                )}
                <label className={`flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border shadow-sm
                    ${uploading ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-100' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-500 hover:bg-indigo-50/30'}`}
                >
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                  <svg className={`w-4 h-4 ${uploading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {uploading ? 'Uploading...' : 'Change Logo'}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Globe size={18} className="text-indigo-600" />
          <h3 className="font-display font-bold text-slate-800">SEO Configuration</h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Meta Title</label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.meta_title}
                  onChange={(e) => onChange('meta_title', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-16"
                  placeholder="Cerita Kita - Professional Photography"
                  maxLength={60}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  {settings.meta_title.length}/60
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Optimal length for search engines is 50-60 characters.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Meta Description</label>
              <div className="relative">
                <textarea
                  value={settings.meta_description}
                  onChange={(e) => onChange('meta_description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  placeholder="Describe your studio..."
                  maxLength={160}
                />
                <div className="absolute right-4 bottom-4 text-xs font-mono text-slate-400">
                  {settings.meta_description.length}/160
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">This text appears in search results and when sharing links.</p>
            </div>
          </div>

          {/* SEO Preview Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2 group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Search Result Preview</span>
              <Globe size={12} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
            </div>
            <div className="text-indigo-600 font-medium text-lg font-display leading-tight underline-offset-4 decoration-indigo-200 hover:underline cursor-text">
              {seoPreview.title}
            </div>
            <div className="text-emerald-700 text-xs font-medium truncate mb-1">
              {seoPreview.url.replace('https://', '')} › ...
            </div>
            <div className="text-slate-600 text-sm leading-relaxed line-clamp-2">
              {seoPreview.description}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics & SEO */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <BarChart size={18} className="text-indigo-600" />
          <h3 className="font-display font-bold text-slate-800">Analytics & Tracking</h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">Google Analytics ID</label>
                {settings.seo?.googleAnalyticsId && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active
                  </span>
                )}
              </div>
              <input
                type="text"
                value={settings.seo?.googleAnalyticsId || ''}
                onChange={(e) => handleSeoChange('googleAnalyticsId', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="G-XXXXXXXXXX"
              />
              <p className="text-xs text-slate-500 mt-2">Enter your GA4 Measurement ID.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">Meta (Facebook) Pixel ID</label>
                {settings.seo?.metaPixelId && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active
                  </span>
                )}
              </div>
              <input
                type="text"
                value={settings.seo?.metaPixelId || ''}
                onChange={(e) => handleSeoChange('metaPixelId', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="1234567890"
              />
              <p className="text-xs text-slate-500 mt-2">Enter your Meta/Facebook Pixel ID.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}