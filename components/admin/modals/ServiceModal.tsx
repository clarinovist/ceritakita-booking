import { XCircle, Save } from 'lucide-react';
import { ServiceFormData } from '@/lib/types';

interface Service {
    id: string;
    name: string;
    badgeText?: string;
    basePrice: number;
    discountValue: number;
    isActive: boolean;
}

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    editingService: Service | null;
    formData: ServiceFormData;
    setFormData: (data: ServiceFormData) => void;
}

export const ServiceModal = ({
    isOpen,
    onClose,
    onSubmit,
    editingService,
    formData,
    setFormData
}: ServiceModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold">{editingService ? 'Edit Service' : 'Add New Service'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500">
                        <XCircle size={24} />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Service Name</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Seasonal Promo"
                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Badge Info (e.g. Best Deal)</label>
                        <input
                            type="text"
                            value={formData.badgeText}
                            onChange={e => setFormData({ ...formData, badgeText: e.target.value })}
                            placeholder="Empty if no badge"
                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Base Price (Rp)</label>
                            <input
                                required
                                type="number"
                                value={formData.basePrice}
                                onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Discount (Rp)</label>
                            <input
                                required
                                type="number"
                                value={formData.discountValue}
                                onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-red-600 font-medium"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.isActive}
                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded"
                        />
                        <label htmlFor="is_active" className="text-sm font-bold text-gray-700 cursor-pointer">Service is Active</label>
                    </div>

                    <div className="border-t pt-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Benefits (Max 5)</label>
                        <div className="space-y-2 mb-3">
                            {formData.benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
                                    <span className="flex-1 text-sm">{benefit}</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            benefits: formData.benefits.filter((_, i) => i !== index)
                                        })}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            ))}
                            {formData.benefits.length === 0 && (
                                <p className="text-xs text-gray-400 italic">No benefits added yet</p>
                            )}
                        </div>

                        {formData.benefits.length < 5 && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    id="new-benefit-input"
                                    placeholder="Add a benefit..."
                                    className="flex-1 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const input = e.currentTarget;
                                            const val = input.value.trim();
                                            if (val && formData.benefits.length < 5) {
                                                setFormData({
                                                    ...formData,
                                                    benefits: [...formData.benefits, val]
                                                });
                                                input.value = '';
                                            }
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const input = document.getElementById('new-benefit-input') as HTMLInputElement;
                                        const val = input.value.trim();
                                        if (val && formData.benefits.length < 5) {
                                            setFormData({
                                                ...formData,
                                                benefits: [...formData.benefits, val]
                                            });
                                            input.value = '';
                                        }
                                    }}
                                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold"
                                >
                                    Add
                                </button>
                            </div>
                        )}
                        <p className="text-[10px] text-gray-500 mt-2 italic">* Press Enter or click Add to save a benefit</p>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-2">
                            <Save size={18} />
                            {editingService ? 'Update Service' : 'Create Service'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
