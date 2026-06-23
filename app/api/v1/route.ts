import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/api-v1-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/
 * API discovery — returns list of all available endpoints.
 * Agent calls this first to learn what's available.
 */
export async function GET(req: NextRequest) {
  const authError = requireAgentAuth(req);
  if (authError) return authError;

  return NextResponse.json({
    name: 'CeritaKita Agent API',
    version: '1.0.0',
    description: 'Read-only REST API for CeritaKita Studio booking system. All endpoints require Bearer token auth.',
    base_url: 'https://ceritakitastudio.site/api/v1',
    rate_limit: '60 requests per minute',
    endpoints: [
      {
        path: '/api/v1',
        method: 'GET',
        description: 'This discovery endpoint',
      },
      {
        path: '/api/v1/bookings',
        method: 'GET',
        description: 'List bookings with optional filters and pagination',
        params: [
          { name: 'status', type: 'string', description: 'Filter by status: Active, Completed, Cancelled, Rescheduled' },
          { name: 'startDate', type: 'string', description: 'Filter bookings from this date (YYYY-MM-DD)' },
          { name: 'endDate', type: 'string', description: 'Filter bookings until this date (YYYY-MM-DD)' },
          { name: 'photographer', type: 'string', description: 'Filter by photographer ID' },
          { name: 'page', type: 'number', description: 'Page number (default: 1)' },
          { name: 'limit', type: 'number', description: 'Results per page (default: 50, max: 100)' },
        ],
      },
      {
        path: '/api/v1/bookings/:id',
        method: 'GET',
        description: 'Get full booking detail including payments, addons, and reschedule history',
        params: [
          { name: 'id', type: 'string', description: 'Booking ID (UUID)' },
        ],
      },
      {
        path: '/api/v1/leads',
        method: 'GET',
        description: 'List leads with optional filters and pagination',
        params: [
          { name: 'status', type: 'string', description: 'Filter by status: New, Contacted, Follow Up, Won, Lost, Converted' },
          { name: 'source', type: 'string', description: 'Filter by source: Meta Ads, Organic, Referral, Instagram, WhatsApp, Phone Call, Website Form, Other' },
          { name: 'assigned_to', type: 'string', description: 'Filter by assigned user ID' },
          { name: 'page', type: 'number', description: 'Page number (default: 1)' },
          { name: 'limit', type: 'number', description: 'Results per page (default: 50, max: 100)' },
        ],
      },
      {
        path: '/api/v1/payments',
        method: 'GET',
        description: 'List payments with optional filters and pagination',
        params: [
          { name: 'booking_id', type: 'string', description: 'Filter by booking ID' },
          { name: 'startDate', type: 'string', description: 'Filter payments from this date (YYYY-MM-DD)' },
          { name: 'endDate', type: 'string', description: 'Filter payments until this date (YYYY-MM-DD)' },
          { name: 'page', type: 'number', description: 'Page number (default: 1)' },
          { name: 'limit', type: 'number', description: 'Results per page (default: 50, max: 100)' },
        ],
      },
      {
        path: '/api/v1/cash-position',
        method: 'GET',
        description: 'Cash position summary with monthly breakdown',
        params: [
          { name: 'startDate', type: 'string', description: 'Start date (YYYY-MM-DD, default: 6 months ago)' },
          { name: 'endDate', type: 'string', description: 'End date (YYYY-MM-DD, default: today)' },
        ],
      },
      {
        path: '/api/v1/pnl',
        method: 'GET',
        description: 'Profit & Loss report with revenue and expense breakdown by category',
        params: [
          { name: 'startDate', type: 'string', description: 'Start date (YYYY-MM-DD)' },
          { name: 'endDate', type: 'string', description: 'End date (YYYY-MM-DD)' },
        ],
      },
    ],
  });
}
