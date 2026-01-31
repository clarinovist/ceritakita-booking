'use client';

import { useState } from 'react';
import { Service, ServiceFormData } from '@/lib/types';
import { logger } from '@/lib/logger';

export const useServices = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [serviceFormData, setServiceFormData] = useState<ServiceFormData>({
        name: '',
        basePrice: 0,
        discountValue: 0,
        isActive: true,
        badgeText: '',
        benefits: []
    });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/services');
            if (res.ok) {
                const data = await res.json();
                setServices(data);
            } else {
                const errorData = await res.json().catch(() => ({}));
                const msg = errorData.error || `Failed to fetch services (${res.status})`;
                setError(msg);
                logger.error('Failed to fetch services - non‑OK response', {
                    status: res.status,
                    statusText: res.statusText,
                    details: errorData
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const saveAllServices = async (updatedList: Service[]) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedList)
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                setServices(updatedList);
                return true;
            } else {
                // Handle detailed error messages (e.g. from Zod validation)
                let errorMessage = data.error || `Failed with status ${res.status}`;

                if (data.details && Array.isArray(data.details)) {
                    const validationErrors = data.details.map((issue: any) =>
                        `${issue.path.join('.')}: ${issue.message}`
                    ).join(', ');
                    errorMessage = `Validation failed: ${validationErrors}`;
                }

                setError(errorMessage);
                logger.error('Failed to save services - non-OK response', {
                    status: res.status,
                    statusText: res.statusText,
                    body: data
                });
                return false;
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Error connection to server';
            setError(msg);
            logger.error('Error saving services (catch block)', { error });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setError(null);
        setEditingService(null);
        setServiceFormData({ name: '', basePrice: 0, discountValue: 0, isActive: true, badgeText: '', benefits: [] });
        setIsServiceModalOpen(true);
    };

    const handleOpenEditModal = (service: Service) => {
        setError(null);
        setEditingService(service);
        setServiceFormData({
            name: service.name,
            basePrice: service.basePrice,
            discountValue: service.discountValue,
            isActive: service.isActive,
            badgeText: service.badgeText || '',
            benefits: service.benefits || []
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
        setError(null);
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
        loading,
        error,
        fetchData,
        handleOpenAddModal,
        handleOpenEditModal,
        handleDeleteService,
        handleSaveService,
        toggleServiceActive
    };
};
