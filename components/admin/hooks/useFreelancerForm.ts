import { useState } from 'react';
import { type Freelancer } from './useFreelancers';

export function useFreelancerForm() {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancer | null>(null);

    return {
        isFormModalOpen,
        setIsFormModalOpen,
        isDetailModalOpen,
        setIsDetailModalOpen,
        selectedFreelancer,
        setSelectedFreelancer
    };
}
