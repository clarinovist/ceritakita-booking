import React, { useState, useEffect } from 'react';
import { useFreelancers } from '../hooks/useFreelancers';
import { useBookings } from '../hooks/useBookings';
import { Check, Calendar } from 'lucide-react';

export const FreelancerJobInput = () => {
    const { freelancers, roles, fetchFreelancers, fetchRoles, createJob } = useFreelancers();
    // We can fetch active bookings to link jobs to specific projects if needed
    const { bookings, fetchData: fetchBookings } = useBookings();
    
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    
    // Initial form state
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        work_date: today,
        freelancer_id: '',
        role_id: '',
        booking_id: '',
        fee: '', // String to allow empty input, converted to number on submit
        notes: ''
    });

    useEffect(() => {
        fetchFreelancers(true); // Only active freelancers
        fetchRoles(true);       // Only active roles
        fetchBookings();
    }, [fetchFreelancers, fetchRoles, fetchBookings]);

    // Format active bookings for dropdown (only Active or Completed bookings)
    const activeBookings = bookings
        .filter(b => b.status !== 'Cancelled')
        .sort((a, b) => new Date(b.booking.date).getTime() - new Date(a.booking.date).getTime())
        .map(b => ({
            id: b.id,
            label: `${new Date(b.booking.date).toLocaleDateString('id-ID')} - ${b.customer.name} (${b.customer.category})`
        }));

    // Auto-fill fee when freelancer or role changes (prioritizing freelancer's default fee)
    useEffect(() => {
        if (formData.freelancer_id) {
            const selectedPerson = freelancers.find(f => f.id === formData.freelancer_id);
            if (selectedPerson && selectedPerson.default_fee) {
                // Only auto-fill if the user hasn't manually entered a fee yet
                // Or if we decide to aggressively overwrite, we can just set it. 
                // Let's aggressively set it for convenience, but the user can change it after.
                setFormData(prev => ({ ...prev, fee: selectedPerson.default_fee!.toString() }));
            }
        }
    }, [formData.freelancer_id, freelancers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg('');
        
        try {
            await createJob({
                freelancer_id: formData.freelancer_id,
                role_id: formData.role_id,
                booking_id: formData.booking_id || null, // Optional
                work_date: formData.work_date,
                fee: Number(formData.fee),
                notes: formData.notes
            });
            
            setSuccessMsg('Job successfully recorded!');
            
            // Reset form but keep the date for faster consecutive inputs
            setFormData({
                work_date: formData.work_date,
                freelancer_id: '',
                role_id: '',
                booking_id: '',
                fee: '',
                notes: ''
            });
            
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to record job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
            <div className="mb-8 border-b pb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="text-blue-600" /> Input Job Attendance
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                    Record a freelancer&apos;s work session. Fees are auto-calculated for the monthly recap.
                </p>
            </div>

            {successMsg && (
                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center gap-2 font-medium animate-in fade-in slide-in-from-top-2">
                    <Check size={18} /> {successMsg}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Work Date <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            required
                            value={formData.work_date}
                            onChange={e => setFormData({ ...formData, work_date: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                        />
                    </div>

                    {/* Booking / Project (Optional) */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Project / Booking <span className="font-normal text-slate-400 text-xs">(Optional)</span></label>
                        <select
                            value={formData.booking_id}
                            onChange={e => setFormData({ ...formData, booking_id: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                        >
                            <option value="">-- No Specific Booking --</option>
                            {activeBookings.map(b => (
                                <option key={b.id} value={b.id}>{b.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Freelancer */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Freelancer <span className="text-red-500">*</span></label>
                        <select
                            required
                            value={formData.freelancer_id}
                            onChange={e => setFormData({ ...formData, freelancer_id: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                        >
                            <option value="">Select Freelancer...</option>
                            {freelancers.map(f => (
                                <option key={f.id} value={f.id}>{f.name} {f.default_fee ? `(Default: Rp ${f.default_fee.toLocaleString()})` : ''}</option>
                            ))}
                        </select>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Role for this Job <span className="text-red-500">*</span></label>
                        <select
                            required
                            value={formData.role_id}
                            onChange={e => setFormData({ ...formData, role_id: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                        >
                            <option value="">Select Role...</option>
                            {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.name} ({r.short_code})</option>
                            ))}
                        </select>
                    </div>

                    {/* Fee */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Fee (Rp) <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-4 top-2.5 text-slate-500">Rp</span>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.fee}
                                onChange={e => setFormData({ ...formData, fee: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                                placeholder="0"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">You can edit this amount manually per-job.</p>
                    </div>

                    {/* Notes */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Notes <span className="font-normal text-slate-400 text-xs">(Optional)</span></label>
                        <input
                            type="text"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                            placeholder="e.g. Overtime session, Transport included"
                        />
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-8 py-3 rounded-lg font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 min-w-[200px]"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                <Check size={18} />
                                Record Job Entry
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
