import { useState, useCallback } from 'react';

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
    
    // Modals state
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancer | null>(null);

    const fetchFreelancers = useCallback(async (activeOnly = false) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/freelancers${activeOnly ? '?active=1' : ''}`);
            if (res.ok) {
                setFreelancers(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch freelancers:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRoles = useCallback(async (activeOnly = false) => {
        try {
            const res = await fetch(`/api/freelancers?type=roles${activeOnly ? '&active=1' : ''}`);
            if (res.ok) {
                setRoles(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch freelancer roles:', error);
        }
    }, []);

    const fetchJobs = useCallback(async (startDate?: string, endDate?: string, freelancerId?: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (freelancerId) params.append('freelancer_id', freelancerId);
            
            const res = await fetch(`/api/freelancer-jobs?${params.toString()}`);
            if (res.ok) {
                setJobs(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch freelancer jobs:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRecap = useCallback(async (year: string, month: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/freelancer-jobs/recap?year=${year}&month=${month}`);
            if (res.ok) {
                setRecap(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch freelancer recap:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const createFreelancer = async (data: Partial<Freelancer>) => {
        try {
            const res = await fetch('/api/freelancers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create freelancer');
            await fetchFreelancers();
            return await res.json();
        } catch (error) {
            console.error('Error creating freelancer:', error);
            throw error;
        }
    };

    const updateFreelancer = async (id: string, data: Partial<Freelancer>) => {
        try {
            const res = await fetch(`/api/freelancers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update freelancer');
            await fetchFreelancers();
            return await res.json();
        } catch (error) {
            console.error('Error updating freelancer:', error);
            throw error;
        }
    };

    const deleteFreelancer = async (id: string) => {
        try {
            const res = await fetch(`/api/freelancers/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete freelancer');
            await fetchFreelancers();
        } catch (error) {
            console.error('Error deleting freelancer:', error);
            throw error;
        }
    };

    const createJob = async (data: Partial<FreelancerJob>) => {
        try {
            const res = await fetch('/api/freelancer-jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create job');
            return await res.json();
        } catch (error) {
            console.error('Error creating job:', error);
            throw error;
        }
    };

    const deleteJob = async (id: string) => {
        try {
            const res = await fetch(`/api/freelancer-jobs?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete job');
            
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
        isFormModalOpen,
        setIsFormModalOpen,
        isDetailModalOpen,
        setIsDetailModalOpen,
        selectedFreelancer,
        setSelectedFreelancer
    };
};
