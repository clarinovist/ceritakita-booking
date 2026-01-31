import { Lead } from './types/leads';
import { differenceInDays, parseISO } from 'date-fns';

export interface CRMStats {
    totalLeads: number;
    newInquiries: number;
    followUpsNeeded: number;
    conversionRate: number;
}

export function calculateCRMStats(leads: Lead[]): CRMStats {
    const total = leads.length;
    // status is 'New' in lib/types/leads.ts, but user in prompt said 'New Inquiry'
    // Checking current status in types, it's 'New'
    const newInquiries = leads.filter(l => l.status === 'New').length;

    const followUpsNeeded = leads.filter(l => {
        // use last_contacted_at if available, otherwise created_at
        const lastDateStr = l.last_contacted_at || l.created_at;
        if (!lastDateStr) return false;

        try {
            const lastDate = parseISO(lastDateStr);
            // follow up needed if stale for more than 2 days and not Won/Lost/Converted
            return differenceInDays(new Date(), lastDate) > 2 &&
                !['Won', 'Lost', 'Converted'].includes(l.status);
        } catch (e) {
            return false;
        }
    }).length;

    // won means Won or Converted
    const won = leads.filter(l => l.status === 'Won' || l.status === 'Converted').length;
    const conversion = total > 0 ? (won / total) * 100 : 0;

    return {
        totalLeads: total,
        newInquiries,
        followUpsNeeded,
        conversionRate: Math.round(conversion)
    };
}

export function getLeadAgeCategory(lead: Lead): 'hot' | 'warm' | 'stale' {
    const lastDateStr = lead.last_contacted_at || lead.created_at;
    if (!lastDateStr) return 'hot';

    try {
        const lastDate = parseISO(lastDateStr);
        const diff = differenceInDays(new Date(), lastDate);
        if (diff <= 1) return 'hot';
        if (diff <= 3) return 'warm';
        return 'stale';
    } catch (e) {
        return 'hot';
    }
}
