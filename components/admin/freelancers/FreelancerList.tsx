import React, { useEffect } from 'react';
import { useFreelancers, Freelancer } from '../hooks/useFreelancers';
import { Plus, Trash2, Edit2, Info } from 'lucide-react';
import { FreelancerFormModal } from './FreelancerFormModal';
import { FreelancerDetailModal } from './FreelancerDetailModal';

export const FreelancerList = () => {
    const {
        freelancers,
        loading,
        fetchFreelancers,
        deleteFreelancer,
        isFormModalOpen,
        setIsFormModalOpen,
        isDetailModalOpen,
        setIsDetailModalOpen,
        selectedFreelancer,
        setSelectedFreelancer
    } = useFreelancers();

    useEffect(() => {
        fetchFreelancers();
    }, [fetchFreelancers]);

    const handleEdit = (freelancer: Freelancer) => {
        setSelectedFreelancer(freelancer);
        setIsFormModalOpen(true);
    };

    const handleViewDetails = (freelancer: Freelancer) => {
        setSelectedFreelancer(freelancer);
        setIsDetailModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedFreelancer(null);
        setIsFormModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this freelancer? All their job history will also be permanently deleted.')) {
            await deleteFreelancer(id);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Freelancer Database</h3>
                    <p className="text-sm text-slate-500">Manage freelancer profiles and default fees</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus size={16} />
                    Add Freelancer
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Phone</th>
                            <th className="px-4 py-3 text-right">Default Fee</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-4 text-center text-slate-500">Loading freelancers...</td></tr>
                        ) : freelancers.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center text-slate-500">No freelancers registered yet.</td></tr>
                        ) : (
                            freelancers.map((person) => (
                                <tr key={person.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-800">{person.name}</td>
                                    <td className="px-4 py-3 text-slate-600">{person.phone || '-'}</td>
                                    <td className="px-4 py-3 text-right text-slate-800 font-medium">
                                        {person.default_fee ? `Rp ${person.default_fee.toLocaleString('id-ID')}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            person.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {person.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleViewDetails(person)}
                                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                title="View History"
                                            >
                                                <Info size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(person)}
                                                className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(person.id)}
                                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isFormModalOpen && (
                <FreelancerFormModal 
                    freelancer={selectedFreelancer} 
                    onClose={() => setIsFormModalOpen(false)} 
                    onSuccess={fetchFreelancers} 
                />
            )}

            {isDetailModalOpen && selectedFreelancer && (
                <FreelancerDetailModal 
                    freelancer={selectedFreelancer} 
                    onClose={() => setIsDetailModalOpen(false)} 
                />
            )}
        </div>
    );
};
