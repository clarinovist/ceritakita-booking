'use client';

import { useState } from 'react';
import { Service, ServiceFormData } from '@/lib/types';

export const useServices = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [serviceFormData, setServiceFormData] = useState<ServiceFormData>({
        name: '',
        basePrice: 0,
        discountValue: 0,
        isActive: true,
        badgeText: ''
    });

    const fetchData = async () => {
        try {
            const res = await fetch('/api/services');
            if (res.ok) {
                const data = await res.json();
                setServices(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const saveAllServices = async (updatedList: Service[]) => {
        try {
            const res = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedList)
            });
            if (res.ok) {
                setServices(updatedList);
                return true;
            }
            throw new Error("Failed");
        } catch {
            alert("Error saving services");
            return false;
        }
    };

    const handleOpenAddModal = () => {
        setEditingService(null);
        setServiceFormData({ name: '', basePrice: 0, discountValue: 0, isActive: true, badgeText: '' });
        setIsServiceModalOpen(true);
    };

    const handleOpenEditModal = (service: Service) => {
        setEditingService(service);
        setServiceFormData({
            name: service.name,
            basePrice: service.basePrice,
            discountValue: service.discountValue,
            isActive: service.isActive,
            badgeText: service.badgeText || ''
        });
        setIsServiceModalOpen(true);
    };

    const handleDeleteService = async (id: string) => {
        if (!confirm("Are you sure you want to delete this service?")) return;
        const updated = services.filter(s => s.id !== id);
        await saveAllServices(updated);
    };

    const handleSaveService = async (e: React.FormEvent) => {
        e.preventDefault();
        let updatedList: Service[];

        if (editingService) {
            updatedList = services.map(s => s.id === editingService.id ? { ...s, ...serviceFormData } : s);
        } else {
            const newService: Service = {
                id: crypto.randomUUID(),
                ...serviceFormData
            };
            updatedList = [...services, newService];
        }

        if (await saveAllServices(updatedList)) {
            setIsServiceModalOpen(false);
        }
    };

    const toggleServiceActive = async (id: string, active: boolean) => {
        const updated = services.map(s => s.id === id ? { ...s, isActive: active } : s);
        await saveAllServices(updated);
    };

    return {
        services,
        setServices,
        isServiceModalOpen,
        setIsServiceModalOpen,
        editingService,
        setEditingService,
        serviceFormData,
        setServiceFormData,
        fetchData,
        handleOpenAddModal,
        handleOpenEditModal,
        handleDeleteService,
        handleSaveService,
        toggleServiceActive
    };
};
