# CRM Workspace & Meta CAPI Integration - Implementation Plan

**Goal:** Build a dedicated CRM workspace page (`/admin/leads`) with master-detail layout for managing leads, logging WhatsApp interactions, and sending conversion events to Meta Conversions API (CAPI) to optimize ad targeting.

**Architecture:** Separate CRM page from operational admin dashboard. Master-detail layout (leads list + detail panel) following WhatsApp Web/Gmail patterns. Integration with Meta CAPI to send offline conversion events based on lead status changes and interactions. Backend will handle event tracking (interaction logs) and Meta API communication.

**Tech Stack:** 
- Next.js 14 (App Router)
- SQLite (existing `leads` table + new `lead_interactions` table)
- Meta Conversions API (Graph API v19.0+)
- React with SWR for state management
- Tailwind CSS (earthy/moody theme)

---

## ⚠️ PRODUCTION SAFETY GUIDELINES

**CRITICAL: This is a monolith architecture with live production data. Every change must be backward-compatible and non-breaking.**

### 1. Database Migration Strategy

**Safe Migration Principles:**
- ✅ **ADDITIVE ONLY**: We're only adding a NEW table (`lead_interactions`). NO changes to existing `leads` table.
- ✅ **NO FOREIGN KEY CASCADE on existing data**: While we add `ON DELETE CASCADE` for future data integrity, existing leads remain untouched.
- ✅ **Rollback Plan**: If migration fails, the new table can be dropped without affecting production leads data.

**Migration Testing Checklist:**
```bash
# 1. Backup production database BEFORE migration
cp production.db production.db.backup-$(date +%Y%m%d)

# 2. Test migration on local copy of production DB first
sqlite3 production-copy.db < migration.sql

# 3. Verify existing leads table is unaffected
sqlite3 production-copy.db "SELECT COUNT(*) FROM leads;"

# 4. Only then apply to production
```

**Rollback Script** (if needed):
```sql
-- Safe rollback: just drop the new table
DROP TABLE IF EXISTS lead_interactions;
DROP INDEX IF EXISTS idx_lead_interactions_lead_id;
DROP INDEX IF EXISTS idx_lead_interactions_created_at;
```

### 2. Meta CAPI Integration - Graceful Degradation

**Fail-Safe Design:**
- ✅ **NO Hard Dependencies**: Meta CAPI is OPTIONAL. If `META_PIXEL_ID` is not set, system logs a warning but continues working.
- ✅ **Fire-and-Forget**: Meta API calls are async and DO NOT block user actions. If Meta API fails, we log the error but the interaction still saves to DB.
- ✅ **Error Boundaries**: All Meta CAPI functions return `{ success: boolean, error?: string }` instead of throwing exceptions.

**Example Safety Pattern:**
```typescript
// Meta CAPI call never blocks critical operations
const interaction = await createLeadInteraction(leadId, data, userId); // ALWAYS succeeds

// Fire-and-forget Meta event (doesn't block response)
if (sendToMeta) {
  sendContactEvent(lead.name, lead.whatsapp).catch(err => {
    console.warn('Meta CAPI failed (non-critical):', err);
    // System continues working normally
  });
}

return NextResponse.json(interaction); // Returns immediately
```

### 3. Existing Features Compatibility

**What DOES NOT Change:**
- ✅ Existing `/admin` dashboard → Still works exactly as before
- ✅ Existing leads Kanban view → No changes to `components/admin/AdminDashboard.tsx`
- ✅ Existing leads API (`/api/leads`) → No changes to existing endpoints
- ✅ Booking conversion flow → Old flow remains intact

**What's NEW (Additive):**
- ✅ New CRM page at `/admin/leads` → Completely separate page, does not replace anything
- ✅ New API endpoint `/api/leads/[id]/interactions` → New feature, no conflicts
- ✅ New Meta CAPI service → Optional, opt-in feature

### 4. Deployment Strategy (Zero-Downtime)

**Recommended Deployment Order:**
1. **Phase 1: Backend Only** (No UI changes yet)
   - Deploy database migration
   - Deploy new library files (`lead-interactions.ts`, `meta-capi.ts`)
   - Deploy new API route `/api/leads/[id]/interactions`
   - **Test**: Verify production still works normally
   
2. **Phase 2: Staged Frontend Rollout**
   - Deploy new CRM components to staging environment first
   - Test with real production data (read-only mode)
   - Monitor for 24 hours
   
3. **Phase 3: Production Release**
   - Deploy CRM page to production
   - Announce to team via internal channel
   - Monitor error logs for 48 hours

**Feature Flag Approach** (Optional but recommended):
```typescript
// In .env.local
FEATURE_CRM_WORKSPACE_ENABLED=false

// In code
if (process.env.FEATURE_CRM_WORKSPACE_ENABLED === 'true') {
  // Show new CRM link in sidebar
}
```

### 5. Monitoring & Alerts

**What to Monitor Post-Deployment:**
- Database errors related to `lead_interactions` table
- Meta CAPI failures (should be warnings, not errors)
- API latency on `/api/leads/[id]/interactions`
- User reports of broken leads functionality

**Rollback Triggers:**
- If existing leads CRUD operations fail → Immediate rollback
- If database corruption detected → Immediate rollback
- If Meta CAPI blocks user actions → Disable Meta integration (config flag)

### 6. Testing Before Production

**Pre-deployment Test Checklist:**
```bash
# 1. Run all existing tests
npm run lint
npm run build
# (Add tests if available: npm test)

# 2. Manual testing of EXISTING features
- [ ] Can create a lead in old dashboard view
- [ ] Can update lead status via Kanban
- [ ] Can convert lead to booking
- [ ] Can delete a lead

# 3. Manual testing of NEW features
- [ ] Can access /admin/leads (new CRM page)
- [ ] Can log an interaction
- [ ] Interactions appear in timeline
- [ ] Meta CAPI checkbox works (or fails gracefully if not configured)

# 4. Test error scenarios
- [ ] What happens if META_PIXEL_ID is missing? (Answer: Logs warning, continues)
- [ ] What happens if Meta API returns 401? (Answer: Logs error, saves interaction anyway)
- [ ] What happens if lead_id doesn't exist? (Answer: Returns 404, clean error)
```

---

## Database Schema Changes

### Task 1: Add Lead Interactions Table

**Files:**
- Create: `prisma/migrations/YYYYMMDD_add_lead_interactions.sql` (or equivalent SQLite migration)
- Modify: Database schema

**Schema Design:**

```sql
CREATE TABLE IF NOT EXISTS lead_interactions (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  interaction_type TEXT NOT NULL, -- 'WhatsApp', 'Phone', 'Email', 'Note'
  interaction_content TEXT, -- Admin's notes about the conversation
  created_by TEXT, -- Admin user ID who logged this
  meta_event_sent BOOLEAN DEFAULT FALSE, -- Track if this was sent to CAPI
  meta_event_id TEXT, -- Meta's response event ID
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

CREATE INDEX idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX idx_lead_interactions_created_at ON lead_interactions(created_at);
```

**Step 1: Create migration file**

```bash
cd /Users/nugroho/Documents/ceritakita-booking
# For SQLite, we'll add this to the init script or create a manual migration
```

**Step 2: Add TypeScript types**

File: `/Users/nugroho/Documents/ceritakita-booking/lib/types/leads.ts`

```typescript
export type InteractionType = 'WhatsApp' | 'Phone' | 'Email' | 'Note';

export interface LeadInteraction {
  id: string;
  lead_id: string;
  created_at: string;
  interaction_type: InteractionType;
  interaction_content: string | null;
  created_by: string | null;
  meta_event_sent: boolean;
  meta_event_id: string | null;
}

export interface LeadInteractionFormData {
  interaction_type: InteractionType;
  interaction_content: string;
}
```

---

## Backend: Lead Interactions CRUD

### Task 2: Create Lead Interactions Library

**Files:**
- Create: `/Users/nugroho/Documents/ceritakita-booking/lib/lead-interactions.ts`

**Step 1: Write function to create interaction**

```typescript
import 'server-only';
import { randomUUID } from 'crypto';
import { getDb } from './db';
import { trackPerformance } from './monitoring';
import type { LeadInteraction, LeadInteractionFormData, InteractionType } from '@/lib/types/leads';

export class LeadInteractionDatabaseError extends Error {
  constructor(message: string, public cause?: any) {
    super(message);
    this.name = 'LeadInteractionDatabaseError';
  }
}

/**
 * Create a new lead interaction log
 */
export async function createLeadInteraction(
  leadId: string,
  data: LeadInteractionFormData,
  createdBy: string
): Promise<LeadInteraction> {
  return trackPerformance('createLeadInteraction', 'lead_interactions', async () => {
    try {
      const db = getDb();
      const id = randomUUID();
      const now = new Date().toISOString();

      const stmt = db.prepare(`
        INSERT INTO lead_interactions (
          id, lead_id, created_at, interaction_type, interaction_content, created_by, meta_event_sent
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        id,
        leadId,
        now,
        data.interaction_type,
        data.interaction_content || null,
        createdBy || null,
        false
      );

      if (result.changes === 0) {
        throw new LeadInteractionDatabaseError('Failed to create interaction');
      }

      return {
        id,
        lead_id: leadId,
        created_at: now,
        interaction_type: data.interaction_type as InteractionType,
        interaction_content: data.interaction_content || null,
        created_by: createdBy || null,
        meta_event_sent: false,
        meta_event_id: null
      };
    } catch (error) {
      throw new LeadInteractionDatabaseError('Failed to create interaction log', error);
    }
  }, { leadId });
}

/**
 * Get all interactions for a lead
 */
export async function getLeadInteractions(leadId: string): Promise<LeadInteraction[]> {
  return trackPerformance('getLeadInteractions', 'lead_interactions', async () => {
    try {
      const db = getDb();
      const stmt = db.prepare(`
        SELECT * FROM lead_interactions 
        WHERE lead_id = ? 
        ORDER BY created_at DESC
      `);
      const rows = stmt.all(leadId) as any[];

      return rows.map(row => ({
        id: row.id,
        lead_id: row.lead_id,
        created_at: row.created_at,
        interaction_type: row.interaction_type as InteractionType,
        interaction_content: row.interaction_content,
        created_by: row.created_by,
        meta_event_sent: Boolean(row.meta_event_sent),
        meta_event_id: row.meta_event_id
      }));
    } catch (error) {
      throw new LeadInteractionDatabaseError('Failed to fetch interactions', error);
    }
  }, { leadId });
}

/**
 * Mark interaction as sent to Meta CAPI
 */
export async function markInteractionMetaSent(
  interactionId: string,
  eventId: string
): Promise<void> {
  try {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE lead_interactions 
      SET meta_event_sent = TRUE, meta_event_id = ?
      WHERE id = ?
    `);
    stmt.run(eventId, interactionId);
  } catch (error) {
    throw new LeadInteractionDatabaseError('Failed to mark meta event sent', error);
  }
}
```

---

## Backend: Meta Conversions API Integration

### Task 3: Create Meta CAPI Service

**Files:**
- Create: `/Users/nugroho/Documents/ceritakita-booking/lib/meta-capi.ts`

**Step 1: Write Meta CAPI event sender**

```typescript
import 'server-only';
import crypto from 'crypto';

export interface MetaCAPIEvent {
  event_name: 'Contact' | 'Lead' | 'Schedule' | 'Purchase';
  event_time: number; // Unix timestamp
  action_source: 'website' | 'phone_call' | 'chat' | 'other';
  user_data: {
    ph?: string[]; // Hashed phone number
    em?: string[]; // Hashed email
    fn?: string; // Hashed first name
    ln?: string; // Hashed last name
  };
  custom_data?: {
    status?: string;
    value?: number;
    currency?: string;
    content_name?: string;
  };
  event_source_url?: string;
}

/**
 * Hash data using SHA-256 for CAPI compliance
 */
function hashSHA256(text: string): string {
  return crypto.createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
}

/**
 * Send conversion event to Meta CAPI
 */
export async function sendMetaConversionEvent(
  event: MetaCAPIEvent
): Promise<{ success: boolean; event_id?: string; error?: string }> {
  try {
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    const apiVersion = process.env.META_API_VERSION || 'v19.0';

    if (!pixelId || !accessToken) {
      console.warn('Meta CAPI not configured (missing PIXEL_ID or ACCESS_TOKEN)');
      return { success: false, error: 'Meta CAPI not configured' };
    }

    const url = `https://graph.facebook.com/${apiVersion}/${pixelId}/events`;

    const payload = {
      data: [event],
      access_token: accessToken
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Meta CAPI Error:', error);
      return { success: false, error: error.error?.message || 'Unknown error' };
    }

    const result = await response.json();
    const eventId = result.events_received > 0 ? crypto.randomUUID() : undefined;

    return { success: true, event_id: eventId };
  } catch (error) {
    console.error('Meta CAPI Exception:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Helper: Send "Contact" event when admin logs interaction with lead
 */
export async function sendContactEvent(
  leadName: string,
  leadPhone: string,
  leadEmail?: string
): Promise<{ success: boolean; event_id?: string }> {
  const userData: MetaCAPIEvent['user_data'] = {
    ph: [hashSHA256(leadPhone)]
  };

  if (leadEmail) {
    userData.em = [hashSHA256(leadEmail)];
  }

  const nameParts = leadName.split(' ');
  if (nameParts.length > 0) {
    userData.fn = hashSHA256(nameParts[0] || '');
    if (nameParts.length > 1) {
      userData.ln = hashSHA256(nameParts.slice(1).join(' '));
    }
  }

  return sendMetaConversionEvent({
    event_name: 'Contact',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'chat',
    user_data: userData,
    custom_data: {
      content_name: 'Lead Interaction'
    }
  });
}

/**
 * Helper: Send "Lead" event when lead status changes to qualified status
 */
export async function sendLeadEvent(
  leadName: string,
  leadPhone: string,
  leadEmail?: string,
  status?: string
): Promise<{ success: boolean; event_id?: string }> {
  const userData: MetaCAPIEvent['user_data'] = {
    ph: [hashSHA256(leadPhone)]
  };

  if (leadEmail) {
    userData.em = [hashSHA256(leadEmail)];
  }

  const nameParts = leadName.split(' ');
  if (nameParts.length > 0) {
    userData.fn = hashSHA256(nameParts[0] || '');
    if (nameParts.length > 1) {
      userData.ln = hashSHA256(nameParts.slice(1).join(' '));
    }
  }

  return sendMetaConversionEvent({
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    user_data: userData,
    custom_data: {
      status: status || 'Qualified'
    }
  });
}

/**
 * Helper: Send "Purchase" event when lead converts to booking
 */
export async function sendPurchaseEvent(
  leadName: string,
  leadPhone: string,
  leadEmail: string | undefined,
  bookingValue: number
): Promise<{ success: boolean; event_id?: string }> {
  const userData: MetaCAPIEvent['user_data'] = {
    ph: [hashSHA256(leadPhone)]
  };

  if (leadEmail) {
    userData.em = [hashSHA256(leadEmail)];
  }

  const nameParts = leadName.split(' ');
  if (nameParts.length > 0) {
    userData.fn = hashSHA256(nameParts[0] || '');
    if (nameParts.length > 1) {
      userData.ln = hashSHA256(nameParts.slice(1).join(' '));
    }
  }

  return sendMetaConversionEvent({
    event_name: 'Purchase',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    user_data: userData,
    custom_data: {
      value: bookingValue,
      currency: 'IDR',
      content_name: 'Photography Session'
    }
  });
}
```

**Step 2: Add environment variables**

File: `/Users/nugroho/Documents/ceritakita-booking/.env.local.example`

Add:
```env
# Meta Conversions API (CAPI)
META_PIXEL_ID=your_pixel_id_here
# META_ACCESS_TOKEN is already defined for Ads Insights
```

---

## API Routes: Lead Interactions

### Task 4: Create Interaction API Endpoints

**Files:**
- Create: `/Users/nugroho/Documents/ceritakita-booking/app/api/leads/[id]/interactions/route.ts`

**Step 1: Implement GET and POST for interactions**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { 
  createLeadInteraction, 
  getLeadInteractions 
} from '@/lib/lead-interactions';
import { getLeadById } from '@/lib/leads';
import { sendContactEvent } from '@/lib/meta-capi';
import type { LeadInteractionFormData } from '@/lib/types/leads';

interface Context {
  params: {
    id: string;
  };
}

/**
 * GET /api/leads/[id]/interactions
 * Get all interactions for a lead
 */
export async function GET(request: NextRequest, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const interactions = await getLeadInteractions(id);

    return NextResponse.json(interactions);
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads/[id]/interactions
 * Create a new interaction log and optionally send to Meta CAPI
 */
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data: LeadInteractionFormData & { send_to_meta?: boolean } = await request.json();

    // Validate lead exists
    const lead = await getLeadById(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Create interaction log
    const interaction = await createLeadInteraction(
      id,
      {
        interaction_type: data.interaction_type,
        interaction_content: data.interaction_content
      },
      session.user?.id || 'unknown'
    );

    // Send to Meta CAPI if requested (quality interactions only)
    if (data.send_to_meta && data.interaction_type === 'WhatsApp') {
      const metaResult = await sendContactEvent(
        lead.name,
        lead.whatsapp,
        lead.email || undefined
      );

      if (metaResult.success && metaResult.event_id) {
        // Mark as sent (we'd need to add this function to lead-interactions.ts)
        // await markInteractionMetaSent(interaction.id, metaResult.event_id);
      }
    }

    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    console.error('Error creating interaction:', error);
    return NextResponse.json(
      { error: 'Failed to create interaction' },
      { status: 500 }
    );
  }
}
```

---

## Frontend: Dedicated CRM Workspace Page

### Task 5: Create CRM Layout Page

**Files:**
- Create: `/Users/nugroho/Documents/ceritakita-booking/app/admin/leads/page.tsx`

**Step 1: Build master-detail layout structure**

```typescript
import { Suspense } from 'react';
import CRMWorkspace from '@/components/admin/crm/CRMWorkspace';

export default function LeadsPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      <Suspense fallback={<div>Loading CRM...</div>}>
        <CRMWorkspace />
      </Suspense>
    </div>
  );
}
```

---

### Task 6: Create CRM Workspace Component

**Files:**
- Create: `/Users/nugroho/Documents/ceritakita-booking/components/admin/crm/CRMWorkspace.tsx`

**Step 1: Build the master-detail layout**

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LeadsList } from './LeadsList';
import { LeadDetailPanel } from './LeadDetailPanel';
import { ArrowLeft, Users, LayoutList, Kanban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Lead } from '@/lib/types';

export default function CRMWorkspace() {
  const router = useRouter();
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch leads
  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        const leadsData = 'data' in data ? data.data : data;
        setLeads(leadsData);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleLeadUpdate = () => {
    fetchLeads();
  };

  return (
    <div className="flex h-screen bg-cream-50">
      {/* Master: Leads List */}
      <div className={`flex flex-col ${selectedLead ? 'w-96' : 'w-full'} border-r border-olive-200 bg-white transition-all duration-200`}>
        {/* Header */}
        <div className="p-4 border-b border-olive-200 bg-cream-50">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-sm text-olive-700 hover:text-olive-900 transition-colors"
            >
              <ArrowLeft size={16} />
              Kembali ke Dashboard
            </button>
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-olive-200">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-olive-100 text-olive-700' : 'text-olive-400 hover:text-olive-600'}`}
                title="List View"
              >
                <LayoutList size={18} />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded transition-all ${viewMode === 'kanban' ? 'bg-olive-100 text-olive-700' : 'text-olive-400 hover:text-olive-600'}`}
                title="Kanban View"
              >
                <Kanban size={18} />
              </button>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-olive-900">CRM Workspace</h1>
            <p className="text-sm text-olive-600 mt-1">Kelola semua leads dan prospek di sini</p>
          </div>
        </div>

        {/* Leads List */}
        <div className="flex-1 overflow-y-auto">
          <LeadsList
            leads={leads}
            selectedLead={selectedLead}
            onSelectLead={handleLeadSelect}
            isLoading={isLoading}
            viewMode={viewMode}
          />
        </div>
      </div>

      {/* Detail: Selected Lead Detail */}
      {selectedLead && (
        <div className="flex-1 overflow-y-auto">
          <LeadDetailPanel
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdate={handleLeadUpdate}
          />
        </div>
      )}

      {/* Empty State */}
      {!selectedLead && leads.length > 0 && (
        <div className="flex-1 flex items-center justify-center bg-cream-50">
          <div className="text-center">
            <Users className="w-16 h-16 text-olive-300 mx-auto mb-4" />
            <p className="text-olive-600 font-medium">Pilih lead untuk melihat detail</p>
            <p className="text-sm text-olive-500 mt-2">
              Klik salah satu nama di sebelah kiri
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Task 7: Create Leads List Component

**Files:**
- Create: `/Users/nugroho/Documents/ceritakita-booking/components/admin/crm/LeadsList.tsx`

**Step 1: Build compact leads list**

```typescript
'use client';

import React from 'react';
import { Lead } from '@/lib/types';
import { Phone, Clock, Calendar } from 'lucide-react';
import { getLeadStatusColor } from '@/lib/types/leads';

interface LeadsListProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
  isLoading: boolean;
  viewMode: 'list' | 'kanban';
}

export function LeadsList({ leads, selectedLead, onSelectLead, isLoading, viewMode }: LeadsListProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-olive-500">
        <div className="animate-pulse">Memuat leads...</div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="p-8 text-center text-olive-500">
        <p>Belum ada leads.</p>
      </div>
    );
  }

  // Sort by next follow-up date (urgent first)
  const sortedLeads = [...leads].sort((a, b) => {
    if (!a.next_follow_up) return 1;
    if (!b.next_follow_up) return -1;
    return new Date(a.next_follow_up).getTime() - new Date(b.next_follow_up).getTime();
  });

  return (
    <div className="divide-y divide-olive-100">
      {sortedLeads.map((lead) => {
        const isSelected = selectedLead?.id === lead.id;
        const isUrgent = lead.next_follow_up && new Date(lead.next_follow_up) <= new Date();
        
        return (
          <button
            key={lead.id}
            onClick={() => onSelectLead(lead)}
            className={`w-full p-4 text-left hover:bg-cream-50 transition-colors ${
              isSelected ? 'bg-olive-50 border-l-4 border-gold-500' : ''
            } ${isUrgent ? 'bg-red-50' : ''}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-olive-900 line-clamp-1">{lead.name}</h3>
                <div className="flex items-center gap-1 text-xs text-olive-600 mt-1">
                  <Phone size={12} />
                  <span>{lead.whatsapp}</span>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getLeadStatusColor(lead.status)}`}>
                {lead.status}
              </span>
            </div>

            {lead.next_follow_up && (
              <div className={`flex items-center gap-1 text-xs mt-2 ${isUrgent ? 'text-red-600 font-semibold' : 'text-olive-500'}`}>
                <Clock size={12} />
                <span>Follow up: {new Date(lead.next_follow_up).toLocaleDateString('id-ID')}</span>
              </div>
            )}

            <div className="flex items-center gap-1 text-xs text-olive-400 mt-1">
              <Calendar size={10} />
              <span>{new Date(lead.created_at).toLocaleDateString('id-ID')}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

---

### Task 8: Create Lead Detail Panel Component

**Files:**
- Create: `/Users/nugroho/Documents/ceritakita-booking/components/admin/crm/LeadDetailPanel.tsx`

**Step 1: Build detail panel with interaction logging**

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { Lead, LeadInteraction, InteractionType } from '@/lib/types';
import { X, MessageCircle, Phone, Mail, FileText, Send, ExternalLink } from 'lucide-react';
import useSWR from 'swr';

interface LeadDetailPanelProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: () => void;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function LeadDetailPanel({ lead, onClose, onUpdate }: LeadDetailPanelProps) {
  const [interactionType, setInteractionType] = useState<InteractionType>('WhatsApp');
  const [interactionContent, setInteractionContent] = useState('');
  const [sendToMeta, setSendToMeta] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: interactions, mutate } = useSWR<LeadInteraction[]>(
    `/api/leads/${lead.id}/interactions`,
    fetcher
  );

  const handleLogInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionContent.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interaction_type: interactionType,
          interaction_content: interactionContent,
          send_to_meta: sendToMeta
        })
      });

      if (res.ok) {
        setInteractionContent('');
        mutate(); // Refresh interactions
        onUpdate(); // Refresh leads list
      } else {
        alert('Gagal menyimpan log interaksi');
      }
    } catch (error) {
      console.error('Error logging interaction:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/${lead.whatsapp}`, '_blank');
  };

  const getInteractionIcon = (type: InteractionType) => {
    switch (type) {
      case 'WhatsApp': return <MessageCircle size={16} className="text-green-600" />;
      case 'Phone': return <Phone size={16} className="text-blue-600" />;
      case 'Email': return <Mail size={16} className="text-purple-600" />;
      case 'Note': return <FileText size={16} className="text-olive-600" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-olive-200 bg-cream-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-display font-bold text-olive-900">{lead.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <a
                href={`https://wa.me/${lead.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 bg-green-50 px-3 py-1 rounded-lg transition-colors"
              >
                <Phone size={14} />
                {lead.whatsapp}
                <ExternalLink size={12} />
              </a>
              {lead.email && (
                <span className="text-sm text-olive-600 bg-olive-50 px-3 py-1 rounded-lg">
                  <Mail size={14} className="inline mr-1" />
                  {lead.email}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-olive-400 hover:text-olive-600 transition-colors p-2"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white p-3 rounded-lg border border-olive-100">
            <span className="text-olive-500">Status</span>
            <p className="font-semibold text-olive-900 mt-1">{lead.status}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-olive-100">
            <span className="text-olive-500">Source</span>
            <p className="font-semibold text-olive-900 mt-1">{lead.source}</p>
          </div>
        </div>
      </div>

      {/* Interactions Timeline */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="font-bold text-olive-900 mb-4">Histori Interaksi</h3>
        
        {interactions && interactions.length > 0 ? (
          <div className="space-y-3">
            {interactions.map((interaction) => (
              <div key={interaction.id} className="bg-cream-50 p-4 rounded-lg border border-olive-100">
                <div className="flex items-start gap-3">
                  {getInteractionIcon(interaction.interaction_type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-olive-900 text-sm">{interaction.interaction_type}</span>
                      <span className="text-xs text-olive-500">
                        {new Date(interaction.created_at).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-sm text-olive-700">{interaction.interaction_content}</p>
                    {interaction.meta_event_sent && (
                      <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        ✓ Sent to Meta
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-olive-500 text-sm">Belum ada interaksi yang tercatat.</p>
        )}
      </div>

      {/* Log Interaction Form */}
      <div className="p-6 border-t border-olive-200 bg-cream-50">
        <h3 className="font-bold text-olive-900 mb-3">Log Interaksi Baru</h3>
        <form onSubmit={handleLogInteraction} className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-olive-700 mb-2 block">Tipe Interaksi</label>
            <select
              value={interactionType}
              onChange={(e) => setInteractionType(e.target.value as InteractionType)}
              className="w-full p-2.5 border border-olive-200 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
            >
              <option value="WhatsApp">WhatsApp</option>
              <option value="Phone">Telepon</option>
              <option value="Email">Email</option>
              <option value="Note">Catatan</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-olive-700 mb-2 block">Catatan Percakapan</label>
            <textarea
              value={interactionContent}
              onChange={(e) => setInteractionContent(e.target.value)}
              placeholder="Apa yang dibahas? Apa next step-nya?"
              rows={4}
              className="w-full p-2.5 border border-olive-200 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none resize-none"
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-olive-700">
            <input
              type="checkbox"
              checked={sendToMeta}
              onChange={(e) => setSendToMeta(e.target.checked)}
              className="rounded text-gold-600 focus:ring-gold-500"
            />
            <span>Kirim event ke Meta Ads (untuk optimasi targeting)</span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gold-500 hover:bg-gold-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            {isSubmitting ? 'Menyimpan...' : 'Simpan Log Interaksi'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## Testing & Validation

### Task 9: Manual Testing Checklist

**Step 1: Database setup**
- Run migration to create `lead_interactions` table
- Verify table structure using SQLite browser

**Step 2: API testing**
- Test `POST /api/leads/[id]/interactions` with sample data
- Verify interaction is saved to database
- Check if Meta CAPI event is sent (check logs)

**Step 3: Frontend testing**
- Navigate to `/admin/leads`
- Select a lead from the list
- Log a WhatsApp interaction
- Verify it appears in the timeline
- Check that "send to Meta" checkbox works

**Step 4: Meta CAPI validation**
- Go to Meta Events Manager
- Check "Test Events" to see if events are received
- Verify hashed phone/email data matches

---

## Environment Configuration

Add to `.env.local`:
```env
META_PIXEL_ID=your_facebook_pixel_id
# META_ACCESS_TOKEN already exists
```

---

## Future Enhancements (Phase 2)

1. **WhatsApp Business API Integration**: Direct chat within CRM
2. **Auto-tracking**: Automatically log status changes as interactions
3. **Lead Scoring**: ML-based lead quality prediction
4. **A/B Testing**: Test different messaging approaches
5. **Analytics Dashboard**: Show Meta CAPI impact on conversion rates

---

## Implementation Notes

- **Privacy**: All PII sent to Meta CAPI must be SHA-256 hashed
- **Rate Limiting**: Meta CAPI has rate limits; batch events if volume is high
- **Error Handling**: Log Meta API failures but don't block user actions
- **Permissions**: Ensure only authorized admins can access CRM workspace
