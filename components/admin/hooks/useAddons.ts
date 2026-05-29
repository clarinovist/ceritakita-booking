'use client';

import { useState } from 'react';
import { Addon, AddonFormData } from '@/lib/types';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/fetch';

export const useAddons = () => {
    const [addons, setAddons] = useState<Addon[]>([]);
    const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
    const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
    const [addonFormData, setAddonFormData] = useState<AddonFormData>({
        name: '',
        price: 0,
        applicable_categories: [],
        is_active: true
    });

    const fetchData = async (signal?: AbortSignal) => {
        try {
            const data = await apiGet<Addon[]>('/api/addons', { signal });
            if (!signal?.aborted) {
                setAddons(data);
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                console.error(err);
            }
        }
    };

    const handleOpenAddAddonModal = () => {
        setEditingAddon(null);
        setAddonFormData({ name: '', price: 0, applicable_categories: [], is_active: true });
        setIsAddonModalOpen(true);
    };

    const handleOpenEditAddonModal = (addon: Addon) => {
        setEditingAddon(addon);
        setAddonFormData({
            name: addon.name,
            price: addon.price,
            applicable_categories: addon.applicable_categories || [],
            is_active: addon.is_active
        });
        setIsAddonModalOpen(true);
    };

    const handleDeleteAddon = async (id: string) => {
        if (!confirm("Are you sure you want to delete this add-on?")) return;

        try {
            await apiDelete(`/api/addons?id=${id}`);
            setAddons(prev => prev.filter(a => a.id !== id));
            alert("Add-on deleted successfully");
        } catch {
            alert("Error deleting add-on");
        }
    };

    const handleSaveAddon = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingAddon) {
                await apiPut('/api/addons', { id: editingAddon.id, ...addonFormData });
                setAddons(prev => prev.map(a =>
                    a.id === editingAddon.id ? { ...a, ...addonFormData } : a
                ));
                setIsAddonModalOpen(false);
                alert("Add-on updated successfully");
            } else {
                const newAddon = await apiPost<Addon>('/api/addons', addonFormData);
                setAddons(prev => [newAddon, ...prev]);
                setIsAddonModalOpen(false);
                alert("Add-on created successfully");
            }
        } catch {
            alert("Error saving add-on");
        }
    };

    const toggleAddonActive = async (id: string, active: boolean) => {
        try {
            await apiPut('/api/addons', { id, is_active: active });
            setAddons(prev => prev.map(a => a.id === id ? { ...a, is_active: active } : a));
        } catch {
            alert("Error updating add-on");
        }
    };

    const toggleCategoryForAddon = (category: string) => {
        setAddonFormData(prev => {
            const cats = prev.applicable_categories || [];
            if (cats.includes(category)) {
                return { ...prev, applicable_categories: cats.filter(c => c !== category) };
            } else {
                return { ...prev, applicable_categories: [...cats, category] };
            }
        });
    };

    return {
        addons,
        setAddons,
        isAddonModalOpen,
        setIsAddonModalOpen,
        editingAddon,
        setEditingAddon,
        addonFormData,
        setAddonFormData,
        fetchData,
        handleOpenAddAddonModal,
        handleOpenEditAddonModal,
        handleDeleteAddon,
        handleSaveAddon,
        toggleAddonActive,
        toggleCategoryForAddon
    };
};
