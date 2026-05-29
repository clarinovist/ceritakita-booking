'use client';

import { useState } from 'react';
import { Service, ServiceFormData } from '@/lib/types';
import { logger } from '@/lib/logger';
import { apiGet, apiPost, ApiError } from '@/lib/fetch';

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

    const fetchData = async (signal?: AbortSignal) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiGet<Service[]>('/api/services', { signal });
            if (!signal?.aborted) {
                setServices(data);
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                setError(err instanceof Error ? err.message : 'An unexpected error occurred');
                console.error(err);
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    const saveAllServices = async (updatedList: Service[]) => {
        setLoading(true);
        setError(null);
        try {
            await apiPost<unknown>('/api/services', updatedList);
            setServices(updatedList);
            return true;
        } catch (error) {
            if (error instanceof ApiError) {
                let errorMessage = error.message || `Failed with status ${error.status}`;
                setError(errorMessage);
                logger.error('Failed to save services - non-OK response', {
                    status: error.status,
                    message: error.message
                });
            } else {
                const msg = error instanceof Error ? error.message : 'Error connection to server';
                setError(msg);
                logger.error('Error saving services (catch block)', { error });
            }
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
