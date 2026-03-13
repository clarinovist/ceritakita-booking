import React, { useState, useEffect } from 'react';
import { Freelancer, useFreelancers } from '../hooks/useFreelancers';
import { X, Check } from 'lucide-react';

interface Props {
    freelancer: Freelancer | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const FreelancerFormModal: React.FC<Props> = ({ freelancer, onClose, onSuccess }) => {
    const { createFreelancer, updateFreelancer } = useFreelancers();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        default_fee: '',
        is_active: true
    });

    useEffect(() => {
        if (freelancer) {
            setFormData({
                name: freelancer.name,
                phone: freelancer.phone || '',
                default_fee: freelancer.default_fee ? freelancer.default_fee.toString() : '',
                is_active: freelancer.is_active
            });
        }
    }, [freelancer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                phone: formData.phone || null,
                default_fee: formData.default_fee ? Number(formData.default_fee) : null,
                is_active: formData.is_active
            };

            if (freelancer) {
                await updateFreelancer(freelancer.id, payload);
            } else {
                await createFreelancer(payload);
            }
            onSuccess();
            onClose();
        } catch (error) {
            alert('Failed to save freelancer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">
                        {freelancer ? 'Edit Freelancer' : 'New Freelancer'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp / Phone</label>
                        <input
                            type="text"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Optional"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Default Fee (Rp)</label>
                        <input
                            type="number"
                            min="0"
                            value={formData.default_fee}
                            onChange={e => setFormData({ ...formData, default_fee: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Auto-filled when inputting jobs"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty if fee varies greatly</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.is_active}
                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="isActive" className="text-sm text-slate-700">Active (can be assigned to jobs)</label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                            {loading ? 'Saving...' : (
                                <>
                                    <Check size={16} />
                                    Save Profile
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
