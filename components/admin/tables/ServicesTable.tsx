import { Service } from '@/lib/types';

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
                    <span>🏷️</span> <span className="hidden sm:inline">Manage Services & Pricing</span><span className="sm:hidden text-sm">Services</span>
                </h3>
                <button
                    onClick={handleOpenAddModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 min-h-[44px]"
                >
                    <span>➕</span> <span className="hidden xs:inline">Add New</span>
                </button>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden grid grid-cols-1 divide-y">
                {services.map(service => (
                    <div key={service.id} className="p-4 space-y-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <h4 className="font-bold text-gray-900">{service.name}</h4>
                                {service.badgeText && (
                                    <span className="inline-block bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                        {service.badgeText}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleOpenEditModal(service)}
                                    className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center border border-gray-100"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => handleDeleteService(service.id)}
                                    className="p-3 text-red-600 hover:bg-red-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center border border-gray-100"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-gray-500 text-xs uppercase font-bold tracking-tight">Pricing</span>
                                <div className="font-bold text-gray-900">Rp {(service.basePrice - service.discountValue).toLocaleString()}</div>
                                <div className="text-gray-400 text-[10px] line-through">Rp {service.basePrice.toLocaleString()}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-500 text-xs uppercase font-bold tracking-tight">Status</span>
                                <div>
                                    <button
                                        onClick={() => toggleServiceActive(service.id, !service.isActive)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors min-h-[32px] w-full ${service.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                                    >
                                        {service.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {service.benefits && service.benefits.length > 0 && (
                            <div className="pt-2 border-t flex flex-wrap gap-1">
                                {service.benefits.map((benefit, idx) => (
                                    <span key={idx} className="bg-gray-50 text-gray-600 text-[10px] px-2 py-0.5 rounded border border-gray-100">
                                        {benefit}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Service Name</th>
                            <th className="px-6 py-3">Badge Info</th>
                            <th className="px-6 py-3">Base Price (Rp)</th>
                            <th className="px-6 py-3">Discount (Rp)</th>
                            <th className="px-6 py-3">Final Price</th>
                            <th className="px-6 py-3 text-center">Active</th>
                            <th className="px-6 py-3">Benefits</th>
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
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors min-h-[32px] ${service.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        {service.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${service.benefits && service.benefits.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                                        {service.benefits?.length || 0} items
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 transition-opacity">
                                        <button onClick={() => handleOpenEditModal(service)} className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg min-h-[44px]">
                                            ✏️
                                        </button>
                                        <button onClick={() => handleDeleteService(service.id)} className="p-3 text-red-600 hover:bg-red-50 rounded-lg min-h-[44px]">
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
