import { Suspense } from 'react';
import CRMWorkspace from '@/components/admin/crm/CRMWorkspace';

export default function LeadsPage() {
    return (
        <div className="min-h-screen bg-cream-50">
            <Suspense fallback={<div>Loading CRM...</div>}>
                <CRMWorkspace />
            </Suspense>
        </div>
    );
}
