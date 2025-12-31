// Server-side authentication functions
// This file uses better-sqlite3 and should only be used in API routes

import { getDb } from './db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { User, UserPermissions, CreateUserInput, UpdateUserInput } from './types/user';
import { DEFAULT_ADMIN_PERMISSIONS, DEFAULT_STAFF_PERMISSIONS } from './permissions-types';
import { validateUserInput } from './permissions';

/**
 * Get all users (server-side)
 */
export function getAllUsers(): User[] {
  const db = getDb();
  const users = db.prepare(`
    SELECT id, username, role, is_active, created_at, updated_at, permissions 
    FROM users 
    ORDER BY created_at DESC
  `).all() as any[];
  
  return users.map(user => ({
    ...user,
    permissions: user.permissions ? JSON.parse(user.permissions) : undefined
  }));
}

/**
 * Get user by ID (server-side)
 */
export function getUserById(id: string): User | null {
  const db = getDb();
  const user = db.prepare(`
    SELECT id, username, role, is_active, created_at, updated_at, permissions 
    FROM users 
    WHERE id = ?
  `).get(id) as any;
  
  if (!user) return null;
  
  return {
    ...user,
    permissions: user.permissions ? JSON.parse(user.permissions) : undefined
  };
}

/**
 * Get user by username (server-side)
 */
export function getUserByUsername(username: string): User | null {
  const db = getDb();
  const user = db.prepare(`
    SELECT id, username, password_hash, role, is_active, created_at, updated_at, permissions 
    FROM users 
    WHERE username = ?
  `).get(username) as any;
  
  if (!user) return null;
  
  return {
    ...user,
    permissions: user.permissions ? JSON.parse(user.permissions) : undefined
  };
}

/**
 * Create a new user (server-side)
 */
export function createUser(input: CreateUserInput): User {
  const db = getDb();

  // Check required fields
  if (!input.username || !input.password) {
    throw new Error('Username and password are required');
  }

  // Validate input
  const validation = validateUserInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  // Check if username already exists
  const existing = getUserByUsername(input.username);
  if (existing) {
    throw new Error('Username already exists');
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = bcrypt.hashSync(input.password, saltRounds);

  const id = randomUUID();
  const now = new Date().toISOString();

  // Set default permissions based on role
  const permissions = input.permissions ||
    (input.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_STAFF_PERMISSIONS);

  // Convert permissions to JSON string for storage
  const permissionsJson = JSON.stringify(permissions);

  db.prepare(`
    INSERT INTO users (id, username, password_hash, role, is_active, created_at, updated_at, permissions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.username,
    passwordHash,
    input.role || 'staff',
    1,
    now,
    now,
    permissionsJson
  );

  return getUserById(id)!;
}

/**
 * Update user (server-side)
 */
export function updateUser(id: string, input: UpdateUserInput): User {
  const db = getDb();

  // Validate input
  const validation = validateUserInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  const existing = getUserById(id);
  if (!existing) {
    throw new Error('User not found');
  }

  // Check username uniqueness if changing
  if (input.username && input.username !== existing.username) {
    const duplicate = getUserByUsername(input.username);
    if (duplicate) {
      throw new Error('Username already exists');
    }
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (input.username) {
    updates.push('username = ?');
    values.push(input.username);
  }

  if (input.password) {
    const passwordHash = bcrypt.hashSync(input.password, 12);
    updates.push('password_hash = ?');
    values.push(passwordHash);
  }

  if (input.is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(input.is_active);
  }

  if (input.permissions) {
    updates.push('permissions = ?');
    values.push(JSON.stringify(input.permissions));
  }

  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  if (updates.length === 1) {
    // Only updated_at changed, nothing to update
    return existing;
  }

  db.prepare(`
    UPDATE users
    SET ${updates.join(', ')}
    WHERE id = ?
  `).run(...values);

  return getUserById(id)!;
}

/**
 * Delete user (server-side)
 */
export function deleteUser(id: string): void {
  const db = getDb();

  const existing = getUserById(id);
  if (!existing) {
    throw new Error('User not found');
  }

  // Prevent deleting the last active admin
  if (existing.role === 'admin') {
    const allUsers = getAllUsers();
    const activeAdmins = allUsers.filter(u => u.role === 'admin' && u.is_active === 1);
    if (activeAdmins.length <= 1) {
      throw new Error('Cannot delete the last active admin user');
    }
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

/**
 * Verify user credentials (server-side)
 */
export function verifyUserCredentials(username: string, password: string): User | null {
  const user = getUserByUsername(username);
  if (!user || !user.password_hash) {
    return null;
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  // Return user without password hash
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
    permissions: user.permissions
  };
}

/**
 * Seed default admin user if none exists (server-side)
 */
export function seedDefaultAdmin(): void {
  try {
    const db = getDb();

    const existing = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (existing.count === 0) {
      const username = process.env.ADMIN_USERNAME || 'admin';
      const password = process.env.ADMIN_PASSWORD || 'admin123';

      createUser({
        username,
        password,
        role: 'admin'
      });

      console.log('✅ Default admin user created:', username);
    }
  } catch (error) {
    // Silently ignore errors during seeding
    if (error instanceof Error && !error.message.includes('Username already exists')) {
      console.warn('Warning during admin seed:', error.message);
    }
  }
}

/**
 * Sanitize user (remove password_hash for API responses)
 */
export function sanitizeUser(user: User): Omit<User, 'password_hash'> {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

/**
 * Sanitize multiple users
 */
export function sanitizeUsers(users: User[]): Omit<User, 'password_hash'>[] {
  return users.map(user => sanitizeUser(user));
}