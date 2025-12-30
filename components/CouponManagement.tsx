'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, TrendingUp, Users } from 'lucide-react';
import { formatDate } from '@/utils/dateFormatter';

interface Coupon {
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

interface CouponUsage {
    id: number;
    coupon_code: string;
    customer_name: string;
    discount_amount: number;
    order_total: number;
    used_at: string;
}

export default function CouponManagement() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [usageHistory, setUsageHistory] = useState<CouponUsage[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [viewMode, setViewMode] = useState<'coupons' | 'history'>('coupons');

    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: 0,
        min_purchase: '',
        max_discount: '',
        usage_limit: '',
        valid_from: '',
        valid_until: '',
        description: '',
        is_active: true
    });

    useEffect(() => {
        fetchCoupons();
        fetchUsageHistory();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await fetch('/api/coupons');
            const data = await res.json();
            setCoupons(data);
        } catch (error) {
            console.error('Error fetching coupons:', error);
        }
    };

    const fetchUsageHistory = async () => {
        try {
            const res = await fetch('/api/coupons/usage');
            const data = await res.json();
            setUsageHistory(data);
        } catch (error) {
            console.error('Error fetching usage history:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload = {
                ...formData,
                min_purchase: formData.min_purchase ? Number(formData.min_purchase) : undefined,
                max_discount: formData.max_discount ? Number(formData.max_discount) : undefined,
                usage_limit: formData.usage_limit ? Number(formData.usage_limit) : undefined,
                discount_value: Number(formData.discount_value),
                ...(editingCoupon && { id: editingCoupon.id })
            };

            const url = '/api/coupons';
            const method = editingCoupon ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to save coupon');
            }

            await fetchCoupons();
            setIsModalOpen(false);
            resetForm();
            alert(editingCoupon ? 'Kupon berhasil diupdate!' : 'Kupon berhasil dibuat!');
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            min_purchase: coupon.min_purchase?.toString() || '',
            max_discount: coupon.max_discount?.toString() || '',
            usage_limit: coupon.usage_limit?.toString() || '',
            valid_from: coupon.valid_from?.split('T')[0] || '',
            valid_until: coupon.valid_until?.split('T')[0] || '',
            description: coupon.description || '',
            is_active: coupon.is_active
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus kupon ini?')) return;

        try {
            const res = await fetch(`/api/coupons?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');

            await fetchCoupons();
            alert('Kupon berhasil dihapus!');
        } catch (error) {
            alert('Gagal menghapus kupon');
        }
    };

    const resetForm = () => {
        setEditingCoupon(null);
        setFormData({
            code: '',
            discount_type: 'percentage',
            discount_value: 0,
            min_purchase: '',
            max_discount: '',
            usage_limit: '',
            valid_from: '',
            valid_until: '',
            description: '',
            is_active: true
        });
    };

    const totalRevenue = usageHistory.reduce((sum, u) => sum + u.order_total, 0);
    const totalDiscounts = usageHistory.reduce((sum, u) => sum + u.discount_amount, 0);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Tag className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Kupon</p>
                            <p className="text-2xl font-bold">{coupons.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <TrendingUp className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Penggunaan</p>
                            <p className="text-2xl font-bold">{usageHistory.length}x</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Users className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Diskon Diberikan</p>
                            <p className="text-2xl font-bold">Rp {totalDiscounts.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Mode Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setViewMode('coupons')}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                        viewMode === 'coupons'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    Kelola Kupon
                </button>
                <button
                    onClick={() => setViewMode('history')}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                        viewMode === 'history'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    Riwayat Penggunaan
                </button>
            </div>

            {viewMode === 'coupons' ? (
                <div className="bg-white rounded-xl shadow-sm border">
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold">Daftar Kupon</h2>
                        <button
                            onClick={() => {
                                resetForm();
                                setIsModalOpen(true);
                            }}
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
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {coupon.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(coupon)}
                                                    className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coupon.id)}
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
                                            Belum ada kupon. Klik "Buat Kupon Baru" untuk memulai.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
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
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold">
                                {editingCoupon ? 'Edit Kupon' : 'Buat Kupon Baru'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                                        onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
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
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetForm();
                                    }}
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
            )}
        </div>
    );
}
