'use client';

import { Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { type PaymentMethod } from './PaymentMethodList';

export interface PaymentMethodFormData {
  name: string;
  provider_name: string;
  account_name: string;
  account_number: string;
  qris_image_url?: string;
  is_active: number;
  display_order: number;
}

interface PaymentMethodFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMethod: PaymentMethod | null;
  formData: PaymentMethodFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  uploading: boolean;
  error: string;
  qrFile: File | null;
  qrPreview: string;
}

export function PaymentMethodFormModal({
  isOpen,
  onClose,
  editingMethod,
  formData,
  onChange,
  onFileChange,
  onSubmit,
  loading,
  uploading,
  error,
  qrFile,
  qrPreview
}: PaymentMethodFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">
            {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onChange}
                required
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., BCA Transfer"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Provider Name *
              </label>
              <input
                type="text"
                name="provider_name"
                value={formData.provider_name}
                onChange={onChange}
                required
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., BCA"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Account Name *
              </label>
              <input
                type="text"
                name="account_name"
                value={formData.account_name}
                onChange={onChange}
                required
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Account Number *
              </label>
              <input
                type="text"
                name="account_number"
                value={formData.account_number}
                onChange={onChange}
                required
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., 1234567890"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                name="display_order"
                value={formData.display_order}
                onChange={onChange}
                required
                min="0"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Status
              </label>
              <select
                name="is_active"
                value={formData.is_active}
                onChange={onChange}
                required
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                QRIS Image
              </label>
              <label className="flex items-center justify-center w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                />
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <ImageIcon size={14} />
                  {qrFile || qrPreview ? 'Change' : 'Upload'}
                </span>
              </label>
            </div>
          </div>

          {/* QRIS Preview */}
          {(qrPreview || formData.qris_image_url) && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs font-bold text-gray-600 mb-2">QRIS Preview:</p>
              <div className="relative w-24 h-24">
                <Image
                  src={qrPreview || formData.qris_image_url!}
                  alt="QRIS Preview"
                  fill
                  className="object-contain rounded border border-gray-300 bg-white"
                  sizes="96px"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="flex items-center justify-center h-full text-red-500 text-xs p-2 text-center">Image failed to load</div>';
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Uploading QRIS image...
            </div>
          )}

          {/* Error Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (editingMethod ? 'Update Method' : 'Create Method')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
