import { AdminDashboard } from '@/components/admin';

import type { Metadata } from 'next';

export const metadata: Metadata = {
    alternates: {
        canonical: '/admin',
    },
};

export default function AdminPage() {
    return <AdminDashboard />;
}
