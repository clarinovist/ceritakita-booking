/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Coupon management functions
 */

import getDb from './db';

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  usage_limit?: number;
  usage_count: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  description?: string;
  created_at: string;
}

export interface CouponUsage {
  id: number;
  coupon_id: string;
  booking_id: string;
  customer_name: string;
  customer_whatsapp: string;
  discount_amount: number;
  order_total: number;
  used_at: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  error?: string;
  discount_amount?: number;
}

/**
 * Validate a coupon code and calculate discount
 */
export function validateCoupon(
  code: string,
  totalAmount: number
): CouponValidationResult {
  const db = getDb();

  // Find coupon by code
  const stmt = db.prepare(`
    SELECT * FROM coupons
    WHERE UPPER(code) = UPPER(?)
      AND is_active = 1
  `);

  const row = stmt.get(code) as any;

  if (!row) {
    return {
      valid: false,
      error: 'Kode kupon tidak valid'
    };
  }

  const coupon: Coupon = {
    id: row.id,
    code: row.code,
    discount_type: row.discount_type,
    discount_value: row.discount_value,
    min_purchase: row.min_purchase,
    max_discount: row.max_discount,
    usage_limit: row.usage_limit,
    usage_count: row.usage_count,
    valid_from: row.valid_from,
    valid_until: row.valid_until,
    is_active: row.is_active === 1,
    created_at: row.created_at
  };

  // Check validity period
  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return {
      valid: false,
      error: 'Kupon belum berlaku'
    };
  }

  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return {
      valid: false,
      error: 'Kupon sudah kadaluarsa'
    };
  }

  // Check usage limit
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return {
      valid: false,
      error: 'Kupon sudah mencapai batas penggunaan'
    };
  }

  // Check minimum purchase
  if (coupon.min_purchase && totalAmount < coupon.min_purchase) {
    return {
      valid: false,
      error: `Minimal pembelian Rp ${coupon.min_purchase.toLocaleString('id-ID')}`
    };
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discount_type === 'percentage') {
    discountAmount = (totalAmount * coupon.discount_value) / 100;

    // Apply max discount if specified
    if (coupon.max_discount && discountAmount > coupon.max_discount) {
      discountAmount = coupon.max_discount;
    }
  } else {
    // Fixed discount
    discountAmount = coupon.discount_value;

    // Don't let discount exceed total
    if (discountAmount > totalAmount) {
      discountAmount = totalAmount;
    }
  }

  return {
    valid: true,
    coupon,
    discount_amount: Math.round(discountAmount)
  };
}

/**
 * Increment coupon usage count
 */
export function incrementCouponUsage(code: string): void {
  const db = getDb();

  const stmt = db.prepare(`
    UPDATE coupons
    SET usage_count = usage_count + 1
    WHERE UPPER(code) = UPPER(?)
  `);

  stmt.run(code);
}

/**
 * Record coupon usage
 */
export function recordCouponUsage(
  couponId: string,
  bookingId: string,
  customerName: string,
  customerWhatsapp: string,
  discountAmount: number,
  orderTotal: number
): void {
  const db = getDb();

  const stmt = db.prepare(`
    INSERT INTO coupon_usage (
      coupon_id, booking_id, customer_name, customer_whatsapp,
      discount_amount, order_total
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(couponId, bookingId, customerName, customerWhatsapp, discountAmount, orderTotal);
}

/**
 * Get usage history for a specific coupon
 */
export function getCouponUsageHistory(couponId: string): CouponUsage[] {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT * FROM coupon_usage
    WHERE coupon_id = ?
    ORDER BY used_at DESC
  `);

  const rows = stmt.all(couponId) as any[];

  return rows.map(row => ({
    id: row.id,
    coupon_id: row.coupon_id,
    booking_id: row.booking_id,
    customer_name: row.customer_name,
    customer_whatsapp: row.customer_whatsapp,
    discount_amount: row.discount_amount,
    order_total: row.order_total,
    used_at: row.used_at
  }));
}

/**
 * Get all coupon usage history
 */
export function getAllCouponUsage(): (CouponUsage & { coupon_code: string })[] {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT cu.*, c.code as coupon_code
    FROM coupon_usage cu
    JOIN coupons c ON cu.coupon_id = c.id
    ORDER BY cu.used_at DESC
  `);

  const rows = stmt.all() as any[];

  return rows.map(row => ({
    id: row.id,
    coupon_id: row.coupon_id,
    booking_id: row.booking_id,
    customer_name: row.customer_name,
    customer_whatsapp: row.customer_whatsapp,
    discount_amount: row.discount_amount,
    order_total: row.order_total,
    used_at: row.used_at,
    coupon_code: row.coupon_code
  }));
}

/**
 * Get all coupons
 */
export function getAllCoupons(): Coupon[] {
  const db = getDb();

  const stmt = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC');
  const rows = stmt.all() as any[];

  return rows.map(row => ({
    id: row.id,
    code: row.code,
    discount_type: row.discount_type,
    discount_value: row.discount_value,
    min_purchase: row.min_purchase,
    max_discount: row.max_discount,
    usage_limit: row.usage_limit,
    usage_count: row.usage_count,
    valid_from: row.valid_from,
    valid_until: row.valid_until,
    is_active: row.is_active === 1,
    created_at: row.created_at
  }));
}

/**
 * Create a new coupon
 */
export function createCoupon(coupon: Omit<Coupon, 'id' | 'usage_count' | 'created_at'>): string {
  const db = getDb();

  const id = crypto.randomUUID();

  const stmt = db.prepare(`
    INSERT INTO coupons (
      id, code, discount_type, discount_value,
      min_purchase, max_discount, usage_limit,
      valid_from, valid_until, is_active, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    coupon.code.toUpperCase(),
    coupon.discount_type,
    coupon.discount_value,
    coupon.min_purchase || null,
    coupon.max_discount || null,
    coupon.usage_limit || null,
    coupon.valid_from || null,
    coupon.valid_until || null,
    coupon.is_active ? 1 : 0,
    coupon.description || null
  );

  return id;
}

/**
 * Update a coupon
 */
export function updateCoupon(id: string, coupon: Partial<Omit<Coupon, 'id' | 'usage_count' | 'created_at'>>): void {
  const db = getDb();

  const stmt = db.prepare(`
    UPDATE coupons SET
      code = COALESCE(?, code),
      discount_type = COALESCE(?, discount_type),
      discount_value = COALESCE(?, discount_value),
      min_purchase = COALESCE(?, min_purchase),
      max_discount = COALESCE(?, max_discount),
      usage_limit = COALESCE(?, usage_limit),
      valid_from = COALESCE(?, valid_from),
      valid_until = COALESCE(?, valid_until),
      is_active = COALESCE(?, is_active),
      description = COALESCE(?, description)
    WHERE id = ?
  `);

  stmt.run(
    coupon.code ? coupon.code.toUpperCase() : null,
    coupon.discount_type || null,
    coupon.discount_value !== undefined ? coupon.discount_value : null,
    coupon.min_purchase !== undefined ? coupon.min_purchase : null,
    coupon.max_discount !== undefined ? coupon.max_discount : null,
    coupon.usage_limit !== undefined ? coupon.usage_limit : null,
    coupon.valid_from !== undefined ? coupon.valid_from : null,
    coupon.valid_until !== undefined ? coupon.valid_until : null,
    coupon.is_active !== undefined ? (coupon.is_active ? 1 : 0) : null,
    coupon.description !== undefined ? coupon.description : null,
    id
  );
}

/**
 * Delete a coupon
 */
export function deleteCoupon(id: string): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM coupons WHERE id = ?');
  stmt.run(id);
}

/**
 * Get a single coupon by ID
 */
export function getCouponById(id: string): Coupon | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM coupons WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    code: row.code,
    discount_type: row.discount_type,
    discount_value: row.discount_value,
    min_purchase: row.min_purchase,
    max_discount: row.max_discount,
    usage_limit: row.usage_limit,
    usage_count: row.usage_count,
    valid_from: row.valid_from,
    valid_until: row.valid_until,
    is_active: row.is_active === 1,
    description: row.description,
    created_at: row.created_at
  };
}

/**
 * Get a single coupon by code
 */
export function getCouponByCode(code: string): Coupon | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?)');
  const row = stmt.get(code) as any;

  if (!row) return null;

  return {
    id: row.id,
    code: row.code,
    discount_type: row.discount_type,
    discount_value: row.discount_value,
    min_purchase: row.min_purchase,
    max_discount: row.max_discount,
    usage_limit: row.usage_limit,
    usage_count: row.usage_count,
    valid_from: row.valid_from,
    valid_until: row.valid_until,
    is_active: row.is_active === 1,
    description: row.description,
    created_at: row.created_at
  };
}

/**
 * Get suggested coupons based on order total
 */
export function getSuggestedCoupons(orderTotal: number): Coupon[] {
  const db = getDb();

  const now = new Date().toISOString();

  const stmt = db.prepare(`
    SELECT * FROM coupons
    WHERE is_active = 1
      AND (usage_limit IS NULL OR usage_count < usage_limit)
      AND (valid_from IS NULL OR valid_from <= ?)
      AND (valid_until IS NULL OR valid_until >= ?)
      AND (min_purchase IS NULL OR min_purchase <= ?)
    ORDER BY discount_value DESC
    LIMIT 3
  `);

  const rows = stmt.all(now, now, orderTotal) as any[];

  return rows.map(row => ({
    id: row.id,
    code: row.code,
    discount_type: row.discount_type,
    discount_value: row.discount_value,
    min_purchase: row.min_purchase,
    max_discount: row.max_discount,
    usage_limit: row.usage_limit,
    usage_count: row.usage_count,
    valid_from: row.valid_from,
    valid_until: row.valid_until,
    is_active: row.is_active === 1,
    description: row.description,
    created_at: row.created_at
  }));
}
