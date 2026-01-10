import { Addon } from '@/lib/types';

interface AddonsTableProps {
    addons: Addon[];
    services: any[];
    handleOpenAddAddonModal: () => void;
    handleOpenEditAddonModal: (addon: Addon) => void;
    handleDeleteAddon: (id: string) => void;
    toggleAddonActive: (id: string, active: boolean) => void;
}

export const AddonsTable = ({
    addons,
    handleOpenAddAddonModal,
    handleOpenEditAddonModal,
    handleDeleteAddon,
    toggleAddonActive
}: AddonsTableProps) => {
    return (
        <div className="bg-white rounded-xl shadow overflow-hidden animate-in fade-in">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <span>🛍️</span> Manage Add-ons
                </h3>
                <button onClick={handleOpenAddAddonModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    <span>➕</span> Add New Add-on
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Add-on Name</th>
                            <th className="px-6 py-3">Price (Rp)</th>
                            <th className="px-6 py-3">Applicable To</th>
                            <th className="px-6 py-3 text-center">Active</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {addons.length === 0 && (
                            <tr><td colSpan={5} className="text-center p-8 text-gray-400">No add-ons found. Add one to get started!</td></tr>
                        )}
                        {addons.map(addon => (
                            <tr key={addon.id} className="hover:bg-gray-50 group">
                                <td className="px-6 py-4 font-semibold">{addon.name}</td>
                                <td className="px-6 py-4 text-green-600 font-bold">
                                    Rp {addon.price.toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    {addon.applicable_categories && addon.applicable_categories.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {addon.applicable_categories.map(cat => (
                                                <span key={cat} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xs italic">All Categories</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => toggleAddonActive(addon.id, !addon.is_active)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${addon.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        {addon.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 transition-opacity">
                                        <button onClick={() => handleOpenEditAddonModal(addon)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                            ✏️
                                        </button>
                                        <button onClick={() => handleDeleteAddon(addon.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
