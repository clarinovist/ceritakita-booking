// Server-only permissions logic (imports server-only modules)
import 'server-only';
import { getSession } from './auth';
import {
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_STAFF_PERMISSIONS,
  PERMISSION_VALIDATION,
  hasPermission,
  getDefaultPermissions
} from './permissions-types';

export {
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_STAFF_PERMISSIONS,
  PERMISSION_VALIDATION,
  hasPermission,
  getDefaultPermissions
};

/**
 * Permission checking middleware for API routes (server-side)
 */
export async function requirePermission(permission: string) {
  return async (_req: unknown): Promise<{ error: string; status: number } | null> => {
    const session = await getSession();

    if (!session) {
      return { error: 'Unauthorized. Authentication required.', status: 401 };
    }

    const userPermissions = (session.user as { permissions?: unknown })?.permissions;
    const role = (session.user as { role?: string })?.role;

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
 * Validate user input (server-side only, uses PERMISSION_VALIDATION from types)
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
    if (!PERMISSION_VALIDATION.role.allowed.includes(input.role as 'admin' | 'staff')) {
      errors.push(`Role must be one of: ${PERMISSION_VALIDATION.role.allowed.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}