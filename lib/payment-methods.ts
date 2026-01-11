/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb } from './db';
import { randomUUID } from 'crypto';

export interface PaymentMethod {
  id: string;
  name: string;
  provider_name: string;
  account_name: string;
  account_number: string;
  qris_image_url?: string;
  is_active: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentMethodInput {
  name: string;
  provider_name: string;
  account_name: string;
  account_number: string;
  qris_image_url?: string;
  is_active?: number;
  display_order?: number;
}

export interface UpdatePaymentMethodInput {
  name?: string;
  provider_name?: string;
  account_name?: string;
  account_number?: string;
  qris_image_url?: string;
  is_active?: number;
  display_order?: number;
}

/**
 * Get all payment methods
 */
export function getAllPaymentMethods(): PaymentMethod[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM payment_methods 
    ORDER BY display_order ASC, created_at DESC
  `).all() as PaymentMethod[];
}

/**
 * Get active payment methods only
 */
export function getActivePaymentMethods(): PaymentMethod[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM payment_methods 
    WHERE is_active = 1 
    ORDER BY display_order ASC
  `).all() as PaymentMethod[];
}

/**
 * Get payment method by ID
 */
export function getPaymentMethodById(id: string): PaymentMethod | null {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM payment_methods 
    WHERE id = ?
  `).get(id) as PaymentMethod | null;
}

/**
 * Create a new payment method
 */
export function createPaymentMethod(input: CreatePaymentMethodInput): PaymentMethod {
  const db = getDb();
  
  const id = randomUUID();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO payment_methods (
      id, name, provider_name, account_name, account_number, 
      qris_image_url, is_active, display_order, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.name,
    input.provider_name,
    input.account_name,
    input.account_number,
    input.qris_image_url || null,
    input.is_active !== undefined ? input.is_active : 1,
    input.display_order !== undefined ? input.display_order : 0,
    now,
    now
  );

  return getPaymentMethodById(id)!;
}

/**
 * Update payment method
 */
export function updatePaymentMethod(id: string, input: UpdatePaymentMethodInput): PaymentMethod {
  const db = getDb();
  
  const existing = getPaymentMethodById(id);
  if (!existing) {
    throw new Error('Payment method not found');
  }

  const updates: string[] = [];
  const values: any[] = [];
  
  if (input.name) {
    updates.push('name = ?');
    values.push(input.name);
  }
  
  if (input.provider_name) {
    updates.push('provider_name = ?');
    values.push(input.provider_name);
  }
  
  if (input.account_name) {
    updates.push('account_name = ?');
    values.push(input.account_name);
  }
  
  if (input.account_number) {
    updates.push('account_number = ?');
    values.push(input.account_number);
  }
  
  if (input.qris_image_url !== undefined) {
    updates.push('qris_image_url = ?');
    values.push(input.qris_image_url || null);
  }
  
  if (input.is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(input.is_active);
  }
  
  if (input.display_order !== undefined) {
    updates.push('display_order = ?');
    values.push(input.display_order);
  }
  
  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  if (updates.length === 1) {
    // Only updated_at changed, nothing to update
    return existing;
  }

  db.prepare(`
    UPDATE payment_methods 
    SET ${updates.join(', ')} 
    WHERE id = ?
  `).run(...values);

  return getPaymentMethodById(id)!;
}

/**
 * Delete payment method
 */
export function deletePaymentMethod(id: string): void {
  const db = getDb();
  
  const existing = getPaymentMethodById(id);
  if (!existing) {
    throw new Error('Payment method not found');
  }

  db.prepare('DELETE FROM payment_methods WHERE id = ?').run(id);
}

/**
 * Seed default payment methods if none exist
 */
export function seedDefaultPaymentMethods(): void {
  const db = getDb();
  
  const existing = db.prepare('SELECT COUNT(*) as count FROM payment_methods').get() as { count: number };
  
  if (existing.count === 0) {
    const methods = [
      {
        name: 'BCA Transfer',
        provider_name: 'BCA',
        account_name: 'Nugroho Pramono',
        account_number: '7735006002',
        display_order: 0
      },
      {
        name: 'Mandiri Transfer',
        provider_name: 'Mandiri',
        account_name: 'Nugroho Pramono',
        account_number: '1234567890',
        display_order: 1
      }
    ];

    methods.forEach(method => {
      createPaymentMethod(method);
    });
    
    console.log('✅ Default payment methods created');
  }
}
