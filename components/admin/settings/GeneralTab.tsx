'use client';

import { useState, useEffect } from 'react';
import { SystemSettings } from '@/lib/types/settings';
import { FILE_CONSTRAINTS } from '@/lib/constants';

interface GeneralTabProps {
  settings: SystemSettings;
  onChange: (key: keyof SystemSettings, value: string) => void;
  onLogoUpload: (file: File) => Promise<void>;
  uploading: boolean;
}

export default function GeneralTab({ settings, onChange, onLogoUpload, uploading }: GeneralTabProps) {
  const [seoPreview, setSeoPreview] = useState({
    title: '',
    description: '',
    url: ''
  });

  useEffect(() => {
    // Generate SEO preview
    setSeoPreview({
      title: settings.meta_title || settings.site_name || 'Cerita Kita',
      description: settings.meta_description || 'Professional photography services in Jakarta',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://ceritakita.studio'
    });
  }, [settings.meta_title, settings.meta_description, settings.site_name]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = FILE_CONSTRAINTS.ALLOWED_IMAGE_TYPES as readonly string[];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Use JPG, PNG, GIF, or WEBP');
      return;
    }

    // Validate file size
    if (file.size > FILE_CONSTRAINTS.MAX_SIZE) {
      alert(`File too large. Maximum size is ${FILE_CONSTRAINTS.MAX_SIZE / (1024 * 1024)}MB`);
      return;
    }

    await onLogoUpload(file);
  };

  return (
    <div className="space-y-6">
      {/* Site Branding */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Site Branding</h3>

        <div className="space-y-4">
          {/* Site Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={settings.site_name}
              onChange={(e) => onChange('site_name', e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Cerita Kita"
              required
            />
            <p className="text-xs text-gray-500 mt-1">This appears in the logo and throughout your site</p>
          </div>

          {/* Site Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Logo
            </label>
            <div className="space-y-3">
              {settings.site_logo && (
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <img
                      src={settings.site_logo}
                      alt="Current logo"
                      className="h-16 w-auto object-contain border rounded-lg p-2 bg-gray-50"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/default-logo.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <a href={settings.site_logo} target="_blank" rel="noreferrer" className="text-white text-xs font-medium hover:underline">
                        View
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-gray-900">Current Logo</span>
                    <span className="text-xs text-gray-500 break-all max-w-md">{settings.site_logo}</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm
                      ${uploading
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      <svg className={`w-5 h-5 ${uploading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {uploading ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        )}
                      </svg>
                      {uploading ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    <span className="text-sm text-gray-400">or</span>
                    <input
                      type="text"
                      value={settings.site_logo}
                      onChange={(e) => onChange('site_logo', e.target.value)}
                      className="flex-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Recommended: PNG or SVG with transparent background. Max 5MB.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Hero Section</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hero Title (H1)
          </label>
          <input
            type="text"
            value={settings.hero_title}
            onChange={(e) => onChange('hero_title', e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Capture Your Special Moments"
          />
          <p className="text-xs text-gray-500 mt-1">Main title displayed on the booking page</p>
        </div>
      </div>

      {/* SEO Settings */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">SEO Settings</h3>

        <div className="space-y-4">
          {/* Meta Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Title
            </label>
            <input
              type="text"
              value={settings.meta_title}
              onChange={(e) => onChange('meta_title', e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Cerita Kita - Professional Photography Services"
              maxLength={60}
            />
            <p className="text-xs text-gray-500 mt-1">
              {settings.meta_title.length}/60 characters - Recommended for search engines
            </p>
          </div>

          {/* Meta Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
            </label>
            <textarea
              value={settings.meta_description}
              onChange={(e) => onChange('meta_description', e.target.value)}
              rows={3}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Professional photography services in Jakarta. Book your special moments with Cerita Kita."
              maxLength={160}
            />
            <p className={`text-xs mt-1 ${settings.meta_description.length > 160 ? 'text-red-600' : 'text-gray-500'}`}>
              {settings.meta_description.length}/160 characters - Used for WhatsApp link preview
            </p>
          </div>
        </div>

        {/* SEO Preview */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4 border">
          <h4 className="text-sm font-bold text-gray-700 mb-3">Preview</h4>
          <div className="space-y-2">
            <div className="text-blue-600 font-semibold text-sm">{seoPreview.title}</div>
            <div className="text-gray-600 text-xs">{seoPreview.url}</div>
            <div className="text-gray-500 text-xs">{seoPreview.description}</div>
          </div>
          <p className="text-xs text-gray-400 mt-2">This is how it appears in search results and WhatsApp</p>
        </div>
      </div>
    </div>
  );
}