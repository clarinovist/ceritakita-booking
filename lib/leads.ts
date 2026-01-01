import 'server-only';
import { randomUUID } from 'crypto';
import { getDb } from './db';
import type { Lead, LeadFormData, LeadUpdateData, LeadFilters, LeadStatus, LeadSource } from '@/lib/types';

/**
 * Lead Database Operations
 * Provides CRUD operations for the leads table
 */

export class LeadDatabaseError extends Error {
  constructor(message: string, public cause?: any) {
    super(message);
    this.name = 'LeadDatabaseError';
  }
}

/**
 * Get all leads with optional filtering
 */
export async function getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  try {
    const db = getDb();
    
    let query = 'SELECT * FROM leads';
    const params: any[] = [];
    const conditions: string[] = [];

    // Apply filters
    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters.source) {
      conditions.push('source = ?');
      params.push(filters.source);
    }

    if (filters.assigned_to) {
      conditions.push('assigned_to = ?');
      params.push(filters.assigned_to);
    }

    if (filters.date_range) {
      conditions.push('created_at >= ? AND created_at <= ?');
      params.push(filters.date_range.start, filters.date_range.end);
    }

    if (filters.search) {
      conditions.push('(name LIKE ? OR whatsapp LIKE ? OR email LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      name: row.name,
      whatsapp: row.whatsapp,
      email: row.email,
      status: row.status as LeadStatus,
      source: row.source as LeadSource,
      notes: row.notes,
      assigned_to: row.assigned_to,
      booking_id: row.booking_id,
      converted_at: row.converted_at,
      last_contacted_at: row.last_contacted_at,
      next_follow_up: row.next_follow_up
    }));
  } catch (error) {
    throw new LeadDatabaseError('Failed to fetch leads', error);
  }
}

/**
 * Get a single lead by ID
 */
export async function getLeadById(id: string): Promise<Lead | null> {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM leads WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      name: row.name,
      whatsapp: row.whatsapp,
      email: row.email,
      status: row.status as LeadStatus,
      source: row.source as LeadSource,
      notes: row.notes,
      assigned_to: row.assigned_to,
      booking_id: row.booking_id,
      converted_at: row.converted_at,
      last_contacted_at: row.last_contacted_at,
      next_follow_up: row.next_follow_up
    };
  } catch (error) {
    throw new LeadDatabaseError('Failed to fetch lead', error);
  }
}

/**
 * Create a new lead
 */
export async function createLead(data: LeadFormData): Promise<Lead> {
  try {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO leads (
        id, created_at, updated_at, name, whatsapp, email, status, source, 
        notes, assigned_to, next_follow_up
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      id,
      now,
      now,
      data.name,
      data.whatsapp,
      data.email || null,
      data.status,
      data.source,
      data.notes || null,
      data.assigned_to || null,
      data.next_follow_up || null
    );

    if (result.changes === 0) {
      throw new LeadDatabaseError('Failed to create lead');
    }

    const lead = await getLeadById(id);
    if (!lead) {
      throw new LeadDatabaseError('Lead created but not found');
    }

    return lead;
  } catch (error) {
    if (error instanceof LeadDatabaseError) throw error;
    throw new LeadDatabaseError('Failed to create lead', error);
  }
}

/**
 * Update a lead
 */
export async function updateLead(id: string, data: LeadUpdateData): Promise<Lead> {
  try {
    const db = getDb();
    const now = new Date().toISOString();

    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.whatsapp !== undefined) {
      updates.push('whatsapp = ?');
      params.push(data.whatsapp);
    }
    if (data.email !== undefined) {
      updates.push('email = ?');
      params.push(data.email);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }
    if (data.source !== undefined) {
      updates.push('source = ?');
      params.push(data.source);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      params.push(data.notes);
    }
    if (data.assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      params.push(data.assigned_to);
    }
    if (data.booking_id !== undefined) {
      updates.push('booking_id = ?');
      params.push(data.booking_id);
    }
    if (data.converted_at !== undefined) {
      updates.push('converted_at = ?');
      params.push(data.converted_at);
    }
    if (data.last_contacted_at !== undefined) {
      updates.push('last_contacted_at = ?');
      params.push(data.last_contacted_at);
    }
    if (data.next_follow_up !== undefined) {
      updates.push('next_follow_up = ?');
      params.push(data.next_follow_up);
    }

    if (updates.length === 0) {
      throw new LeadDatabaseError('No fields to update');
    }

    updates.push('updated_at = ?');
    params.push(now);
    params.push(id);

    const query = `UPDATE leads SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    const result = stmt.run(...params);

    if (result.changes === 0) {
      throw new LeadDatabaseError('Lead not found');
    }

    const lead = await getLeadById(id);
    if (!lead) {
      throw new LeadDatabaseError('Lead updated but not found');
    }

    return lead;
  } catch (error) {
    if (error instanceof LeadDatabaseError) throw error;
    throw new LeadDatabaseError('Failed to update lead', error);
  }
}

/**
 * Update lead status only
 */
export async function updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
  return updateLead(id, { status });
}

/**
 * Convert lead to booking
 */
export async function convertLeadToBooking(id: string, bookingId: string): Promise<Lead> {
  try {
    const now = new Date().toISOString();
    return updateLead(id, {
      status: 'Converted',
      booking_id: bookingId,
      converted_at: now
    });
  } catch (error) {
    throw new LeadDatabaseError('Failed to convert lead to booking', error);
  }
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string): Promise<boolean> {
  try {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM leads WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  } catch (error) {
    throw new LeadDatabaseError('Failed to delete lead', error);
  }
}

/**
 * Get lead statistics
 */
export async function getLeadStats() {
  try {
    const db = getDb();

    // Count by status
    const statusStmt = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM leads 
      GROUP BY status
    `);
    const statusRows = statusStmt.all() as any[];
    const byStatus = statusRows.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {} as Record<string, number>);

    // Count by source
    const sourceStmt = db.prepare(`
      SELECT source, COUNT(*) as count 
      FROM leads 
      GROUP BY source
    `);
    const sourceRows = sourceStmt.all() as any[];
    const bySource = sourceRows.reduce((acc, row) => {
      acc[row.source] = row.count;
      return acc;
    }, {} as Record<string, number>);

    // Total leads
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM leads');
    const totalResult = totalStmt.get() as any;

    // Leads that need follow-up (next_follow_up is in the past or today)
    const followUpStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM leads 
      WHERE next_follow_up <= date('now') AND status != 'Converted' AND status != 'Lost'
    `);
    const followUpResult = followUpStmt.get() as any;

    return {
      total: totalResult.count,
      byStatus,
      bySource,
      needsFollowUp: followUpResult.count
    };
  } catch (error) {
    throw new LeadDatabaseError('Failed to fetch lead statistics', error);
  }
}