import { XCircle, Save, Loader2, AlertCircle } from 'lucide-react';
import { Service, ServiceFormData } from '@/lib/types';

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    editingService: Service | null;
    formData: ServiceFormData;
    setFormData: (data: ServiceFormData) => void;
    loading?: boolean;
    error?: string | null;
}

export const ServiceModal = ({
    isOpen,
    onClose,
    onSubmit,
    editingService,
    formData,
    setFormData,
    loading = false,
    error = null
}: ServiceModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-4 md:p-6 border-b flex justify-between items-center bg-gray-50 flex-none">
                    <h2 className="text-lg md:text-xl font-bold">{editingService ? 'Edit Service' : 'Add New Service'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-2" disabled={loading}>
                        <XCircle size={24} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-4 md:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                    {/* Error Display */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                            <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Service Name</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Seasonal Promo"
                            className="w-full py-2.5 px-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base md:text-sm min-h-[44px]"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Badge Info (e.g. Best Deal)</label>
                        <input
                            type="text"
                            value={formData.badgeText}
                            onChange={e => setFormData({ ...formData, badgeText: e.target.value })}
                            placeholder="Empty if no badge"
                            className="w-full py-2.5 px-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base md:text-sm min-h-[44px]"
                            disabled={loading}
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
                                className="w-full py-2.5 px-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base md:text-sm min-h-[44px]"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Discount (Rp)</label>
                            <input
                                required
                                type="number"
                                value={formData.discountValue}
                                onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                                className="w-full py-2.5 px-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base md:text-sm text-red-600 font-bold min-h-[44px]"
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.isActive}
                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-6 h-6 text-blue-600 rounded cursor-pointer"
                            disabled={loading}
                        />
                        <label htmlFor="is_active" className="text-sm font-bold text-gray-700 cursor-pointer">Service is Active</label>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-700">Benefits ({formData.benefits.length}/5)</label>
                            {formData.benefits.length >= 5 && (
                                <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">Limit Reached</span>
                            )}
                        </div>
                        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1 flex flex-col gap-1">
                            {formData.benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border group animate-in slide-in-from-left-2 transition-all">
                                    <span className="flex-1 text-sm font-medium">{benefit}</span>
                                    {!loading && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({
                                                ...formData,
                                                benefits: formData.benefits.filter((_, i) => i !== index)
                                            })}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                        >
                                            <XCircle size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {formData.benefits.length === 0 && (
                                <p className="text-xs text-gray-400 italic py-2 text-center">No benefits added yet</p>
                            )}
                        </div>

                        {formData.benefits.length < 5 && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    id="new-benefit-input"
                                    placeholder="Add a benefit..."
                                    className="flex-1 py-2.5 px-3 text-base md:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[44px]"
                                    disabled={loading}
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
                                    disabled={loading}
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
                                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 min-h-[44px] border border-blue-100"
                                >
                                    Add
                                </button>
                            </div>
                        )}
                        <p className="text-[10px] text-gray-500 mt-2 italic font-medium">* Press Enter or click Add to save a benefit</p>
                    </div>

                    <div className="pt-4 flex gap-3 flex-none sticky bottom-0 bg-white md:bg-transparent pb-2 md:pb-0">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-3.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 min-h-[48px]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed min-h-[48px]"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            {loading ? 'Processing...' : (editingService ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
