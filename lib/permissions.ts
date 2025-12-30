// Centralized permission management
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
  users: true
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
  users: false
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
 * Permission checking middleware for API routes (server-side)
 */
export async function requirePermission(permission: string) {
  // Import dynamically to avoid build issues
  const { getSession } = await import('./auth');

  return async (req: any): Promise<any | null> => {
    const session = await getSession();

    if (!session) {
      return { error: 'Unauthorized. Authentication required.', status: 401 };
    }

    const userPermissions = (session.user as any)?.permissions;
    const role = (session.user as any)?.role;

    // Admin has all permissions
    if (role === 'admin') {
      return null;
    }

    // Check if user has the required permission
    if (!hasPermission(userPermissions, permission)) {
      return { error: 'Forbidden. You do not have permission to access this resource.', status: 403 };
    }

    return null; // Permission granted
  };
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
    { id: 'services', icon: 'Tag', label: 'Services', permission: 'services.view' },
    { id: 'portfolio', icon: 'ImageIcon', label: 'Portfolio', permission: 'portfolio.view' },
    { id: 'addons', icon: 'ShoppingBag', label: 'Add-ons', permission: 'addons.view' },
    { id: 'photographers', icon: 'Camera', label: 'Photographers', permission: 'photographers.view' },
    { id: 'coupons', icon: 'Tag', label: 'Kupon', permission: 'coupons.view' },
    { id: 'users', icon: 'Users', label: 'Users', permission: 'users' },
    { id: 'payment-settings', icon: 'CreditCard', label: 'Payment Settings', permission: 'payment' },
    { id: 'settings', icon: 'Settings', label: 'Settings', permission: 'settings' },
  ];

  // Admin sees everything
  if (role === 'admin') {
    return allMenuItems;
  }

  // Filter by permissions
  return allMenuItems.filter(item => {
    if (item.permission === 'dashboard' || item.permission === 'ads') {
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

/**
 * Validate user input
 */
export function validateUserInput(input: { username?: string; password?: string; role?: string }): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (input.username !== undefined && input.username !== '') {
    if (input.username.length < PERMISSION_VALIDATION.username.minLength) {
      errors.push(`Username must be at least ${PERMISSION_VALIDATION.username.minLength} characters`);
    }
    if (input.username.length > PERMISSION_VALIDATION.username.maxLength) {
      errors.push(`Username must not exceed ${PERMISSION_VALIDATION.username.maxLength} characters`);
    }
    if (!PERMISSION_VALIDATION.username.pattern.test(input.username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }
  }

  if (input.password !== undefined && input.password !== '') {
    if (input.password.length < PERMISSION_VALIDATION.password.minLength) {
      errors.push(`Password must be at least ${PERMISSION_VALIDATION.password.minLength} characters`);
    }
    if (input.password.length > PERMISSION_VALIDATION.password.maxLength) {
      errors.push(`Password must not exceed ${PERMISSION_VALIDATION.password.maxLength} characters`);
    }
  }

  if (input.role !== undefined && input.role !== '') {
    if (!PERMISSION_VALIDATION.role.allowed.includes(input.role as any)) {
      errors.push(`Role must be one of: ${PERMISSION_VALIDATION.role.allowed.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}