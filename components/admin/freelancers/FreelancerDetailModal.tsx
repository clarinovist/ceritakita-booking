import React, { useEffect } from 'react';
import { Freelancer, useFreelancers } from '../hooks/useFreelancers';
import { X, Trash2 } from 'lucide-react';

interface Props {
    freelancer: Freelancer;
    onClose: () => void;
}

export const FreelancerDetailModal: React.FC<Props> = ({ freelancer, onClose }) => {
    const { jobs, loading, fetchJobs, deleteJob } = useFreelancers();

    useEffect(() => {
        fetchJobs(undefined, undefined, freelancer.id);
    }, [fetchJobs, freelancer.id]);

    const handleDeleteJob = async (jobId: string) => {
        if (confirm('Delete this job record? This will affect the monthly totals.')) {
            await deleteJob(jobId);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">{freelancer.name}&apos;s History</h3>
                        <p className="text-xs text-gray-500">All recorded jobs for this freelancer</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-white">
                    {loading ? (
                        <div className="text-center p-8 text-gray-500">Loading history...</div>
                    ) : jobs.length === 0 ? (
                        <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            No job history found for this freelancer.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <div className="text-blue-500 text-xs font-bold uppercase mb-1">Total Jobs</div>
                                    <div className="text-2xl font-black text-blue-900">{jobs.length}</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100 md:col-span-3">
                                    <div className="text-green-500 text-xs font-bold uppercase mb-1">Total Fees Earned</div>
                                    <div className="text-2xl font-black text-green-900">
                                        Rp {jobs.reduce((sum, job) => sum + job.fee, 0).toLocaleString('id-ID')}
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto border rounded-lg">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Role</th>
                                            <th className="px-4 py-3">Job / Booking</th>
                                            <th className="px-4 py-3 text-right">Fee</th>
                                            <th className="px-4 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {jobs.map((job) => (
                                            <tr key={job.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-2 font-mono text-xs">
                                                    {new Date(job.work_date).toLocaleDateString('id-ID', {
                                                        year: 'numeric', month: 'short', day: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                                                        {job.role_short_code || job.role_name}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="text-slate-800">{job.booking_customer_name || 'No Booking Link'}</div>
                                                    {job.notes && <div className="text-xs text-gray-500">{job.notes}</div>}
                                                </td>
                                                <td className="px-4 py-2 text-right font-medium text-slate-800">
                                                    Rp {job.fee.toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        onClick={() => handleDeleteJob(job.id)}
                                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete Job Record"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
