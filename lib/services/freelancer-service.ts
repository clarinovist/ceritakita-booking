import 'server-only';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { logger } from '../logger';

// Types
export interface Freelancer {
    id: string;
    name: string;
    phone: string | null;
    default_fee: number | null;
    is_active: boolean; // converted from/to integer (0/1) for SQLite
    created_at?: string;
    updated_at?: string;
}

export interface FreelancerRole {
    id: string;
    name: string;
    short_code: string;
    is_active: boolean;
    created_at?: string;
}

export interface FreelancerJob {
    id: string;
    freelancer_id: string;
    booking_id: string | null;
    role_id: string;
    work_date: string;
    fee: number;
    notes: string | null;
    created_by: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface FreelancerJobWithDetails extends FreelancerJob {
    freelancer_name: string;
    role_name: string;
    role_short_code: string;
    booking_customer_name: string | null;
}

export interface FreelancerMonthlyRecap {
    freelancer_id: string;
    freelancer_name: string;
    total_jobs: number;
    total_fee: number;
}

/**
 * FREELANCER CRUD
 */

export function getFreelancers(activeOnly: boolean = false): Freelancer[] {
    const db = getDb();
    let query = 'SELECT * FROM freelancers';
    if (activeOnly) {
        query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY name ASC';
    
    const rows = db.prepare(query).all() as any[];
    return rows.map(row => ({
        ...row,
        is_active: Boolean(row.is_active)
    }));
}

export function createFreelancer(data: Omit<Freelancer, 'id' | 'created_at' | 'updated_at'>): Freelancer {
    const db = getDb();
    const id = randomUUID();
    
    try {
        const stmt = db.prepare(`
            INSERT INTO freelancers (id, name, phone, default_fee, is_active)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            id,
            data.name,
            data.phone || null,
            data.default_fee !== undefined ? data.default_fee : null,
            data.is_active ? 1 : 0
        );
        
        return {
            id,
            ...data,
            is_active: data.is_active,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    } catch (error) {
        logger.error('Failed to create freelancer', { error, data });
        throw new Error('Failed to create freelancer');
    }
}

export function updateFreelancer(id: string, data: Partial<Omit<Freelancer, 'id' | 'created_at' | 'updated_at'>>): void {
    const db = getDb();
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
    }
    
    if (data.phone !== undefined) {
        updates.push('phone = ?');
        values.push(data.phone || null);
    }
    
    if (data.default_fee !== undefined) {
        updates.push('default_fee = ?');
        values.push(data.default_fee !== null ? data.default_fee : null);
    }
    
    if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        values.push(data.is_active ? 1 : 0);
    }
    
    if (updates.length === 0) return;
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    try {
        const stmt = db.prepare(`UPDATE freelancers SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...values);
    } catch (error) {
        logger.error('Failed to update freelancer', { error, id, data });
        throw new Error('Failed to update freelancer');
    }
}

export function deleteFreelancer(id: string): void {
    const db = getDb();
    try {
        // Will cascade to freelancer_jobs due to foreign key constraints ON DELETE CASCADE
        const stmt = db.prepare('DELETE FROM freelancers WHERE id = ?');
        stmt.run(id);
    } catch (error) {
        logger.error('Failed to delete freelancer', { error, id });
        throw new Error('Failed to delete freelancer');
    }
}

/**
 * FREELANCER ROLES CRUD
 */

export function getFreelancerRoles(activeOnly: boolean = false): FreelancerRole[] {
    const db = getDb();
    let query = 'SELECT * FROM freelancer_roles';
    if (activeOnly) {
        query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY name ASC';
    
    const rows = db.prepare(query).all() as any[];
    return rows.map(row => ({
        ...row,
        is_active: Boolean(row.is_active)
    }));
}

/**
 * FREELANCER JOBS CRUD
 */

export function getFreelancerJobs(startDate?: string, endDate?: string, freelancerId?: string): FreelancerJobWithDetails[] {
    const db = getDb();
    let query = `
        SELECT 
            fj.*, 
            f.name as freelancer_name, 
            fr.name as role_name, 
            fr.short_code as role_short_code,
            b.customer_name as booking_customer_name
        FROM freelancer_jobs fj
        JOIN freelancers f ON fj.freelancer_id = f.id
        JOIN freelancer_roles fr ON fj.role_id = fr.id
        LEFT JOIN bookings b ON fj.booking_id = b.id
        WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (startDate) {
        query += ' AND fj.work_date >= ?';
        params.push(startDate);
    }
    
    if (endDate) {
        query += ' AND fj.work_date <= ?';
        params.push(endDate);
    }
    
    if (freelancerId) {
        query += ' AND fj.freelancer_id = ?';
        params.push(freelancerId);
    }
    
    query += ' ORDER BY fj.work_date DESC, fj.created_at DESC';
    
    return db.prepare(query).all(...params) as FreelancerJobWithDetails[];
}

export function createFreelancerJob(data: Omit<FreelancerJob, 'id' | 'created_at' | 'updated_at'>): FreelancerJob {
    const db = getDb();
    const id = randomUUID();
    
    try {
        const stmt = db.prepare(`
            INSERT INTO freelancer_jobs (id, freelancer_id, booking_id, role_id, work_date, fee, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            id,
            data.freelancer_id,
            data.booking_id || null,
            data.role_id,
            data.work_date,
            data.fee,
            data.notes || null,
            data.created_by || null
        );
        
        return {
            id,
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    } catch (error) {
        logger.error('Failed to create freelancer job', { error, data });
        throw new Error('Failed to create freelancer job log');
    }
}

export function deleteFreelancerJob(id: string): void {
    const db = getDb();
    try {
        const stmt = db.prepare('DELETE FROM freelancer_jobs WHERE id = ?');
        stmt.run(id);
    } catch (error) {
        logger.error('Failed to delete freelancer job', { error, id });
        throw new Error('Failed to delete freelancer job');
    }
}

/**
 * RECAP METRICS
 */

export function getFreelancerMonthlyRecap(year: string, month: string): FreelancerMonthlyRecap[] {
    const db = getDb();
    
    // Format month for LIKE query, e.g., '2023-10-%'
    const monthPrefix = `${year}-${month.padStart(2, '0')}-`;
    
    try {
        const stmt = db.prepare(`
            SELECT 
                f.id as freelancer_id,
                f.name as freelancer_name,
                COUNT(fj.id) as total_jobs,
                SUM(fj.fee) as total_fee
            FROM freelancers f
            LEFT JOIN freelancer_jobs fj ON f.id = fj.freelancer_id AND fj.work_date LIKE ?
            GROUP BY f.id, f.name
            HAVING total_jobs > 0 OR f.is_active = 1
            ORDER BY total_fee DESC, f.name ASC
        `);
        
        return stmt.all(`${monthPrefix}%`) as FreelancerMonthlyRecap[];
    } catch (error) {
        logger.error('Failed to generate freelancer recap', { error, year, month });
        throw new Error('Failed to generate monthly recap');
    }
}
