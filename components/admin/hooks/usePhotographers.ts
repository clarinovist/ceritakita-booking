'use client';

import { useState } from 'react';
import { Photographer, PhotographerFormData } from '@/lib/types';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/fetch';

export const usePhotographers = () => {
    const [photographers, setPhotographers] = useState<Photographer[]>([]);
    const [isPhotographerModalOpen, setIsPhotographerModalOpen] = useState(false);
    const [editingPhotographer, setEditingPhotographer] = useState<Photographer | null>(null);
    const [photographerFormData, setPhotographerFormData] = useState<PhotographerFormData>({
        name: '',
        phone: '',
        specialty: '',
        is_active: true
    });

    const fetchData = async (signal?: AbortSignal) => {
        try {
            const data = await apiGet<Photographer[]>('/api/photographers', { signal });
            if (!signal?.aborted) {
                setPhotographers(data);
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                console.error(err);
            }
        }
    };

    const handleOpenAddPhotographerModal = () => {
        setEditingPhotographer(null);
        setPhotographerFormData({ name: '', phone: '', specialty: '', is_active: true });
        setIsPhotographerModalOpen(true);
    };

    const handleOpenEditPhotographerModal = (photographer: Photographer) => {
        setEditingPhotographer(photographer);
        setPhotographerFormData({
            name: photographer.name,
            phone: photographer.phone || '',
            specialty: photographer.specialty || '',
            is_active: photographer.is_active
        });
        setIsPhotographerModalOpen(true);
    };

    const handleDeletePhotographer = async (id: string) => {
        if (!confirm("Are you sure you want to delete this photographer? This will remove them from all assigned bookings.")) return;

        try {
            await apiDelete(`/api/photographers?id=${id}`);
            setPhotographers(prev => prev.filter(p => p.id !== id));
            alert("Photographer deleted successfully");
        } catch {
            alert("Error deleting photographer");
        }
    };

    const handleSavePhotographer = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingPhotographer) {
                // Update existing photographer
                await apiPut('/api/photographers', { id: editingPhotographer.id, ...photographerFormData });
                setPhotographers(prev => prev.map(p =>
                    p.id === editingPhotographer.id ? { ...p, ...photographerFormData } : p
                ));
                setIsPhotographerModalOpen(false);
                alert("Photographer updated successfully");
            } else {
                // Create new photographer
                const newPhotographer = await apiPost<Photographer>('/api/photographers', photographerFormData);
                setPhotographers(prev => [newPhotographer, ...prev]);
                setIsPhotographerModalOpen(false);
                alert("Photographer created successfully");
            }
        } catch {
            alert("Error saving photographer");
        }
    };

    const togglePhotographerActive = async (id: string, active: boolean) => {
        try {
            await apiPut('/api/photographers', { id, is_active: active });
            setPhotographers(prev => prev.map(p => p.id === id ? { ...p, is_active: active } : p));
        } catch {
            alert("Error updating photographer");
        }
    };

    return {
        photographers,
        setPhotographers,
        isPhotographerModalOpen,
        setIsPhotographerModalOpen,
        editingPhotographer,
        setEditingPhotographer,
        photographerFormData,
        setPhotographerFormData,
        fetchData,
        handleOpenAddPhotographerModal,
        handleOpenEditPhotographerModal,
        handleDeletePhotographer,
        handleSavePhotographer,
        togglePhotographerActive
    };
};
