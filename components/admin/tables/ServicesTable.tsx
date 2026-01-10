import { Service } from '@/lib/storage';

interface ServicesTableProps {
    services: Service[];
    handleOpenAddModal: () => void;
    handleOpenEditModal: (service: Service) => void;
    handleDeleteService: (id: string) => void;
    toggleServiceActive: (id: string, active: boolean) => void;
}

export const ServicesTable = ({
    services,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDeleteService,
    toggleServiceActive
}: ServicesTableProps) => {
    return (
        <div className="bg-white rounded-xl shadow overflow-hidden animate-in fade-in">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <span>🏷️</span> Manage Services & Pricing
                </h3>
                <button onClick={handleOpenAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    <span>➕</span> Add New Service
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Service Name</th>
                            <th className="px-6 py-3">Badge Info</th>
                            <th className="px-6 py-3">Base Price (Rp)</th>
                            <th className="px-6 py-3">Discount (Rp)</th>
                            <th className="px-6 py-3">Final Price</th>
                            <th className="px-6 py-3 text-center">Active</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {services.map(service => (
                            <tr key={service.id} className="hover:bg-gray-50 group">
                                <td className="px-6 py-4 font-semibold">{service.name}</td>
                                <td className="px-6 py-4">
                                    {service.badgeText ? (
                                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                            {service.badgeText}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 text-xs italic">No Badge</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    Rp {service.basePrice.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-red-500 font-medium">
                                    - Rp {service.discountValue.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 font-black text-gray-900">
                                    Rp {(service.basePrice - service.discountValue).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => toggleServiceActive(service.id, !service.isActive)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${service.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        {service.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 transition-opacity">
                                        <button onClick={() => handleOpenEditModal(service)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                            ✏️
                                        </button>
                                        <button onClick={() => handleDeleteService(service.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
