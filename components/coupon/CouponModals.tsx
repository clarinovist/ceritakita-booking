'use client';

import { type Coupon } from './CouponTable';

interface CouponModalsProps {
  isOpen: boolean;
  onClose: () => void;
  editingCoupon: Coupon | null;
  formData: {
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_purchase: string;
    max_discount: string;
    usage_limit: string;
    valid_from: string;
    valid_until: string;
    description: string;
    is_active: boolean;
  };
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CouponModals({
  isOpen,
  onClose,
  editingCoupon,
  formData,
  setFormData,
  onSubmit
}: CouponModalsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">
            {editingCoupon ? 'Edit Kupon' : 'Buat Kupon Baru'}
          </h2>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Kode Kupon *</label>
              <input
                required
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full p-2.5 border rounded-lg font-mono uppercase"
                placeholder="DISKON10"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tipe Diskon *</label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                className="w-full p-2.5 border rounded-lg"
              >
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Nominal (Rp)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nilai Diskon *</label>
              <input
                required
                type="number"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                className="w-full p-2.5 border rounded-lg"
                placeholder={formData.discount_type === 'percentage' ? '10' : '50000'}
              />
            </div>

            {formData.discount_type === 'percentage' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Diskon Maksimal (Rp)</label>
                <input
                  type="number"
                  value={formData.max_discount}
                  onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                  className="w-full p-2.5 border rounded-lg"
                  placeholder="100000"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Minimal Pembelian (Rp)</label>
              <input
                type="number"
                value={formData.min_purchase}
                onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                className="w-full p-2.5 border rounded-lg"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Batas Penggunaan</label>
              <input
                type="number"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                className="w-full p-2.5 border rounded-lg"
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Berlaku Dari</label>
              <input
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                className="w-full p-2.5 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Berlaku Sampai</label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="w-full p-2.5 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 border rounded-lg"
              rows={3}
              placeholder="Deskripsi singkat tentang kupon ini..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="is_active" className="text-sm font-bold text-gray-700">
              Kupon Aktif
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-lg font-bold hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
            >
              {editingCoupon ? 'Update Kupon' : 'Buat Kupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
