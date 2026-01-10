'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { useForm, Controller } from 'react-hook-form';
import { ServiceCategory } from '@/types/homepage';
import { Plus, Trash2, Pencil, GripVertical, Loader2, Search, X } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function SortableItem({ item, onEdit, onDelete }: { item: ServiceCategory; onEdit: (item: ServiceCategory) => void; onDelete: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as 'relative',
    };

    return (
        <tr ref={setNodeRef} style={style} className={`group hover:bg-slate-50/50 transition-colors ${isDragging ? 'bg-indigo-50 shadow-lg' : 'bg-white'}`}>
            <td className="px-6 py-5 whitespace-nowrap">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab text-slate-400 hover:text-indigo-600 active:cursor-grabbing p-1 rounded hover:bg-indigo-50 transition-colors"
                >
                    <GripVertical size={20} />
                </button>
            </td>
            <td className="px-6 py-5 whitespace-nowrap">
                <div className="flex items-center gap-4">
                    {item.thumbnail_url && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                            <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div>
                        <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{item.slug}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <p className="text-sm text-slate-600 line-clamp-2 max-w-xs leading-relaxed">{item.description}</p>
            </td>
            <td className="px-6 py-5 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                    {item.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td className="px-6 py-5 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(item)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Edit Category"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(item.id)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Category"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

export function ServiceCategoriesTab() {
    const { data: items, isLoading } = useSWR<ServiceCategory[]>('/api/admin/service-categories', fetcher);
    const [editingItem, setEditingItem] = useState<ServiceCategory | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const { register, handleSubmit, reset, control } = useForm<Partial<ServiceCategory>>();

    const handleEdit = (item: ServiceCategory) => {
        setEditingItem(item);
        setSubmitError(null);
        reset(item);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingItem(null);
        setSubmitError(null);
        reset({ name: '', slug: '', description: '', thumbnail_url: '', display_order: items ? items.length + 1 : 1, is_active: 1 });
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;
        try {
            await fetch(`/api/admin/service-categories/${id}`, { method: 'DELETE' });
            mutate('/api/admin/service-categories');
        } catch (error) {
            alert('Failed to delete category');
        }
    };

    const onSubmit = async (data: Partial<ServiceCategory>) => {
        setSubmitError(null);
        try {
            const url = editingItem ? `/api/admin/service-categories/${editingItem.id}` : '/api/admin/service-categories';
            const method = editingItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error('Failed to save category');

            mutate('/api/admin/service-categories');
            setIsFormOpen(false);
            reset();
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'An error occurred');
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id && items) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);

            const newItems = arrayMove(items, oldIndex, newIndex);

            // Optimistic update
            mutate('/api/admin/service-categories', newItems, false);

            // Prepare updates
            const updates = newItems.map((item, index) => ({
                id: item.id,
                display_order: index + 1
            }));

            try {
                await Promise.all(updates.map(update =>
                    fetch(`/api/admin/service-categories/${update.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ display_order: update.display_order })
                    })
                ));
                mutate('/api/admin/service-categories');
            } catch (error) {
                console.error("Reorder failed", error);
                mutate('/api/admin/service-categories'); // Revert
            }
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
                    <h3 className="text-xl font-display font-bold text-slate-800">Service Categories</h3>
                    <p className="text-sm text-slate-500 mt-1">Manage the services displayed on the homepage</p>
                </div>

                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 font-medium"
                >
                    <Plus size={18} />
                    Add Category
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 w-10"></th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category Details</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <SortableContext
                            items={items?.map(i => i.id) || []}
                            strategy={verticalListSortingStrategy}
                        >
                            <tbody className="bg-white divide-y divide-slate-100">
                                {items?.map((item) => (
                                    <SortableItem key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
                                ))}
                                {(!items || items.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                    <Search size={24} />
                                                </div>
                                                <p className="font-medium">No service categories found</p>
                                                <p className="text-sm text-slate-400">Create your first category to get started</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </SortableContext>
                    </table>
                </DndContext>
            </div>

            {/* Modal/Form */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-display font-bold text-slate-800">
                                {editingItem ? 'Edit Category' : 'New Category'}
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
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Category Name</label>
                                <input
                                    {...register('name')}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                    placeholder="e.g. Wedding Photography"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Slug</label>
                                <input
                                    {...register('slug')}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-mono text-sm"
                                    placeholder="e.g. wedding-photography"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Thumbnail Image</label>
                                <div className="border shadow-sm rounded-xl p-3 bg-slate-50/50">
                                    <Controller
                                        name="thumbnail_url"
                                        control={control}
                                        render={({ field }) => (
                                            <ImageUpload
                                                value={field.value}
                                                onChange={field.onChange}
                                                folder="services"
                                                label="Upload Thumbnail"
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                                <textarea
                                    {...register('description')}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 resize-none"
                                    rows={3}
                                    placeholder="Brief description for the homepage card..."
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
                                    Save Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
