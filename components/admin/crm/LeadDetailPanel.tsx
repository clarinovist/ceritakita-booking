'use client';

import React, { useState } from 'react';
import { Lead, LeadInteraction, InteractionType } from '@/lib/types';
import { X, MessageCircle, Phone, Mail, FileText, Send, ExternalLink } from 'lucide-react';
import useSWR from 'swr';

interface LeadDetailPanelProps {
    lead: Lead;
    onClose: () => void;
    onUpdate: () => void;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function LeadDetailPanel({ lead, onClose, onUpdate }: LeadDetailPanelProps) {
    const [interactionType, setInteractionType] = useState<InteractionType>('WhatsApp');
    const [interactionContent, setInteractionContent] = useState('');
    const [sendToMeta, setSendToMeta] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // useSWR key includes lead.id to auto-refresh on lead change
    const { data: interactions, mutate } = useSWR<LeadInteraction[]>(
        lead ? `/api/leads/${lead.id}/interactions` : null,
        fetcher
    );

    const handleLogInteraction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!interactionContent.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/leads/${lead.id}/interactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    interaction_type: interactionType,
                    interaction_content: interactionContent,
                    send_to_meta: sendToMeta
                })
            });

            if (res.ok) {
                setInteractionContent('');
                mutate(); // Refresh interactions
                onUpdate(); // Refresh leads list
            } else {
                alert('Gagal menyimpan log interaksi');
            }
        } catch (error) {
            console.error('Error logging interaction:', error);
            alert('Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getInteractionIcon = (type: InteractionType) => {
        switch (type) {
            case 'WhatsApp': return <MessageCircle size={16} className="text-green-600" />;
            case 'Phone': return <Phone size={16} className="text-blue-600" />;
            case 'Email': return <Mail size={16} className="text-purple-600" />;
            case 'Note': return <FileText size={16} className="text-olive-600" />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-white shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{lead.name}</h2>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <a
                                href={`https://wa.me/${lead.whatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                            >
                                <Phone size={14} />
                                {lead.whatsapp}
                                <ExternalLink size={12} className="opacity-50" />
                            </a>
                            {lead.email && (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                    <Mail size={14} className="opacity-50" />
                                    {lead.email}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2 rounded-xl transition-all shadow-sm active:scale-95"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-blue-50 text-blue-800 border border-blue-200 rounded-xl p-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Status</span>
                        <p className="mt-0.5 font-bold">{lead.status}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Source</span>
                        <p className="font-bold text-slate-900 mt-0.5">{lead.source}</p>
                    </div>
                </div>
            </div>

            {/* Interactions Timeline */}
            <div className="flex-1 overflow-y-auto p-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 opacity-60">Riwayat Aktivitas</h3>

                {interactions && interactions.length > 0 ? (
                    <div className="relative pl-6 border-l border-slate-200 space-y-8 ml-2">
                        {interactions.map((interaction) => (
                            <div key={interaction.id} className="relative">
                                {/* Timeline Dot/Icon */}
                                <div className="absolute -left-[35px] top-0 bg-white p-1.5 rounded-full border border-slate-200 z-10 shadow-sm">
                                    {getInteractionIcon(interaction.interaction_type)}
                                </div>

                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 group">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-slate-900 text-sm tracking-tight">{interaction.interaction_type}</span>
                                        <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                            {new Date(interaction.created_at).toLocaleString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed font-sans">
                                        {interaction.interaction_content}
                                    </p>
                                    {interaction.meta_event_sent && (
                                        <div className="mt-3 flex items-center gap-1.5">
                                            <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100 font-bold uppercase tracking-tighter">
                                                ✓ Data Sent to Meta
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-slate-400 text-sm italic">Belum ada aktivitas tercatat.</p>
                    </div>
                )}
            </div>

            {/* Log Interaction Form */}
            <div className="p-6 border-t border-slate-200 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 opacity-60">Update Progres</h3>
                <form onSubmit={handleLogInteraction} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wide">Alur Interaksi</label>
                        <select
                            value={interactionType}
                            onChange={(e) => setInteractionType(e.target.value as InteractionType)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        >
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Phone">Telepon</option>
                            <option value="Email">Email</option>
                            <option value="Note">Internal Note</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wide">Detail Percakapan</label>
                        <textarea
                            value={interactionContent}
                            onChange={(e) => setInteractionContent(e.target.value)}
                            placeholder="Apa hasil percakapan Anda?"
                            rows={4}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all"
                            required
                        />
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={sendToMeta}
                                onChange={(e) => setSendToMeta(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                        </div>
                        <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">Optimasi Iklan (Kirim ke Meta CAPI)</span>
                    </label>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={16} />
                        {isSubmitting ? 'Menyimpan...' : 'Simpan Update'}
                    </button>
                </form>
            </div>
        </div>
    );
}
