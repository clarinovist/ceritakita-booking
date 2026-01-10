'use client';

import { useEffect, useState } from 'react';
import { SystemSettings } from '@/lib/types/settings';
import { UPLOAD_FOLDERS } from '@/lib/constants';
import {
  Info, Home, DollarSign, Calendar,
  MessageSquare, CreditCard, Users, Eye
} from 'lucide-react';

// Import tab components
import BrandingTab from './settings/BrandingTab';
import FinanceTab from './settings/FinanceTab';
import RulesTab from './settings/RulesTab';
import TemplatesTab from './settings/TemplatesTab';
import UserManagement from './UserManagement';
import PaymentMethodsManagement from './PaymentMethodsManagement';
import { SettingsPreviewModal } from './modals/SettingsPreviewModal';

// Tab type definition
type TabType = 'general' | 'contact' | 'finance' | 'rules' | 'templates' | 'payment_methods' | 'users';

interface TabConfig {
  id: TabType;
  label: string;
  icon: any; // Lucide icon component
}

// Updated TABS configuration with Lucide icons
const TABS: TabConfig[] = [
  { id: 'general', label: 'Branding & SEO', icon: Home },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'rules', label: 'Booking Rules', icon: Calendar },
  { id: 'templates', label: 'Templates', icon: MessageSquare },
  { id: 'payment_methods', label: 'Payment Methods', icon: CreditCard },
  { id: 'users', label: 'Team Access', icon: Users }
];

export default function SettingsManagement() {
  const [settings, setSettings] = useState<SystemSettings>({
    // Branding & SEO
    site_name: 'Cerita Kita',
    site_logo: '/images/default-logo.png',
    meta_title: 'Cerita Kita - Professional Photography Services',
    meta_description: 'Professional photography services in Jakarta. Book your special moments with Cerita Kita.',

    // Core Identity (used for Invoice/Notif)
    whatsapp_admin_number: '+62 812 3456 7890',
    business_email: 'info@ceritakita.studio',
    business_phone: '+62 812 3456 7890',
    business_address: 'Jalan Raya No. 123, Jakarta',

    // Finance
    bank_name: 'BCA',
    bank_number: '1234567890',
    bank_holder: 'CERITA KITA',
    invoice_notes: 'Terima kasih telah memilih layanan kami. Pembayaran dapat dilakukan sebelum tanggal sesi. Hubungi kami jika ada pertanyaan.',
    requires_deposit: false,
    deposit_amount: 50,
    tax_rate: 0,

    // Booking Rules
    min_booking_notice: 1,
    max_booking_ahead: 90,

    // Templates
    whatsapp_message_template: 'Halo {{customer_name}}!\n\nBooking Anda untuk {{service}} pada {{date}} pukul {{time}} telah dikonfirmasi.\n\nTotal: Rp {{total_price}}\nID Booking: {{booking_id}}\n\nTerima kasih telah memilih Cerita Kita!'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();

      // Merge with defaults to ensure all fields exist
      setSettings(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: keyof SystemSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleNumberChange = (key: keyof SystemSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key: keyof SystemSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', UPLOAD_FOLDERS.LOGO);

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      const { url } = await res.json();
      handleInputChange('site_logo', url);
      setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Save failed');
      }

      const data = await res.json();
      setSettings(data.settings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchSettings();
    setMessage({ type: 'success', text: 'Settings reset to last saved state' });
    setTimeout(() => setMessage(null), 2000);
  };

  // Helper to determine if we are in a self-managed tab
  const isSelfManagedTab = ['payment_methods', 'users'].includes(activeTab);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-slate-600 font-medium">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages - Only show for general settings tabs */}
      {message && !isSelfManagedTab && (
        <div className={`p-4 rounded-xl border flex items-center gap-2 ${message.type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-red-50 border-red-200 text-red-800'
          }`}>
          <Info size={18} className="flex-shrink-0" />
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Tab Navigation - Modern Pill Style */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/50">
          <nav className="flex gap-2 p-3 overflow-x-auto scrollbar-thin" aria-label="Settings tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMessage(null); // Clear messages when switching tabs
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                  <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <BrandingTab
              settings={settings}
              onChange={handleInputChange}
              onLogoUpload={handleLogoUpload}
              uploading={uploading}
            />
          )}



          {activeTab === 'finance' && (
            <FinanceTab
              settings={settings}
              onChange={handleInputChange}
              onToggle={handleToggle}
              onNumberChange={handleNumberChange}
            />
          )}

          {activeTab === 'rules' && (
            <RulesTab
              settings={settings}
              onNumberChange={handleNumberChange}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesTab
              settings={settings}
              onChange={handleInputChange}
            />
          )}

          {activeTab === 'payment_methods' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                <Info size={18} className="flex-shrink-0" />
                <span className="font-medium">Changes in Payment Methods are saved automatically and applied immediately.</span>
              </div>
              <PaymentMethodsManagement />
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                <Info size={18} className="flex-shrink-0" />
                <span className="font-medium">User management actions (create, update, delete) are effective immediately.</span>
              </div>
              <UserManagement />
            </div>
          )}
        </div>
      </div>

      {/* Form Actions - Hide for self-managed tabs */}
      {!isSelfManagedTab && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex justify-between items-center shadow-sm">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 font-semibold transition-colors flex items-center gap-2"
          >
            <Eye size={18} />
            Preview Settings
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-colors ${saving
                ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                }`}
            >
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Settings Preview Modal */}
      <SettingsPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        settings={settings}
      />
    </div>
  );
}