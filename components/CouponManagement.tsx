'use client';

import { useState, useEffect } from 'react';
import { Tag, TrendingUp, Users } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/fetch';
import { CouponTable, Coupon, CouponUsage } from './coupon/CouponTable';
import { CouponModals } from './coupon/CouponModals';

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
            const data = await apiGet<Coupon[]>('/api/coupons');
            setCoupons(data);
        } catch (error) {
            console.error('Error fetching coupons:', error);
        }
    };

    const fetchUsageHistory = async () => {
        try {
            const data = await apiGet<CouponUsage[]>('/api/coupons/usage');
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

            if (editingCoupon) {
                await apiPut('/api/coupons', payload);
            } else {
                await apiPost('/api/coupons', payload);
            }

            await fetchCoupons();
            setIsModalOpen(false);
            resetForm();
            alert(editingCoupon ? 'Kupon berhasil diupdate!' : 'Kupon berhasil dibuat!');
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Unknown error');
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
            await apiDelete(`/api/coupons?id=${id}`);
            await fetchCoupons();
            alert('Kupon berhasil dihapus!');
        } catch {
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
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${viewMode === 'coupons'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    Kelola Kupon
                </button>
                <button
                    onClick={() => setViewMode('history')}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${viewMode === 'history'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    Riwayat Penggunaan
                </button>
            </div>

            {/* Coupon Table Presenter */}
            <CouponTable
                viewMode={viewMode}
                coupons={coupons}
                usageHistory={usageHistory}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCreateClick={() => {
                    resetForm();
                    setIsModalOpen(true);
                }}
            />

            {/* Create/Edit Modal Presenter */}
            <CouponModals
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    resetForm();
                }}
                editingCoupon={editingCoupon}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
