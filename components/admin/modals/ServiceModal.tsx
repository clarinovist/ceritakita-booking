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
