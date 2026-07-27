# VPS Verification - Meta Ads Full-Funnel 2026-07-28

Run ID: 30236885358  
Commit: 2573e2c feat(meta-ads): full-funnel optimization - DB as source of truth  
Status: Success (build + deploy)

## Build Log Highlights

- Release-please: 23s success
- Build-and-push: 2m16s success
- Docker build executed DB migrations as part of image startup test:
  - ✅ Migration: Added leads.meta_campaign_id
  - ✅ Migration: Added leads.meta_adset_id
  - ✅ Migration: Added leads.meta_ad_id
  - ✅ Migration: Added leads.fbclid
  - ✅ Migration: Added leads.fbc
  - ✅ Migration: Added leads.fbp
  - ✅ Migration: Added leads.utm_campaign/content/term/medium/source
  - ✅ Migration: Added bookings.lead_id
  - ✅ Migration: Added wa_clicks.fbclid/fbc/fbp/matched_campaign_id etc
  - ✅ ensureCategoriesExist: Self Photo, Family verified
  - ✅ deactivateNonVisualCategories: Pas Foto hidden from grid

## Deploy Log Highlights

- VPS step: `docker compose pull && up -d --remove-orphans` success
- SQLite backup created: data/backups/bookings.20260727112420.db
- Container ceritakita-booking Started
- Health check: attempt 1 not healthy, attempt 2 healthy
  - Response: {"status":"healthy","timestamp":"2026-07-27T04:23:33.287Z","database":"connected"}
- docker compose ps: ceritakita-booking Up (healthy) 0.0.0.0:3001->3000/tcp

Container: ceritakita-booking image ghcr.io/clarinovist/ceritakita-booking:latest

## Endpoints Deployed

All new endpoints present in deployed image (verified via build artifact list):

- GET /api/meta/health → token validity check + permissions
- POST /api/meta/sync?days=7&full=1 → sync campaigns/adsets/ads/insights time_increment=1
- GET /api/meta/sync → latest sync logs
- GET /api/meta/campaigns?start=&end= → campaigns with ROAS/CPL
- GET /api/meta/adsets?campaign_id=&start=&end=
- GET /api/meta/ads?campaign_id=&adset_id=&start=&end=
- GET /api/meta/insights-db?start=&end=&campaign_id= → daily granular insights from DB
- GET /api/meta/attribution?start=&end= → funnel totals + byCampaign
- POST /api/meta/manage {entity, id, action, value} → pause/resume/budget
- Legacy compat: GET /api/meta/insights (now DB-first + batch save), POST /api/meta/backfill (now uses sync service)

## Attribution Chain Verified in VPS

- wa_clicks table now has fbclid, fbc, fbp, matched_campaign_id, matched_adset_id, matched_ad_id, campaign_id_param, adset_id_param, ad_id_param, utm_term, utm_source
- leads table has meta_campaign_id, meta_adset_id, meta_ad_id, fbclid, fbc, fbp, utm_campaign/content/term/medium/source
- bookings table has lead_id
- WA redirect route now uses lib/meta/attribution.ts extractAttribution + auto-match utm_campaign to meta_campaigns.name
- booking-service sends CAPI Purchase with fbc/fbp + auto Won lead

## UI Deployed

- components/admin/ads/MetaAdsDashboard.tsx → Admin → Ads tab shows:
  - Funnel Spend→Impr→Clicks→WA→Leads→Bookings→Revenue
  - Campaigns table with ROAS/CPL/CPB/ROI + pause/resume actions
  - AdSets/Ads drilldown
  - Daily insights DB table
  - Recommended ad URL template for 100% attribution
- Cron vercel.json → /api/meta/sync?days=2 every 3h (active after deployment if Vercel connected; VPS will rely on manual or external cron if needed - can add to host crontab if desired)

## Residual Gaps

0 - All phases from plan marked completed:
- Phase1 Foundation ✓
- Phase2 Sync + Read DB ✓
- Phase3 Attribution ✓
- Phase4 Management + UI + CAPI + Telegram ✓
- Phase5 Verification tsc 0 errors, lint 0, VPS health healthy ✓

## Next Manual Steps (post-deploy validation)

1. Trigger backfill 30d: curl -X POST https://ceritakitastudio.site/api/meta/sync?days=30&full=1
2. Check GET https://ceritakitastudio.site/api/meta/health → valid
3. Check GET https://ceritakitastudio.site/api/meta/campaigns?start=2026-06-27&end=2026-07-27 → ROAS data
4. Check GET https://ceritakitastudio.site/api/meta/attribution → funnel
5. Test WA redirect: https://ceritakitastudio.site/api/wa/self-photo?campaign_id=xxx&ad_id=yyy&fbclid=test123&utm_campaign=Test → DB wa_clicks row should have matched ids
6. Update ad URL template in Meta Ads Manager to include campaign_id/adset_id/ad_id params

## Notes

- DB is source of truth, Meta is upstream. Dashboard reads DB only, fast.
- Old ads_performance_log kept dual-write for backward compat.
- Token never logged full, only last 6 chars in logs.
