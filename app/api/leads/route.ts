import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import {
  getLeads,
  getLeadsPaginated,
  createLead,
  getLeadStats
} from '@/lib/leads';
import type { LeadFormData, LeadFilters, LeadStatus, LeadSource } from '@/lib/types';

/**
 * GET /api/leads
 * Get all leads with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters: LeadFilters = {};

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as LeadStatus;
    }

    if (searchParams.get('source')) {
      filters.source = searchParams.get('source') as LeadSource;
    }

    if (searchParams.get('assigned_to')) {
      filters.assigned_to = searchParams.get('assigned_to') as string;
    }

    if (searchParams.get('search')) {
      filters.search = searchParams.get('search') as string;
    }

    // Check if stats request
    if (searchParams.get('stats') === 'true') {
      const stats = await getLeadStats();
      return NextResponse.json(stats);
    }

    // Check pagination
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    if (page || limit) {
      const result = await getLeadsPaginated(filters, page || 1, limit || 20);
      return NextResponse.json(result);
    }

    const leads = await getLeads(filters);
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads
 * Create a new lead
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: LeadFormData = await request.json();

    // Basic validation
    if (!data.name || !data.whatsapp || !data.source || !data.status) {
      return NextResponse.json(
        { error: 'Missing required fields: name, whatsapp, source, status' },
        { status: 400 }
      );
    }

    const lead = await createLead(data);
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Lead with this WhatsApp number already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}