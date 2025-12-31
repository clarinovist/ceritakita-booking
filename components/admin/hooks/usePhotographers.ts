'use client';

import { useState } from 'react';
import { Photographer, PhotographerFormData } from '@/lib/types';

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

    const fetchData = async () => {
        try {
            const res = await fetch('/api/photographers');
            if (res.ok) {
                const data = await res.json();
                setPhotographers(data);
            }
        } catch (err) {
            console.error(err);
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
            const res = await fetch(`/api/photographers?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setPhotographers(prev => prev.filter(p => p.id !== id));
                alert("Photographer deleted successfully");
            } else {
                throw new Error("Failed");
            }
        } catch {
            alert("Error deleting photographer");
        }
    };

    const handleSavePhotographer = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingPhotographer) {
                // Update existing photographer
                const res = await fetch('/api/photographers', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingPhotographer.id, ...photographerFormData })
                });

                if (res.ok) {
                    setPhotographers(prev => prev.map(p =>
                        p.id === editingPhotographer.id ? { ...p, ...photographerFormData } : p
                    ));
                    setIsPhotographerModalOpen(false);
                    alert("Photographer updated successfully");
                } else {
                    throw new Error("Failed");
                }
            } else {
                // Create new photographer
                const res = await fetch('/api/photographers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(photographerFormData)
                });

                if (res.ok) {
                    const newPhotographer = await res.json();
                    setPhotographers(prev => [newPhotographer, ...prev]);
                    setIsPhotographerModalOpen(false);
                    alert("Photographer created successfully");
                } else {
                    throw new Error("Failed");
                }
            }
        } catch {
            alert("Error saving photographer");
        }
    };

    const togglePhotographerActive = async (id: string, active: boolean) => {
        try {
            const res = await fetch('/api/photographers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_active: active })
            });

            if (res.ok) {
                setPhotographers(prev => prev.map(p => p.id === id ? { ...p, is_active: active } : p));
            } else {
                throw new Error("Failed");
            }
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
