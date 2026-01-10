'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { ValueProposition } from '@/types/homepage';
import { Plus, Trash2, Pencil, Loader2, X, Search } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Helper to render dynamic icon safetly
const DynamicIcon = ({ name, size = 18, className }: { name: string; size?: number; className?: string }) => {
    // @ts-ignore
    const Icon = LucideIcons[name];
    if (!Icon) return <LucideIcons.HelpCircle size={size} className={className} />;
    return <Icon size={size} className={className} />;
};

export function ValuePropsTab() {
    const { data: items, isLoading } = useSWR<ValueProposition[]>('/api/admin/value-props', fetcher);
    const [editingItem, setEditingItem] = useState<ValueProposition | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const { register, handleSubmit, reset } = useForm<Partial<ValueProposition>>();

    const handleEdit = (item: ValueProposition) => {
        setEditingItem(item);
        setSubmitError(null);
        reset(item);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingItem(null);
        setSubmitError(null);
        reset({ icon: 'Camera', title: '', description: '', display_order: items ? items.length + 1 : 1, is_active: 1 });
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this value proposition?')) return;
        try {
            await fetch(`/api/admin/value-props/${id}`, { method: 'DELETE' });
            mutate('/api/admin/value-props');
        } catch (error) {
            alert('Failed to delete item');
        }
    };

    const onSubmit = async (data: Partial<ValueProposition>) => {
        setSubmitError(null);
        try {
            const url = editingItem ? `/api/admin/value-props/${editingItem.id}` : '/api/admin/value-props';
            const method = editingItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error('Failed to save');

            mutate('/api/admin/value-props');
            setIsFormOpen(false);
            reset();
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Failed to save item');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-display font-bold text-slate-800">Value Propositions</h3>
                    <p className="text-sm text-slate-500 mt-1">Highlight your unique selling points</p>
                </div>

                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 font-medium"
                >
                    <Plus size={18} />
                    Add Value Prop
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Icon</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {items?.map((item) => (
                            <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <DynamicIcon name={item.icon || 'HelpCircle'} size={20} />
                                    </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-slate-800">{item.title}</td>
                                <td className="px-6 py-5 text-sm text-slate-600 max-w-xs truncate">{item.description}</td>
                                <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-500 font-mono bg-slate-50 rounded-lg px-2 py-1 w-fit mx-6">{item.display_order}</td>
                                <td className="px-6 py-5 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!items || items.length === 0) && (
                            <tr>
                                <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                            <Search size={24} />
                                        </div>
                                        <p className="font-medium">No value propositions found</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal/Form */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-display font-bold text-slate-800">
                                {editingItem ? 'Edit Value Prop' : 'New Value Prop'}
                            </h3>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                            {submitError && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                                    {submitError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Icon Name (Lucide React)</label>
                                <div className="relative">
                                    <input
                                        {...register('icon')}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-mono text-sm"
                                        placeholder="e.g. Camera"
                                        required
                                    />
                                    <div className="absolute top-full left-0 mt-1 text-xs text-slate-500 w-full px-1">
                                        Popular: Camera, Clock, CreditCard, MapPin, Award, Heart, Star, Shield, Users, Zap
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                                <input
                                    {...register('title')}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                    placeholder="e.g. Professional Team"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                                <textarea
                                    {...register('description')}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 resize-none"
                                    rows={3}
                                    placeholder="Brief explanation..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Order</label>
                                    <input
                                        {...register('display_order', { valueAsNumber: true })}
                                        type="number"
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                                    <div className="relative">
                                        <select
                                            {...register('is_active', { valueAsNumber: true })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                                        >
                                            <option value={1}>Active</option>
                                            <option value={0}>Inactive</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-200 transition-all"
                                >
                                    Save Value Prop
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
