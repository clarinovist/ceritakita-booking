'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { SystemSettings } from '@/lib/types/settings';
import { FILE_CONSTRAINTS } from '@/lib/constants';
import { Globe, Shield, Mail, MessageCircle } from 'lucide-react';

interface BrandingTabProps {
  settings: SystemSettings;
  onChange: (key: keyof SystemSettings, value: string) => void;
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

      {/* Core Contact (For System Use) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Mail size={18} className="text-indigo-600" />
          <h3 className="font-display font-bold text-slate-800">System Contact Info</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Mail size={14} className="text-slate-400" />
                Invoice Sender Email
              </label>
              <input
                type="email"
                value={settings.business_email}
                onChange={(e) => onChange('business_email', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="billing@ceritakita.studio"
              />
              <p className="text-xs text-slate-500 mt-2">Used as the contact email on customer invoices.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <MessageCircle size={14} className="text-slate-400" />
                Admin WhatsApp Number
              </label>
              <input
                type="text"
                value={settings.whatsapp_admin_number}
                onChange={(e) => onChange('whatsapp_admin_number', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="+62..."
              />
              <p className="text-xs text-slate-500 mt-2">Recipient for admin notifications and system alerts.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Business Phone (Invoice)
              </label>
              <input
                type="text"
                value={settings.business_phone}
                onChange={(e) => onChange('business_phone', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="+62..."
              />
              <p className="text-xs text-slate-500 mt-2">Official phone number displayed on invoices.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Business Address (Invoice)
              </label>
              <textarea
                value={settings.business_address}
                onChange={(e) => onChange('business_address', e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                placeholder="Studio Address..."
              />
              <p className="text-xs text-slate-500 mt-2">Official business address for invoices and legal documents.</p>
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
    </div>
  );
}