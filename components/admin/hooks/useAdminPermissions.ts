/**
 * useAdminPermissions — reusable RBAC logic for the admin dashboard.
 * Extracted from the monolitic AdminDashboard.tsx permission gate.
 */

import { useMemo } from 'react';
import { User, ViewMode } from '@/lib/types';

export function useAdminPermissions(user?: User) {
    const role = user?.role;
    const perms = user?.permissions;

    const availableModes = useMemo<ViewMode[]>(() => {
        const all: ViewMode[] = [
            'dashboard', 'ads', 'calendar', 'table', 'leads',
            'catalog', 'coupons', 'settings', 'homepage', 'finance', 'freelancers'
        ];

        if (role === 'admin') return all;

        const allowed: ViewMode[] = [];

        if (perms?.dashboard)          allowed.push('dashboard');
        if (perms?.ads)                allowed.push('ads');
        if (perms?.booking?.view)      allowed.push('calendar', 'table');
        if (perms?.leads?.view)       allowed.push('leads');

        const hasCatalogAccess =
            perms?.services?.view ||
            perms?.portfolio?.view ||
            perms?.photographers?.view ||
            perms?.addons?.view;
        if (hasCatalogAccess)          allowed.push('catalog');

        if (perms?.coupons?.view)      allowed.push('coupons');
        if (perms?.finance)            allowed.push('finance');
        if (perms?.settings)           allowed.push('settings');
        if (perms?.homepage_cms)       allowed.push('homepage');
        if (perms?.freelancers)        allowed.push('freelancers');

        // Edge-case: settings sub-permissions
        if ((perms?.users || perms?.payment) && !allowed.includes('settings')) {
            allowed.push('settings');
        }

        return allowed.length > 0 ? allowed : ['table'];
    }, [role, perms]);

    return {
        role,
        permissions: perms,
        availableModes,
        isAdmin: role === 'admin',
    };
}
