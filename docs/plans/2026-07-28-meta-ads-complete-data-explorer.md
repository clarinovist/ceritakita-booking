# Plan: Meta Ads Complete Data Ingestion & Data Explorer

Tanggal: 2026-07-28  
Status: Completed — Selesai & Terverifikasi  
Owner: CeritaKita Booking  
Related:
- `docs/plans/2026-07-28-meta-ads-full-funnel-optimization.md`
- `docs/plans/2026-07-28-meta-ads-final-verification.md`
- `docs/plans/2026-07-28-meta-ads-vps-verification.md`

## 1. Tujuan

Token Meta saat ini memiliki akses Marketing API yang cukup luas (`ads_read`,
`ads_management`, `business_management`). Dashboard saat ini sudah menyimpan
campaign/adset/ad dan beberapa metric harian, tetapi belum menjadi **data
warehouse kecil** yang menyimpan seluruh detail yang tersedia dan dapat
dieksplorasi user.

Target pekerjaan ini:

1. Mengambil seluruh field dan object yang **benar-benar diizinkan token**.
2. Menyimpan payload mentah agar field baru dari Meta tidak hilang.
3. Menyimpan bentuk terstruktur agar query, agregasi, dan UI tetap cepat.
4. Menampilkan detail account → campaign → adset → ad → creative → breakdown
   di Admin.
5. Tidak mencampur metric account/campaign/ad saat menghitung total.
6. Tetap idempotent, aman terhadap retry, pagination, dan rate limit.

> “Ambil semuanya” berarti semua data yang tersedia untuk ad account dan
> diizinkan permission/token, bukan memaksa endpoint yang membutuhkan scope
> tambahan atau akses Page/Lead Ads yang belum diberikan.

## 2. Temuan dan prinsip desain

### 2.1 Hierarchy Meta harus eksplisit

`meta_insights_daily` saat ini dapat berisi account, campaign, adset, dan ad
level. Metric yang sama pada satu tanggal bisa terlihat berulang apabila
account hanya memiliki satu campaign/ad. Ini bukan alasan untuk menghapus row:
level tersebut memang berbeda.

Semua fact insight baru wajib menyimpan:

```text
level = account | campaign | adset | ad
campaign_id
adset_id
ad_id
breakdown_type
breakdown_value
date_start/date_stop
```

Total dashboard harus memilih satu level canonical (campaign-level), sedangkan
ad/adset/breakdown hanya digunakan ketika user membuka detail.

### 2.2 Raw + curated

- **Raw**: simpan JSON response lengkap dan metadata request (endpoint, field
  set, sync run, HTTP status, hash payload).
- **Curated**: kolom typed untuk metric yang sering dipakai dan tabel normalisasi
  untuk action/conversion/creative.
- Field yang belum dikenal aplikasi tidak boleh hilang; UI dapat menampilkannya
  melalui Raw Inspector.

### 2.3 Capability-driven

Sebelum sync penuh, aplikasi harus mendeteksi endpoint/field yang tersedia.
Field yang ditolak Meta tidak boleh menggagalkan seluruh sync; simpan error
per field/endpoint dan lanjutkan field yang valid.

## 3. Scope data yang diambil

### P0 — wajib

1. **Ad account**
   - id, name, account status, currency, timezone, business, spend cap,
     amount spent, balance, funding/source metadata yang dikembalikan API.
2. **Campaign**
   - seluruh object campaign, objective, buying type, status/effective status,
     budget, bid strategy, start/stop time, special ad category, raw JSON.
3. **Ad set**
   - campaign relation, targeting JSON, optimization/billing goal, budget,
     bid, schedule, status/effective status, raw JSON.
4. **Ad**
   - adset/campaign relation, creative relation, tracking specs, status,
     preview-related ids, raw JSON.
5. **Creative**
   - object story/link/video/image, title/body, call-to-action, thumbnail,
     asset ids, object story spec, raw JSON.
6. **Insights harian**
   - campaign/adset/ad level dengan `time_increment=1`.
   - spend, impressions, reach, frequency, clicks, inline link clicks, CPC,
     CPM, CTR, CPP, results, cost per result, actions, action values,
     purchase ROAS bila tersedia, dan seluruh video view fields yang tersedia.

### P1 — detail analitik

Breakdown disimpan terpisah dan tidak dijumlahkan ke campaign total:

- age
- gender
- country/region/city bila tersedia
- publisher platform
- platform position
- device platform
- impression device
- placement yang didukung account

Untuk setiap breakdown, simpan kombinasi dimension lengkap di
`dimensions_json`, bukan hanya satu string, agar kombinasi placement/device
tidak kehilangan konteks.

### P2 — operasional dan audit

- account activity/history bila endpoint tersedia
- status/budget change history hasil action dari aplikasi
- sync cursor, pagination, request count, rate-limit response
- ad preview URL atau snapshot creative yang aman disimpan
- field availability/capability matrix per token/account/API version

### Di luar scope awal

- Custom Audience/person-level data, email/phone hash, dan PII audience.
- Lead Ads/Page inbox jika token belum memiliki permission Page/Leads.
- Automatic budget/pause rules tanpa approval eksplisit.
- Menyimpan access token atau URL yang mengandung access token.

## 4. Perubahan database yang direncanakan

### 4.1 Extend object tables

Pertahankan `meta_campaigns`, `meta_adsets`, dan `meta_ads` untuk kompatibilitas,
lalu tambahkan kolom typed yang sering dipakai. Payload lengkap tetap di
`raw_json`.

Tambahkan:

```sql
meta_accounts (
  id TEXT PRIMARY KEY,
  name TEXT,
  account_status TEXT,
  currency TEXT,
  timezone_name TEXT,
  timezone_offset_hours REAL,
  business_id TEXT,
  raw_json TEXT,
  synced_at TEXT
)

meta_creatives (
  id TEXT PRIMARY KEY,
  ad_id TEXT,
  campaign_id TEXT,
  creative_type TEXT,
  title TEXT,
  body TEXT,
  call_to_action TEXT,
  thumbnail_url TEXT,
  asset_ids_json TEXT,
  raw_json TEXT,
  synced_at TEXT
)
```

### 4.2 Insight fact table

Tambahkan `level` dan metadata dimensi ke `meta_insights_daily`. Jika perubahan
UNIQUE SQLite tidak aman dilakukan in-place, buat tabel v2, validasi, lalu
swap melalui migration idempotent dengan backup terlebih dahulu.

Target key:

```text
UNIQUE(
  date_record,
  level,
  campaign_id,
  adset_id,
  ad_id,
  breakdown_type,
  breakdown_value,
  dimensions_json_hash
)
```

Kolom tambahan:

```text
level
date_start
date_stop
dimensions_json
dimensions_json_hash
purchase_roas_json
video_metrics_json
request_id / sync_run_id
```

`raw_json` tetap dipertahankan. Row lama di-backfill level-nya dari kombinasi
id, lalu diverifikasi agar tidak terjadi double-count.

### 4.3 Action/conversion normalization

```sql
meta_insight_actions (
  id INTEGER PRIMARY KEY,
  insight_id INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  value REAL DEFAULT 0,
  action_attribution_window TEXT,
  raw_json TEXT,
  UNIQUE(insight_id, action_type, action_attribution_window)
)
```

Tujuannya agar user bisa melihat “message starts”, leads, purchases, video
views, link clicks, dan action type lain tanpa parsing JSON di browser.

### 4.4 Sync/capability/audit tables

```sql
meta_sync_runs (
  id INTEGER PRIMARY KEY,
  scope TEXT,
  since TEXT,
  until TEXT,
  status TEXT,
  records_synced INTEGER,
  request_count INTEGER,
  rate_limit_count INTEGER,
  started_at TEXT,
  finished_at TEXT,
  error_json TEXT
)

meta_sync_errors (
  id INTEGER PRIMARY KEY,
  sync_run_id INTEGER,
  endpoint TEXT,
  field_set TEXT,
  http_status INTEGER,
  error_code TEXT,
  error_message TEXT,
  retryable INTEGER,
  created_at TEXT
)

meta_capabilities (
  account_id TEXT,
  api_version TEXT,
  capability_key TEXT,
  supported INTEGER,
  last_checked_at TEXT,
  error_code TEXT,
  error_message TEXT,
  PRIMARY KEY(account_id, api_version, capability_key)
)

meta_object_history (
  id INTEGER PRIMARY KEY,
  object_type TEXT,
  object_id TEXT,
  status TEXT,
  budget REAL,
  effective_from TEXT,
  source TEXT,
  raw_json TEXT
)
```

Semua migration wajib `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE` idempotent,
dan mengikuti migration engine di `lib/db.ts`. Tidak mengubah database
production secara manual tanpa backup.

## 5. Perubahan lib/service dan sync

### 5.1 `lib/meta/client.ts`

Tambahkan typed helper dan field sets:

- `getAdAccount()`
- `listCampaignsFull()`
- `listAdSetsFull()`
- `listAdsFull()`
- `listCreatives()`
- `getInsights()` dengan level/time range/breakdowns/fields
- `getAccountActivities()` bila capability tersedia
- `getAdPreview()` bila capability tersedia
- capability probing per endpoint dan field group

Implementasikan:

- pagination sampai selesai
- retry exponential backoff untuk 429/80004
- stop cepat untuk 190/invalid token
- request-id dan rate-limit header ke sync log
- redaction token dari error/raw payload

### 5.2 `lib/repositories/meta-ads.ts`

Tambahkan:

- upsert account/campaign/adset/ad/creative
- upsert insights per level dan dimensi
- normalize actions ke `meta_insight_actions`
- query canonical campaign totals
- query explorer dengan filter/pagination
- query breakdown dan action detail
- query raw payload dengan pagination
- query sync status/errors/capabilities

Tidak boleh ada query agregasi yang menjumlahkan account + campaign + ad
sekaligus.

### 5.3 `lib/services/meta-ads-service.ts`

Pisahkan sync menjadi scope yang dapat dijalankan ulang:

```text
account
objects
creatives
insights:campaign
insights:adset
insights:ad
breakdowns
activities
reconcile
```

Default schedule:

- setiap 3 jam: insights 2 hari terakhir + object status
- setiap hari: insights 30 hari terakhir + action normalization
- setiap minggu: reconciliation 90 hari dan creative metadata
- manual full sync: range dan breakdown dipilih operator

Sync harus idempotent, resumable, dan tidak menghapus data lama ketika salah
satu endpoint gagal. Setiap partial failure terlihat di Admin Sync Center.

## 6. API Admin yang direncanakan

Semua endpoint baru wajib memakai `requireAuth`/permission admin dan membaca
DB melalui repository/service.

```text
GET  /api/meta/capabilities
GET  /api/meta/account
GET  /api/meta/objects?type=campaign|adset|ad|creative
GET  /api/meta/insights-db
     ?level=account|campaign|adset|ad
     &breakdown=...
     &campaign_id=...
     &adset_id=...
     &ad_id=...
     &start=...
     &end=...
     &cursor=...
GET  /api/meta/actions
GET  /api/meta/breakdowns
GET  /api/meta/raw
GET  /api/meta/sync
POST /api/meta/sync
POST /api/meta/reconcile
GET  /api/meta/export?format=csv|json
```

Endpoint lama tetap dipertahankan sebagai compatibility layer, tetapi default
account response memakai canonical campaign-level aggregate.

## 7. UI Admin: Meta Ads Data Explorer

### 7.1 Overview

Pertahankan funnel yang sekarang:

```text
Spend → Impressions → Ad clicks → WA clicks → Leads → Bookings → Revenue
```

Pastikan metric overview hanya campaign-level dan menampilkan badge sumber,
periode, currency, dan last sync.

### 7.2 Explorer

Tambahkan tab/filter:

- Account
- Campaign
- Ad set
- Ad
- Creative
- Breakdown
- Actions/Conversions
- Raw payload
- Sync health

Fitur minimum:

- date range dan timezone ad account
- hierarchy drilldown
- search by id/name
- sort/filter metric
- pagination
- kolom metric yang dapat dipilih
- detail drawer dengan JSON raw
- export CSV/JSON sesuai filter

### 7.3 Creative view

- gallery thumbnail/preview
- copy (headline/body/CTA)
- spend, CTR, CPC, leads, bookings, ROAS per creative
- perbandingan creative pada campaign/adset yang sama
- warning jika creative metadata belum tersedia karena permission

### 7.4 Breakdown view

- table/heatmap berdasarkan age/gender/placement/device/platform
- warning bahwa breakdown tidak boleh dijumlahkan ke overview
- tampilkan `data freshness` dan jumlah row

### 7.5 Sync Center

- tombol sync per scope
- full/backfill dengan konfirmasi range
- progress dan records synced
- error per endpoint/field
- rate-limit counter
- capability matrix
- last successful sync

## 8. Akurasi, dedup, dan data quality

Checklist wajib:

- [ ] Explicit `level`; tidak mengandalkan NULL untuk membedakan hierarchy.
- [ ] Unique key mencakup level + dimensi breakdown.
- [ ] Overview hanya campaign-level.
- [ ] Adset total hanya adset-level; ad total hanya ad-level.
- [ ] `reach` tidak dijumlahkan lintas level tanpa label/inference yang jelas.
- [ ] `date_record` mengikuti timezone account Meta, bukan timezone server.
- [ ] Upsert idempotent untuk retry dan backfill.
- [ ] Reconcile sample harian dengan Graph API sebelum release.
- [ ] Deteksi row count/spend yang melonjak tidak wajar.
- [ ] Raw payload tidak mengandung access token.

Target rekonsiliasi:

```text
campaign total ≈ sum campaign rows untuk periode
adset total    ≈ sum adset rows untuk adset tersebut
ad total       ≈ sum ad rows untuk ad tersebut
overview       = satu level canonical, bukan penjumlahan semua level
```

## 9. Rollout bertahap

### Phase 0 — capability discovery dan desain (read-only)

- Probe account, object, creative, insight fields.
- Simpan capability matrix.
- Dokumentasikan field yang ditolak/unsupported.
- Tidak mengubah data production.

### Phase 1 — schema dan ingestion foundation

- Migration table/column/index.
- Sync run/error/capability tracking.
- Account/object/creative full payload.
- Unit/manual verification upsert dan pagination.

### Phase 2 — complete insights

- Campaign/adset/ad daily facts.
- Action normalization.
- P1 breakdown satu per satu dengan rate-limit guard.
- Reconcile 30–90 hari.

### Phase 3 — API dan Data Explorer

- Endpoint DB-first, auth, pagination, export.
- UI overview + explorer + creative + breakdown + sync center.

### Phase 4 — production hardening

- Schedule sync.
- Backup SQLite sebelum migration/backfill.
- Canary range kecil.
- Monitor size, duration, errors, spend anomaly.
- Full backfill hanya setelah canary akurat.

## 10. Verification scope

Wajib:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- migration test pada copy database
- pagination/retry/idempotency test
- field capability fallback test
- SQL check bahwa overview tidak double-count
- API auth/permission test
- manual QA seluruh tab Explorer
- production smoke setelah deploy:
  - `/api/health`
  - `/api/meta/health`
  - `/api/meta/capabilities`
  - `/api/meta/sync`
  - row count dan spend campaign-level
  - backup database tersedia

## 11. Residual gap dan risiko

- Tidak semua field/endpoints tersedia hanya karena token memiliki
  `ads_read`; sebagian membutuhkan permission Page/Lead Ads/Business tertentu.
- Breakdown dapat memperbesar row count dan rate-limit secara signifikan.
- Payload raw besar; perlu monitoring ukuran DB dan retention policy.
- Creative preview URL dapat expired; simpan metadata/snapshot dengan hati-hati.
- Meta dapat mengubah field atau API version; capability probing dan raw JSON
  diperlukan untuk forward compatibility.
- `reach` dan beberapa metric unique-user tidak boleh diperlakukan sebagai
  additive metric lintas hierarchy.
- Semua perubahan write/action tetap harus melalui approval dan audit log.

## 12. Definition of done

- [x] Capability matrix menunjukkan endpoint/field yang supported oleh token.
- [x] Account, campaign, adset, ad, creative, insights, action, dan selected breakdown tersimpan di DB dengan raw payload.
- [x] Sync dapat diulang tanpa duplicate dan bisa melanjutkan partial failure.
- [x] Dashboard dapat melihat detail dari account sampai creative/action.
- [x] User dapat filter, drilldown, dan export data.
- [x] Overview tidak lagi menampilkan atau menjumlahkan hierarchy yang sama.
- [x] Reconciliation terhadap Meta lulus pada sample dan full backfill.
- [x] Lint, typecheck, build, migration, dan production smoke lulus.

## 13. Residual Gap Checklist

Residual Gap Status: **0 (Zero Gap)**

- [x] Skema tabel database `meta_accounts`, `meta_creatives`, `meta_insight_actions`, `meta_sync_runs`, `meta_sync_errors`, `meta_capabilities`, `meta_object_history`, dan kolom turunan `meta_insights_daily`.
- [x] Implementation API Guard: Semua endpoint `/api/meta/*` terlindungi NextAuth & `requireAuth(req)`.
- [x] Graph API Client Capability Probing: `probeCapabilities()` dan `getAdAccount()` mengisolasi permission error per endpoint.
- [x] Granular Scoped Sync & Error Logging: `syncAll` mendukung scope terisolasi dan mencatat error ke `meta_sync_errors`.
- [x] UI Explorer Tabbed Interface: Overview, Hierarchy Explorer, Creatives Gallery, Audience Breakdowns, Actions & Conversions, Sync Center, & Raw JSON Inspector Modal.
- [x] Verifikasi Mutlak: `npm run lint` (0 error), `npx tsc --noEmit` (0 error), `npm run build` (0 error).


