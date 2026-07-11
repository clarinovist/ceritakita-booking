import { Suspense } from 'react';
import FollowUpWorkspace from '@/components/admin/crm/FollowUpWorkspace';

export default function FollowUpPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      <Suspense fallback={<div>Loading Follow-Up...</div>}>
        <FollowUpWorkspace />
      </Suspense>
    </div>
  );
}
