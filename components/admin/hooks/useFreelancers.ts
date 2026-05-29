import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/fetch';
import { useFreelancerForm } from './useFreelancerForm';

export interface Freelancer {
    id: string;
    name: string;
    phone: string | null;
    default_fee: number | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface FreelancerRole {
    id: string;
    name: string;
    short_code: string;
    is_active: boolean;
}

export interface FreelancerJob {
    id: string;
    freelancer_id: string;
    booking_id: string | null;
    role_id: string;
    work_date: string;
    fee: number;
    notes: string | null;
    created_by: string | null;
    
    // Virtual fields from joins
    freelancer_name?: string;
    role_name?: string;
    role_short_code?: string;
    booking_customer_name?: string | null;
    created_at?: string;
}

export interface FreelancerMonthlyRecap {
    freelancer_id: string;
    freelancer_name: string;
    total_jobs: number;
    total_fee: number;
}

export const useFreelancers = () => {
    const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
    const [roles, setRoles] = useState<FreelancerRole[]>([]);
    const [jobs, setJobs] = useState<FreelancerJob[]>([]);
    const [recap, setRecap] = useState<FreelancerMonthlyRecap[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Form and modal state delegated to sub-hook
    const formState = useFreelancerForm();

    const fetchFreelancers = useCallback(async (activeOnly = false, signal?: AbortSignal) => {
        setLoading(true);
        try {
            const data = await apiGet<Freelancer[]>(
                `/api/freelancers${activeOnly ? '?active=1' : ''}`,
                { signal }
            );
            if (!signal?.aborted) {
                setFreelancers(data);
            }
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Failed to fetch freelancers:', error);
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, []);

    const fetchRoles = useCallback(async (activeOnly = false, signal?: AbortSignal) => {
        try {
            const data = await apiGet<FreelancerRole[]>(
                `/api/freelancers?type=roles${activeOnly ? '&active=1' : ''}`,
                { signal }
            );
            if (!signal?.aborted) {
                setRoles(data);
            }
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Failed to fetch freelancer roles:', error);
            }
        }
    }, []);

    const fetchJobs = useCallback(async (startDate?: string, endDate?: string, freelancerId?: string, signal?: AbortSignal) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (freelancerId) params.append('freelancer_id', freelancerId);
            
            const data = await apiGet<FreelancerJob[]>(
                `/api/freelancer-jobs?${params.toString()}`,
                { signal }
            );
            if (!signal?.aborted) {
                setJobs(data);
            }
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Failed to fetch freelancer jobs:', error);
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, []);

    const fetchRecap = useCallback(async (year: string, month: string, signal?: AbortSignal) => {
        setLoading(true);
        try {
            const data = await apiGet<FreelancerMonthlyRecap[]>(
                `/api/freelancer-jobs/recap?year=${year}&month=${month}`,
                { signal }
            );
            if (!signal?.aborted) {
                setRecap(data);
            }
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Failed to fetch freelancer recap:', error);
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, []);

    const createFreelancer = async (data: Partial<Freelancer>) => {
        try {
            const result = await apiPost<Freelancer>('/api/freelancers', data);
            await fetchFreelancers();
            return result;
        } catch (error) {
            console.error('Error creating freelancer:', error);
            throw error;
        }
    };

    const updateFreelancer = async (id: string, data: Partial<Freelancer>) => {
        try {
            const result = await apiPut<Freelancer>(`/api/freelancers/${id}`, data);
            await fetchFreelancers();
            return result;
        } catch (error) {
            console.error('Error updating freelancer:', error);
            throw error;
        }
    };

    const deleteFreelancer = async (id: string) => {
        try {
            await apiDelete(`/api/freelancers/${id}`);
            await fetchFreelancers();
        } catch (error) {
            console.error('Error deleting freelancer:', error);
            throw error;
        }
    };

    const createJob = async (data: Partial<FreelancerJob>) => {
        try {
            return await apiPost<FreelancerJob>('/api/freelancer-jobs', data);
        } catch (error) {
            console.error('Error creating job:', error);
            throw error;
        }
    };

    const deleteJob = async (id: string) => {
        try {
            await apiDelete(`/api/freelancer-jobs?id=${id}`);
            // Optimistic update for jobs list
            setJobs(prev => prev.filter(job => job.id !== id));
        } catch (error) {
            console.error('Error deleting job:', error);
            throw error;
        }
    };

    return {
        freelancers,
        roles,
        jobs,
        recap,
        loading,
        fetchFreelancers,
        fetchRoles,
        fetchJobs,
        fetchRecap,
        createFreelancer,
        updateFreelancer,
        deleteFreelancer,
        createJob,
        deleteJob,
        
        // Modal & selections from formState sub-hook
        isFormModalOpen: formState.isFormModalOpen,
        setIsFormModalOpen: formState.setIsFormModalOpen,
        isDetailModalOpen: formState.isDetailModalOpen,
        setIsDetailModalOpen: formState.setIsDetailModalOpen,
        selectedFreelancer: formState.selectedFreelancer,
        setSelectedFreelancer: formState.setSelectedFreelancer
    };
};
