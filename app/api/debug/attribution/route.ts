import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();

    const bookingsWithoutLead = db.prepare(`SELECT id, customer_name, customer_whatsapp, created_at, lead_id FROM bookings WHERE lead_id IS NULL OR lead_id = '' LIMIT 10`).all();
    const bookingsWithLead = db.prepare(`SELECT id, customer_name, customer_whatsapp, created_at, lead_id FROM bookings WHERE lead_id IS NOT NULL AND lead_id != '' LIMIT 10`).all();
    const leadsSample = db.prepare(`SELECT id, name, whatsapp, source, meta_campaign_id, utm_campaign, created_at FROM leads ORDER BY created_at DESC LIMIT 15`).all();
    const leadsMetaWithoutCampaign = db.prepare(`SELECT id, name, whatsapp, utm_campaign, meta_campaign_id, created_at FROM leads WHERE source = 'Meta Ads' AND (meta_campaign_id IS NULL OR meta_campaign_id = '') LIMIT 10`).all();
    const waSample = db.prepare(`SELECT id, source, utm_campaign, matched_campaign_id, campaign_id_param, ad_id_param, clicked_at FROM wa_clicks ORDER BY clicked_at DESC LIMIT 10`).all();

    const counts = {
      totalBookings: (db.prepare(`SELECT COUNT(*) as c FROM bookings`).get() as any).c,
      withLeadId: (db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE lead_id IS NOT NULL AND lead_id != ''`).get() as any).c,
      withoutLeadId: (db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE lead_id IS NULL OR lead_id = ''`).get() as any).c,
      totalLeads: (db.prepare(`SELECT COUNT(*) as c FROM leads`).get() as any).c,
      leadsMetaTotal: (db.prepare(`SELECT COUNT(*) as c FROM leads WHERE source = 'Meta Ads'`).get() as any).c,
      leadsMetaWithCampaign: (db.prepare(`SELECT COUNT(*) as c FROM leads WHERE source = 'Meta Ads' AND meta_campaign_id IS NOT NULL AND meta_campaign_id != ''`).get() as any).c,
      leadsMetaWithoutCampaign: (db.prepare(`SELECT COUNT(*) as c FROM leads WHERE source = 'Meta Ads' AND (meta_campaign_id IS NULL OR meta_campaign_id = '')`).get() as any).c,
      waTotal: (db.prepare(`SELECT COUNT(*) as c FROM wa_clicks`).get() as any).c,
      waMatched: (db.prepare(`SELECT COUNT(*) as c FROM wa_clicks WHERE matched_campaign_id IS NOT NULL AND matched_campaign_id != ''`).get() as any).c,
    };

    function normalizePhone(p: string) {
      const digits = (p || '').replace(/\D/g, '');
      return digits.slice(-11);
    }

    const bookingsForTest = bookingsWithoutLead.slice(0, 5) as any[];
    const leadsForTest = leadsSample.slice(0, 20) as any[];
    const phoneTests: any[] = [];
    for (const b of bookingsForTest) {
      const normB = normalizePhone(b.customer_whatsapp);
      const suffix = normB.slice(-10);
      const matches = leadsForTest.filter((l: any) => {
        const normL = normalizePhone(l.whatsapp);
        return normB.slice(-10) === normL.slice(-10) || normB.endsWith(normL.slice(-10)) || normL.endsWith(suffix);
      }).map((l: any) => ({ lead_id: l.id, lead_phone: l.whatsapp, norm: normalizePhone(l.whatsapp) }));
      phoneTests.push({
        booking_id: b.id,
        booking_phone: b.customer_whatsapp,
        normB,
        suffix,
        matches,
      });
    }

    return NextResponse.json({
      success: true,
      counts,
      bookingsWithoutLead,
      bookingsWithLead,
      leadsSample,
      leadsMetaWithoutCampaign,
      waSample,
      phoneTests,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
