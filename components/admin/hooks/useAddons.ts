'use client';

import { useState } from 'react';
import { Addon, AddonFormData } from '@/lib/types';

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

    const fetchData = async () => {
        try {
            const res = await fetch('/api/addons');
            if (res.ok) {
                const data = await res.json();
                setAddons(data);
            }
        } catch (err) {
            console.error(err);
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
            const res = await fetch(`/api/addons?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setAddons(prev => prev.filter(a => a.id !== id));
                alert("Add-on deleted successfully");
            } else {
                throw new Error("Failed");
            }
        } catch {
            alert("Error deleting add-on");
        }
    };

    const handleSaveAddon = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingAddon) {
                const res = await fetch('/api/addons', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingAddon.id, ...addonFormData })
                });

                if (res.ok) {
                    setAddons(prev => prev.map(a =>
                        a.id === editingAddon.id ? { ...a, ...addonFormData } : a
                    ));
                    setIsAddonModalOpen(false);
                    alert("Add-on updated successfully");
                } else {
                    throw new Error("Failed");
                }
            } else {
                const res = await fetch('/api/addons', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(addonFormData)
                });

                if (res.ok) {
                    const newAddon = await res.json();
                    setAddons(prev => [newAddon, ...prev]);
                    setIsAddonModalOpen(false);
                    alert("Add-on created successfully");
                } else {
                    throw new Error("Failed");
                }
            }
        } catch {
            alert("Error saving add-on");
        }
    };

    const toggleAddonActive = async (id: string, active: boolean) => {
        try {
            const res = await fetch('/api/addons', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_active: active })
            });

            if (res.ok) {
                setAddons(prev => prev.map(a => a.id === id ? { ...a, is_active: active } : a));
            } else {
                throw new Error("Failed");
            }
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
