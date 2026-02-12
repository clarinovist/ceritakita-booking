'use client';

import { SystemSettings, InvoiceSettings } from '@/lib/types/settings';
import { Eye } from 'lucide-react';

interface FinanceTabProps {
  settings: SystemSettings;
  onChange: (key: keyof SystemSettings, value: string) => void;
  onToggle: (key: keyof SystemSettings, value: boolean) => void;
  onNumberChange: (key: keyof SystemSettings, value: number) => void;
  onInvoiceChange: (key: keyof InvoiceSettings, value: string) => void;
  onPreviewInvoice: () => void;
}

export default function FinanceTab({
  settings,
  onChange,
  onToggle,
  onNumberChange,
  onInvoiceChange,
  onPreviewInvoice
}: FinanceTabProps) {
  const validateBankNumber = (number: string): boolean => {
    return /^[0-9]+$/.test(number.replace(/\s/g, ''));
  };

  const handleDepositChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onNumberChange('deposit_amount', numValue);
    }
  };

  return (
    <div className="space-y-6">
      {/* 2-Column Grid: Bank Details & Payment Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Details */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Bank Account Details</h3>

          <div className="space-y-4">
            {/* Bank Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={settings.bank_name}
                onChange={(e) => onChange('bank_name', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="BCA"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Bank name for invoice display</p>
            </div>

            {/* Bank Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                value={settings.bank_number}
                onChange={(e) => onChange('bank_number', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${settings.bank_number && !validateBankNumber(settings.bank_number)
                  ? 'border-red-300 bg-red-50'
                  : ''
                  }`}
                placeholder="1234567890"
                required
              />
              {settings.bank_number && !validateBankNumber(settings.bank_number) && (
                <p className="text-xs text-red-600 mt-1">Only numbers allowed</p>
              )}
            </div>

            {/* Bank Holder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Holder Name
              </label>
              <input
                type="text"
                value={settings.bank_holder}
                onChange={(e) => onChange('bank_holder', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="CERITA KITA"
                required
              />
            </div>
          </div>
        </div>

        {/* Payment Rules */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Rules</h3>

          <div className="space-y-4">
            {/* Requires Deposit */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Requires Deposit</label>
                <p className="text-xs text-gray-500 mt-1">Require deposit before booking confirmation</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requires_deposit}
                  onChange={(e) => onToggle('requires_deposit', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Deposit Amount */}
            {settings.requires_deposit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Amount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={settings.deposit_amount}
                  onChange={(e) => handleDepositChange(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="50"
                />
                <p className="text-xs text-gray-500 mt-1">Percentage of total booking price</p>
              </div>
            )}

            {/* Initial Cash Balance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Cash Balance (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={settings.initial_cash_balance}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0) {
                    onNumberChange('initial_cash_balance', val);
                  }
                }}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Starting balance for cash position report</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Template Settings (Full Width) */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Invoice Template Settings</h3>
            <p className="text-sm text-gray-500">Customize how your invoices appear to customers</p>
          </div>
          <button
            type="button"
            onClick={onPreviewInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm font-medium transition-colors"
          >
            <Eye size={16} />
            Preview Invoice
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                value={settings.invoice?.companyName || ''}
                onChange={(e) => onInvoiceChange('companyName', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={settings.site_name}
              />
            </div>

            {/* Company Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Phone</label>
              <input
                type="text"
                value={settings.invoice?.companyPhone || ''}
                onChange={(e) => onInvoiceChange('companyPhone', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={settings.business_phone}
              />
            </div>

            {/* Company Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Email</label>
              <input
                type="email"
                value={settings.invoice?.companyEmail || ''}
                onChange={(e) => onInvoiceChange('companyEmail', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={settings.business_email}
              />
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL (Optional)</label>
              <input
                type="text"
                value={settings.invoice?.logoUrl || ''}
                onChange={(e) => onInvoiceChange('logoUrl', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={settings.site_logo}
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to use site logo</p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Company Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
              <textarea
                value={settings.invoice?.companyAddress || ''}
                onChange={(e) => onInvoiceChange('companyAddress', e.target.value)}
                rows={3}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder={settings.business_address}
              />
            </div>

            {/* Footer Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Footer Note</label>
              <textarea
                value={settings.invoice?.footerNote || ''}
                onChange={(e) => onInvoiceChange('footerNote', e.target.value)}
                rows={4}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder={settings.invoice_notes || "Thank you for your business!"}
              />
              <p className="text-xs text-gray-500 mt-1">Appears at the very bottom of the invoice</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}