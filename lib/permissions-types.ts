// Client-safe permission types and constants
import { UserPermissions } from '@/lib/types/user';

/**
 * Default permissions for admin role
 */
export const DEFAULT_ADMIN_PERMISSIONS: UserPermissions = {
  booking: { view: true, create: true, update: true, reschedule: true, delete: true },
  services: { view: true, create: true, update: true },
  photographers: { view: true, create: true, update: true },
  addons: { view: true, create: true, update: true },
  portfolio: { view: true, create: true, update: true },
  coupons: { view: true, create: true, update: true },
  export: { bookings: true, financial: true },
  dashboard: true,
  ads: true,
  settings: true,
  payment: true,
  users: true,
  leads: { view: true, create: true, update: true, delete: true },
  homepage_cms: true
};

/**
 * Default permissions for staff role
 */
export const DEFAULT_STAFF_PERMISSIONS: UserPermissions = {
  booking: { view: true, create: true, update: true, reschedule: true, delete: false },
  services: { view: true, create: true, update: true },
  photographers: { view: true, create: true, update: true },
  addons: { view: true, create: true, update: true },
  portfolio: { view: true, create: true, update: true },
  coupons: { view: false, create: false, update: false },
  export: { bookings: false, financial: false },
  dashboard: false,
  ads: false,
  settings: false,
  payment: false,
  users: false,
  leads: { view: true, create: true, update: true, delete: false },
  homepage_cms: false
};

/**
 * Permission validation rules
 */
export const PERMISSION_VALIDATION = {
  username: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/
  },
  password: {
    minLength: 6,
    maxLength: 128
  },
  role: {
    allowed: ['admin', 'staff'] as const
  }
};

/**
 * Check if user has specific permission
 */
export function hasPermission(permissions: any, permissionPath: string): boolean {
  if (!permissions) return false;

  const path = permissionPath.split('.');
  let current = permissions;

  for (const key of path) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return false;
    }
  }

  return Boolean(current);
}

/**
 * Get menu items filtered by permissions
 */
export function getFilteredMenuItems(permissions: any, role: string) {
  const allMenuItems = [
    { id: 'dashboard', icon: 'LayoutDashboard', label: 'Dashboard', permission: 'dashboard' },
    { id: 'ads', icon: 'Target', label: 'Ads Performance', permission: 'ads' },
    { id: 'calendar', icon: 'Calendar', label: 'Calendar', permission: 'booking.view' },
    { id: 'table', icon: 'List', label: 'Bookings', permission: 'booking.view' },
    { id: 'leads', icon: 'Target', label: 'Leads', permission: 'leads.view' },
    { id: 'services', icon: 'Tag', label: 'Services', permission: 'services.view' },
    { id: 'portfolio', icon: 'ImageIcon', label: 'Portfolio', permission: 'portfolio.view' },
    { id: 'addons', icon: 'ShoppingBag', label: 'Add-ons', permission: 'addons.view' },
    { id: 'photographers', icon: 'Camera', label: 'Photographers', permission: 'photographers.view' },
    { id: 'coupons', icon: 'Tag', label: 'Kupon', permission: 'coupons.view' },
    { id: 'users', icon: 'Users', label: 'Users', permission: 'users' },
    { id: 'payment-settings', icon: 'CreditCard', label: 'Payment Settings', permission: 'payment' },
    { id: 'settings', icon: 'Settings', label: 'Settings', permission: 'settings' },
    { id: 'homepage', icon: 'Home', label: 'Homepage CMS', permission: 'homepage_cms' },
  ];

  // Admin sees everything
  if (role === 'admin') {
    return allMenuItems;
  }

  // Filter by permissions
  return allMenuItems.filter(item => {
    if (item.permission === 'dashboard' || item.permission === 'ads' || item.permission === 'homepage_cms') {
      return permissions?.[item.permission];
    }
    return hasPermission(permissions, item.permission);
  });
}

/**
 * Get default permissions for a role
 */
export function getDefaultPermissions(role: 'admin' | 'staff'): UserPermissions {
  return role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_STAFF_PERMISSIONS;
}
