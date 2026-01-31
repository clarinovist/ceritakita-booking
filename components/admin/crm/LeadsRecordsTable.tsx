'use client';

import React from 'react';
import { Lead } from '@/lib/types';
import { Phone, Mail, MoreHorizontal, User as UserIcon, MessageCircle } from 'lucide-react';
import { getLeadStatusColor } from '@/lib/types/leads';

interface LeadsRecordsTableProps {
    leads: Lead[];
    onSelectLead: (lead: Lead) => void;
    onDeleteLead: (id: string) => void;
    onConvertToBooking: (lead: Lead) => void;
    isLoading: boolean;
}

// Utility to generate a pseudo-random lead score for UI demonstration
const getLeadScore = (lead: Lead) => {
    // New leads have high potential, Won leads are 100%, Lost are 0%
    if (lead.status === 'Won' || lead.status === 'Converted') return 100;
    if (lead.status === 'Lost') return 0;

    // Seeded pseudo-random based on id
    const seed = lead.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 20 + (seed % 75); // Range 20-95
};

export function LeadsRecordsTable({ leads, onSelectLead, onDeleteLead, onConvertToBooking, isLoading }: LeadsRecordsTableProps) {
    const [openDropdownId, setOpenDropdownId] = React.useState<string | null>(null);

    // Close dropdown on click outside
    React.useEffect(() => {
        const handleClickOutside = () => setOpenDropdownId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-medium">Memuat data records...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-w-[1000px]">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                        <th className="p-4 w-10">
                            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        </th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Information</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contacts</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Stage</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Score</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Agents</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {leads.map((lead) => {
                        const score = getLeadScore(lead);
                        const progressColor = score > 70 ? 'bg-blue-600' : score > 40 ? 'bg-indigo-500' : 'bg-slate-300';

                        return (
                            <tr
                                key={lead.id}
                                className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                                onClick={() => onSelectLead(lead)}
                            >
                                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                </td>

                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                                            <span className="text-slate-500 font-bold text-sm">{lead.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm leading-none mb-1">{lead.name}</div>
                                            <div className="text-[11px] text-slate-400 font-medium">Created {new Date(lead.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                        </div>
                                    </div>
                                </td>

                                <td className="p-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[13px] text-slate-600">
                                            <Mail size={12} className="text-slate-300" />
                                            {lead.email || '—'}
                                        </div>
                                        <div className="flex items-center gap-2 text-[13px] text-slate-600">
                                            <Phone size={12} className="text-slate-300" />
                                            {lead.whatsapp}
                                        </div>
                                    </div>
                                </td>

                                <td className="p-4">
                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm ring-1 ring-inset ring-black/5 ${getLeadStatusColor(lead.status)}`}>
                                        {lead.status}
                                    </span>
                                </td>

                                <td className="p-4 w-40">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${progressColor} transition-all duration-1000`}
                                                style={{ width: `${score}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 w-8">{score}%</span>
                                    </div>
                                </td>

                                <td className="p-4">
                                    <div className="flex -space-x-2">
                                        {lead.assigned_to ? (
                                            <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm" title={`Assigned to ${lead.assigned_to}`}>
                                                {lead.assigned_to.charAt(0).toUpperCase()}
                                            </div>
                                        ) : (
                                            <button className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white border-dashed flex items-center justify-center hover:bg-slate-100 transition-colors group/add" title="Assign Agent">
                                                <UserIcon size={12} className="text-slate-300 group-hover:text-slate-500" />
                                            </button>
                                        )}
                                    </div>
                                </td>

                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="relative flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => window.open(`https://wa.me/${lead.whatsapp}`, '_blank')}
                                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title="WhatsApp"
                                        >
                                            <MessageCircle size={18} />
                                        </button>

                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdownId(openDropdownId === lead.id ? null : lead.id);
                                                }}
                                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {openDropdownId === lead.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <button
                                                        onClick={() => onSelectLead(lead)}
                                                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                    >
                                                        Detail & Edit
                                                    </button>
                                                    {lead.status === 'Won' && !lead.booking_id && (
                                                        <button
                                                            onClick={() => onConvertToBooking(lead)}
                                                            className="w-full text-left px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                                        >
                                                            Convert to Booking
                                                        </button>
                                                    )}
                                                    <div className="my-1 border-t border-slate-100"></div>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Hapus lead ${lead.name}?`)) onDeleteLead(lead.id);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                                    >
                                                        Hapus Lead
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Pagination Mockup */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Showing 1 to {leads.length} of {leads.length} Records
                </div>
                <div className="flex items-center gap-1">
                    <button className="px-3 py-1.5 text-xs font-bold text-slate-400 cursor-not-allowed">Previous</button>
                    <button className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg shadow-sm shadow-blue-500/20">1</button>
                    <button className="px-3 py-1.5 text-xs font-bold text-slate-400 cursor-not-allowed">Next</button>
                </div>
            </div>
        </div>
    );
}
