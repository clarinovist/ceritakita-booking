'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { useForm, Controller } from 'react-hook-form';
import { ServiceCategory } from '@/types/homepage';
import { Plus, Trash2, Pencil, GripVertical } from 'lucide-react';
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
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr ref={setNodeRef} style={style} className="bg-white">
            <td className="px-6 py-4 whitespace-nowrap">
                <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
                    <GripVertical size={20} />
                </button>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.slug}</td>
            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{item.description}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900 mr-4">
                    <Pencil size={18} />
                </button>
                <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 size={18} />
                </button>
            </td>
        </tr>
    );
}

export function ServiceCategoriesTab() {
    const { data: items, isLoading } = useSWR<ServiceCategory[]>('/api/admin/service-categories', fetcher);
    const [editingItem, setEditingItem] = useState<ServiceCategory | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const { register, handleSubmit, reset, control } = useForm<Partial<ServiceCategory>>();

    const handleEdit = (item: ServiceCategory) => {
        setEditingItem(item);
        reset(item);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingItem(null);
        reset({ name: '', slug: '', description: '', thumbnail_url: '', display_order: items ? items.length + 1 : 1, is_active: 1 });
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            await fetch(`/api/admin/service-categories/${id}`, { method: 'DELETE' });
            mutate('/api/admin/service-categories');
        } catch (error) {
            alert('Failed to delete category');
        }
    };

    const onSubmit = async (data: Partial<ServiceCategory>) => {
        try {
            const url = editingItem ? `/api/admin/service-categories/${editingItem.id}` : '/api/admin/service-categories';
            const method = editingItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error('Failed to save');

            mutate('/api/admin/service-categories');
            setIsFormOpen(false);
            reset();
        } catch (error) {
            alert('Failed to save category');
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

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Service Categories</h3>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    <Plus size={18} />
                    Add Category
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 w-10"></th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <SortableContext
                            items={items?.map(i => i.id) || []}
                            strategy={verticalListSortingStrategy}
                        >
                            <tbody className="bg-white divide-y divide-gray-200">
                                {items?.map((item) => (
                                    <SortableItem key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
                                ))}
                                {items?.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No categories found. Create one to get started.
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">{editingItem ? 'Edit Category' : 'New Category'}</h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input {...register('name')} className="w-full px-3 py-2 border rounded-md" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                                <input {...register('slug')} className="w-full px-3 py-2 border rounded-md" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
                                <Controller
                                    name="thumbnail_url"
                                    control={control}
                                    render={({ field }) => (
                                        <ImageUpload
                                            value={field.value}
                                            onChange={field.onChange}
                                            folder="services"
                                        />
                                    )}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea {...register('description')} className="w-full px-3 py-2 border rounded-md" rows={3} />
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select {...register('is_active', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-md">
                                    <option value={1}>Active</option>
                                    <option value={0}>Inactive</option>
                                </select>
                            </div>

                            <div className="flex-justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
