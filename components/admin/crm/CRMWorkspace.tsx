'use client';

import React, { useState, useEffect } from 'react';
import { LeadDetailPanel } from './LeadDetailPanel';
import { LeadsRecordsTable } from './LeadsRecordsTable';
import { ArrowLeft, Users, Search, SlidersHorizontal, Sparkles, Plus, X, ListFilter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Lead } from '@/lib/types';
import { calculateCRMStats } from '@/lib/crm-utils';

export type SortBy = 'date' | 'name' | 'age' | 'status';

export default function CRMWorkspace() {
    const router = useRouter();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [sortBy, setSortBy] = useState<SortBy>('date');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [filterSource, setFilterSource] = useState<string>('All');
    const [showFilters, setShowFilters] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch leads
    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/leads?limit=100'); // Higher limit for CRM view
            if (res.ok) {
                const data = await res.json();
                const leadsData = 'data' in data ? data.data : data;
                setLeads(leadsData);
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLeadSelect = (lead: Lead) => {
        setSelectedLead(lead);
    };

    // When updating from detailed panel, refresh data
    const handleLeadUpdate = () => {
        fetchLeads();
    };

    const handleDeleteLead = async (id: string) => {
        try {
            await fetch(`/api/leads/${id}`, { method: 'DELETE' });
            fetchLeads();
            if (selectedLead?.id === id) setSelectedLead(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateLead = () => {
        setSelectedLead({
            id: 'new',
            name: '',
            whatsapp: '',
            status: 'New',
            source: 'Organic',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        } as any);
    };

    const handleConvertToBooking = (lead: Lead) => {
        // Placeholder for conversion logic
        alert(`Converting ${lead.name} to booking...`);
    };

    const stats = calculateCRMStats(leads);

    // Filter and Sort Logic (Client Side)
    const filteredLeads = React.useMemo(() => {
        let result = leads.filter(l =>
            (l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (l.email && l.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                l.whatsapp.includes(searchQuery)) &&
            (filterStatus === 'All' || l.status === filterStatus) &&
            (filterSource === 'All' || l.source === filterSource)
        );

        const sorted = [...result];
        switch (sortBy) {
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'age':
                // In a real app we'd calculate hot/warm based on activity
                return sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
            case 'status':
                return sorted.sort((a, b) => a.status.localeCompare(b.status));
            case 'date':
            default:
                return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
    }, [leads, searchQuery, sortBy, filterStatus, filterSource]);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
            {/* Master Panel */}
            <div className={`flex flex-col ${selectedLead ? 'w-full md:w-96' : 'w-full'} border-r border-slate-200 bg-white transition-all duration-300 ease-in-out shrink-0 h-full shadow-lg z-10`}>
                {/* Header */}
                <div className="p-6 border-b border-slate-200 bg-slate-50/50 shrink-0">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => router.push('/admin')}
                            className="group flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <div className="p-1.5 rounded-full bg-white border border-slate-200 group-hover:border-slate-400 transition-colors">
                                <ArrowLeft size={14} />
                            </div>
                            Kembali
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-1 px-3 py-1.5">
                                    <ListFilter size={14} className="text-slate-400" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">Sort by:</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                                        className="text-xs font-bold text-blue-600 bg-transparent outline-none cursor-pointer hover:text-blue-700 transition-colors"
                                    >
                                        <option value="date">Terbaru</option>
                                        <option value="name">Nama (A-Z)</option>
                                        <option value="age">Suhu (Hot)</option>
                                        <option value="status">Status</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CRM Workspace</h1>
                            <p className="text-sm text-slate-500 mt-1">Kelola data dan prospek klien Studio.</p>
                        </div>
                        <div className="hidden lg:flex items-center gap-4 bg-slate-100/50 px-4 py-2 rounded-2xl border border-slate-200/50">
                            <div className="text-center px-3 border-r border-slate-200">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                                <p className="text-xs font-bold text-slate-700">{stats.totalLeads}</p>
                            </div>
                            <div className="text-center px-3 border-r border-slate-200">
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Baru</p>
                                <p className="text-xs font-bold text-blue-600">{stats.newInquiries}</p>
                            </div>
                            <div className="text-center px-3">
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Win Rate</p>
                                <p className="text-xs font-bold text-emerald-600">{stats.conversionRate}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50/30 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <div className="p-6">
                        {/* SaaS Header Implementation */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                                    Contacts /
                                    <span className="text-slate-600">Records</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Records</h1>
                                    <button className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-400">
                                        <SlidersHorizontal size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => alert('AI Insight: Probability lead Won adalah 75% berdasarkan aktivitas chat terakhir.')}
                                    className="flex items-center gap-2 bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    <Sparkles size={16} />
                                    Ask AI
                                </button>
                                <button
                                    onClick={handleCreateLead}
                                    className="flex items-center gap-2 bg-slate-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-[0.98]"
                                >
                                    <Plus size={16} />
                                    Add Records
                                </button>
                            </div>
                        </div>

                        {/* SaaS Search & Filter Row */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="relative flex-1 max-w-md">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search name, email, phone, or address"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-sm"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm border ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <SlidersHorizontal size={16} />
                                Filters
                            </button>
                        </div>

                        {/* Filter Bar */}
                        {showFilters && (
                            <div className="flex flex-wrap gap-4 p-4 bg-white border border-slate-200 rounded-2xl mb-6 shadow-sm animate-in slide-in-from-top-2 duration-300 pointer-events-auto">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="block w-40 text-xs font-bold text-slate-700 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="All">Semua Status</option>
                                        <option value="New">Baru</option>
                                        <option value="Contacted">Dihubungi</option>
                                        <option value="Follow Up">Follow Up</option>
                                        <option value="Won">Won</option>
                                        <option value="Lost">Lost</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sumber</label>
                                    <select
                                        value={filterSource}
                                        onChange={(e) => setFilterSource(e.target.value)}
                                        className="block w-40 text-xs font-bold text-slate-700 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="All">Semua Sumber</option>
                                        <option value="Meta Ads">Meta Ads</option>
                                        <option value="Instagram">Instagram</option>
                                        <option value="WhatsApp">WhatsApp</option>
                                        <option value="Organic">Organic</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => { setFilterStatus('All'); setFilterSource('All'); }}
                                    className="self-end px-3 py-2 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        )}

                        <LeadsRecordsTable
                            leads={filteredLeads}
                            onSelectLead={handleLeadSelect}
                            onDeleteLead={handleDeleteLead}
                            onConvertToBooking={handleConvertToBooking}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            </div>

            {/* Detail Panel - Visible when a lead is selected */}
            {selectedLead && (
                <div className="flex-1 overflow-y-auto h-full border-l border-slate-200 absolute md:static inset-0 bg-white z-20 md:z-0 animate-slide-up md:animate-none max-w-md shadow-2xl md:shadow-none">
                    <LeadDetailPanel
                        lead={selectedLead}
                        onClose={() => setSelectedLead(null)}
                        onUpdate={handleLeadUpdate}
                    />
                </div>
            )}

            {/* Empty State / Placeholder (only visible on desktop when no lead selected) */}
            {!selectedLead && (
                <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('/images/pattern-noise.png')]"></div>
                    <div className="text-center p-8 max-w-md relative z-10">
                        <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-200">
                            <Users className="w-10 h-10 text-slate-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Pilih Data Klien</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Pilih salah satu baris di panel sebelah kanan untuk melihat detail prospek dan riwayat interaksi mereka.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
