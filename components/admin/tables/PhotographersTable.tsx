import { Photographer } from '@/lib/types';

interface PhotographersTableProps {
    photographers: Photographer[];
    handleOpenAddPhotographerModal: () => void;
    handleOpenEditPhotographerModal: (photographer: Photographer) => void;
    handleDeletePhotographer: (id: string) => void;
    togglePhotographerActive: (id: string, active: boolean) => void;
}

export const PhotographersTable = ({
    photographers,
    handleOpenAddPhotographerModal,
    handleOpenEditPhotographerModal,
    handleDeletePhotographer,
    togglePhotographerActive
}: PhotographersTableProps) => {
    return (
        <div className="bg-white rounded-xl shadow overflow-hidden animate-in fade-in">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <span>📷</span> Manage Photographers
                </h3>
                <button onClick={handleOpenAddPhotographerModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    <span>➕</span> Add New Photographer
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Photographer Name</th>
                            <th className="px-6 py-3">Phone</th>
                            <th className="px-6 py-3">Specialty</th>
                            <th className="px-6 py-3 text-center">Active</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {photographers.length === 0 && (
                            <tr><td colSpan={5} className="text-center p-8 text-gray-400">No photographers found. Add one to get started!</td></tr>
                        )}
                        {photographers.map(photographer => (
                            <tr key={photographer.id} className="hover:bg-gray-50 group">
                                <td className="px-6 py-4 font-semibold">{photographer.name}</td>
                                <td className="px-6 py-4 text-gray-600">
                                    {photographer.phone || <span className="text-gray-300 italic">No phone</span>}
                                </td>
                                <td className="px-6 py-4">
                                    {photographer.specialty ? (
                                        <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">
                                            {photographer.specialty}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 text-xs italic">No specialty</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => togglePhotographerActive(photographer.id, !photographer.is_active)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${photographer.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        {photographer.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 transition-opacity">
                                        <button onClick={() => handleOpenEditPhotographerModal(photographer)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                            ✏️
                                        </button>
                                        <button onClick={() => handleDeletePhotographer(photographer.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
