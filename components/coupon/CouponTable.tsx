'use client';

import { Plus, Edit2, Trash2 } from 'lucide-react';
import { formatDate } from '@/utils/dateFormatter';

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  usage_limit?: number;
  usage_count: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  description?: string;
  created_at: string;
}

export interface CouponUsage {
  id: number;
  coupon_code: string;
  customer_name: string;
  discount_amount: number;
  order_total: number;
  used_at: string;
}

interface CouponTableProps {
  viewMode: 'coupons' | 'history';
  coupons: Coupon[];
  usageHistory: CouponUsage[];
  onEdit: (coupon: Coupon) => void;
  onDelete: (id: string) => void;
  onCreateClick: () => void;
}

export function CouponTable({
  viewMode,
  coupons,
  usageHistory,
  onEdit,
  onDelete,
  onCreateClick
}: CouponTableProps) {
  if (viewMode === 'coupons') {
    return (
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Daftar Kupon</h2>
          <button
            onClick={onCreateClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            <Plus size={18} />
            Buat Kupon Baru
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Kode</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Diskon</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Penggunaan</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Berlaku</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {coupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold font-mono">{coupon.code}</p>
                      {coupon.description && (
                        <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-green-600">
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}%`
                        : `Rp ${coupon.discount_value.toLocaleString('id-ID')}`
                      }
                    </p>
                    {coupon.max_discount && coupon.discount_type === 'percentage' && (
                      <p className="text-xs text-gray-500">Maks. Rp {coupon.max_discount.toLocaleString('id-ID')}</p>
                    )}
                    {coupon.min_purchase && (
                      <p className="text-xs text-gray-500">Min. Rp {coupon.min_purchase.toLocaleString('id-ID')}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">
                      {coupon.usage_count}/{coupon.usage_limit || '∞'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600">
                      {coupon.valid_from && <p>Dari: {formatDate(coupon.valid_from)}</p>}
                      {coupon.valid_until && <p>Sampai: {formatDate(coupon.valid_until)}</p>}
                      {!coupon.valid_from && !coupon.valid_until && <p>Tanpa batas waktu</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                      {coupon.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(coupon)}
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(coupon.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Belum ada kupon. Klik &quot;Buat Kupon Baru&quot; untuk memulai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">Riwayat Penggunaan Kupon</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Waktu</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Kode Kupon</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Pelanggan</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Total Order</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Diskon</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {usageHistory.map(usage => (
              <tr key={usage.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">
                  {new Date(usage.used_at).toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono font-bold text-sm">{usage.coupon_code}</span>
                </td>
                <td className="px-6 py-4 text-sm">{usage.customer_name}</td>
                <td className="px-6 py-4 text-sm font-semibold">
                  Rp {usage.order_total.toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-green-600">
                  - Rp {usage.discount_amount.toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
            {usageHistory.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  Belum ada riwayat penggunaan kupon.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
