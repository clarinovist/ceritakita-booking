# CeritaKita Booking — Automation Opportunities

> For Hermes: this is a strategy/ideation document, not an execution checklist yet. Treat it as a prioritization reference for future implementation planning.

Goal: mendokumentasikan peluang otomasi di `ceritakita-booking`, termasuk otomasi non-teknis/business-facing, agar bisa diprioritaskan bertahap berdasarkan ROI, effort, dan kesiapan kode saat ini.

Architecture context:
- Repo sudah punya pondasi untuk automasi berbasis laporan, leads, bookings, payment, Telegram, WhatsApp template, email, analytics, dan Meta integration.
- Beberapa automasi paling ideal dijalankan sebagai scheduled job eksternal (GitHub Actions / Hermes cronjob) yang memanggil endpoint internal atau membaca data aplikasi.
- Untuk customer-facing automation, pendekatan paling aman adalah bertahap: alert -> assisted action -> full automation.

Relevant code areas observed:
- Scheduled report: `.github/workflows/telegram-report.yml`
- Telegram trigger: `app/api/telegram/send-report/route.ts`
- Report builder: `lib/report-generator.ts`
- Leads: `app/api/leads/*`, `lib/leads.ts`, `lib/lead-interactions.ts`
- Analytics: `app/api/analytics/*`, `lib/repositories/analytics.ts`
- Health: `app/api/health/route.ts`
- WhatsApp templates: `lib/whatsapp-template.ts`
- Email sending: `lib/email.ts`
- Pricing: `lib/pricing.ts`, `lib/price-adjustments.ts`
- Coupons: `app/api/coupons/*`, `lib/coupons.ts`
- Meta CAPI / ads history: `lib/meta-capi.ts`, `app/api/meta/backfill/route.ts`

---

## 1. Executive Summary

Peluang otomasi di CeritaKita Booking tidak hanya teknis/IT. Justru peluang dengan dampak bisnis terbesar ada di area:

1. Sales / CRM automation
2. Customer communication automation
3. Finance / admin automation
4. Marketing / growth automation
5. Reliability / ops automation

Urutan prioritas yang paling masuk akal:
- Phase 1: automasi reminder dan digest operasional
- Phase 2: automasi scoring, anomaly detection, dan assisted action
- Phase 3: automasi customer outreach penuh dan optimization loop

---

## 2. Automation Framework

Automation dibagi menjadi 3 level agar implementasi aman dan tidak over-automated di awal.

### Level 1 — Alert / reminder
Contoh:
- daftar lead overdue
- daftar booking belum lunas
- notifikasi health issue

Keunggulan:
- implementasi cepat
- risiko rendah
- value tinggi

### Level 2 — Assisted action
Contoh:
- sistem membuat shortlist lead prioritas + template WhatsApp
- admin tinggal review lalu kirim

Keunggulan:
- tetap ada human control
- mempercepat operasional tanpa risiko tone/brand rusak

### Level 3 — Full automation
Contoh:
- kirim reminder customer otomatis tanpa intervensi admin
- trigger follow-up sequence otomatis berdasarkan event

Keunggulan:
- efisiensi maksimum
- perlu guardrail lebih ketat

Rekomendasi: mulai dari Level 1 dan Level 2 dulu untuk area customer-facing.

---

## 3. Automation Opportunities by Business Area

## A. Sales / CRM Automation

### A1. Reminder follow-up lead otomatis
What:
- setiap pagi kirim daftar lead yang overdue follow-up
- tampilkan nama, status, source, hari keterlambatan, next follow-up

Business impact:
- mengurangi lead bocor
- membantu tim fokus ke prioritas harian

Potential implementation:
- Hermes cron / scheduled API job
- output ke Telegram admin/sales

Priority:
- Very High

### A2. Lead scoring otomatis
What:
- sistem memberi skor pada lead berdasarkan kombinasi sinyal:
  - source lead
  - responsivitas
  - budget indication
  - urgency tanggal acara
  - jumlah interaksi

Business impact:
- membantu tim mengejar lead paling bernilai dulu

Potential implementation:
- scoring function di backend
- expose score di admin dashboard + digest

Priority:
- High

### A3. Auto assignment lead
What:
- lead baru langsung di-assign ke admin/sales tertentu
- model round-robin atau rule-based

Business impact:
- mencegah lead menganggur
- distribusi kerja lebih merata

Priority:
- Medium

### A4. Daily sales digest
What:
- kirim ringkasan harian ke owner/admin/sales:
  - lead baru
  - lead overdue
  - booking baru
  - payment masuk
  - target prioritas hari ini

Business impact:
- semua tim punya gambaran operasional harian yang sama

Priority:
- Very High

### A5. Stale lead rescue list
What:
- otomatis kumpulkan lead lama yang belum close dan belum disentuh
- rekomendasikan batch follow-up mingguan

Business impact:
- membuka revenue dari pipeline lama

Priority:
- High

---

## B. Customer Communication Automation

### B1. WhatsApp follow-up semi-otomatis
What:
- generate pesan follow-up otomatis berdasarkan template dan konteks booking/lead
- admin tinggal klik link/kirim

Existing readiness:
- `lib/whatsapp-template.ts` sudah ada

Business impact:
- meningkatkan kecepatan dan konsistensi komunikasi

Priority:
- Very High

### B2. Reminder pembayaran otomatis
What:
- H-3 / H-1 / overdue payment reminder
- bisa ke admin dulu atau langsung ke customer

Business impact:
- mempercepat collection
- menjaga cashflow

Priority:
- Very High

### B3. Reminder jadwal sesi otomatis
What:
- kirim pengingat menjelang jadwal foto
- isi: tanggal, jam, lokasi, persiapan yang perlu dibawa

Business impact:
- mengurangi miss/no-show dan miskomunikasi

Priority:
- High

### B4. Post-session thank you + review request
What:
- otomatis kirim ucapan terima kasih setelah sesi selesai
- sertakan CTA review/testimoni/referral

Business impact:
- menambah social proof dan peluang referral

Priority:
- High

### B5. Template komunikasi kontekstual
What:
- generate template berbeda untuk kondisi:
  - inquiry baru
  - belum bayar
  - reschedule
  - upsell add-on
  - review request

Business impact:
- kualitas copy lebih konsisten
- tim lebih cepat merespons

Priority:
- High

---

## C. Finance / Admin Automation

### C1. Outstanding payment tracker
What:
- daftar booking yang belum lunas / DP belum masuk
- summary per hari atau per minggu

Business impact:
- mengurangi kebocoran cashflow

Priority:
- Very High

### C2. Omzet harian / mingguan otomatis
What:
- kirim revenue, payment received, expense summary, cash position sederhana

Existing readiness:
- report generator dan finance endpoints sudah ada pondasi

Business impact:
- owner tidak perlu buka dashboard manual setiap saat

Priority:
- High

### C3. Booking anomaly detector
What:
- tandai booking dengan kondisi janggal:
  - total tidak sinkron
  - discount terlalu besar
  - add-on mismatch
  - payment structure tidak konsisten

Business impact:
- mencegah human error admin dan salah hitung

Priority:
- Medium-High

### C4. Laporan performa layanan otomatis
What:
- layanan paling laku
- revenue tertinggi
- conversion terbaik
- addon paling sering dibeli

Business impact:
- membantu pricing, promo, dan packaging

Priority:
- High

### C5. Month-end business pack
What:
- laporan otomatis tiap awal bulan:
  - omzet
  - biaya
  - laba kasar
  - top services
  - top lead source

Business impact:
- mempercepat review bulanan owner

Priority:
- High

---

## D. Marketing / Growth Automation

### D1. Lead source performance recap
What:
- rekap performa sumber lead:
  - Meta Ads
  - organic
  - referral
  - direct
- sertakan conversion ke booking

Business impact:
- budget allocation lebih data-driven

Priority:
- High

### D2. Coupon / promo performance automation
What:
- analisis coupon mana yang dipakai, conversion-nya, dan diskonnya sehat atau tidak

Business impact:
- promo lebih terukur

Priority:
- Medium-High

### D3. Upsell recommendation engine
What:
- rekomendasikan add-on berdasarkan jenis layanan / pola booking

Business impact:
- meningkatkan average order value

Priority:
- Medium

### D4. Repeat/referral opportunity detector
What:
- tandai customer lama yang punya peluang repeat atau referral

Business impact:
- menaikkan revenue dari customer base eksisting

Priority:
- Medium-High

### D5. Daily funnel anomaly alert
What:
- alert jika traffic ada tapi lead nol, atau lead ada tapi booking drop tajam

Business impact:
- cepat mendeteksi funnel bocor

Priority:
- High

---

## E. Reliability / Ops Automation

### E1. Health watchdog
What:
- cek `/api/health` secara berkala
- alert jika gagal beberapa kali berturut-turut

Priority:
- High

### E2. Deploy verification bot
What:
- setelah deploy, verifikasi endpoint utama dan health status

Priority:
- High

### E3. Error/log anomaly alert
What:
- scan error pattern penting dan kirim alert jika spike

Priority:
- Medium-High

Catatan:
- area ini penting, tapi bukan satu-satunya automation opportunity. Business-facing automation harus ikut diprioritaskan.

---

## 4. Prioritization Matrix

## Quick Wins — High ROI, Low/Medium Effort

1. Reminder follow-up lead otomatis
2. Daily sales digest
3. Outstanding payment tracker
4. WhatsApp follow-up semi-otomatis
5. Health watchdog
6. Deploy verification bot

## Strategic Wins — High ROI, Medium Effort

1. Lead scoring otomatis
2. Reminder jadwal sesi otomatis
3. Post-session thank you + review request
4. Lead source performance recap
5. Month-end business pack
6. Daily funnel anomaly alert

## Longer Bets — Medium/High ROI, Medium/High Effort

1. Auto assignment lead
2. Upsell recommendation engine
3. Repeat/referral opportunity detector
4. Full customer follow-up automation
5. Booking anomaly detector with remediation workflow

---

## 5. Recommended Rollout Phases

## Phase 1 — “Jangan ada yang kelupaan”
Focus:
- reminder operasional
- digest harian
- notifikasi dasar

Recommended scope:
1. Reminder follow-up lead otomatis
2. Outstanding payment tracker
3. Daily sales digest
4. Health watchdog

Expected outcome:
- admin/sales lebih tertib
- owner dapat visibility harian
- kebocoran karena lupa follow-up turun

## Phase 2 — “Percepat eksekusi tim”
Focus:
- assisted action
- template dan shortlist otomatis

Recommended scope:
1. WhatsApp follow-up semi-otomatis
2. Reminder jadwal sesi otomatis
3. Lead scoring otomatis
4. Stale lead rescue list

Expected outcome:
- waktu respons lebih cepat
- prioritas kerja lebih jelas
- customer journey lebih rapi

## Phase 3 — “Optimization & growth loop”
Focus:
- quality-of-revenue improvement
- insight marketing dan repeat business

Recommended scope:
1. Lead source performance recap
2. Coupon performance automation
3. Repeat/referral opportunity detector
4. Upsell recommendation engine
5. Month-end business pack

Expected outcome:
- keputusan bisnis lebih data-driven
- average order value naik
- channel acquisition lebih terkontrol

---

## 6. View by Role

## Owner
Automation paling berguna:
- daily sales digest
- omzet & cash summary
- month-end business pack
- lead source performance recap
- funnel anomaly alert

## Admin / CS
Automation paling berguna:
- follow-up reminder
- payment reminder list
- WhatsApp template shortcut
- reminder jadwal sesi
- stale lead rescue list

## Sales
Automation paling berguna:
- lead scoring
- priority leads digest
- overdue follow-up list
- auto assignment

## Marketing
Automation paling berguna:
- source performance recap
- coupon performance report
- Meta/CAPI monitoring
- funnel anomaly alert

---

## 7. Top 5 Non-Technical Automations to Build First

If prioritizing business impact over pure IT/ops, the top 5 are:

1. Reminder follow-up lead otomatis
2. Outstanding payment reminder
3. Daily sales digest
4. WhatsApp follow-up semi-otomatis
5. Post-session thank you + review request

Why these five:
- directly affect revenue, conversion, and customer experience
- can be phased from semi-automatic to full automatic
- already align with data and modules present in the repo

---

## 8. Suggested Next Planning Document

If execution is approved later, split this document into one implementation plan per automation cluster:

1. `lead-reminders-and-priority-digest`
2. `payment-reminders-and-finance-digest`
3. `customer-whatsapp-journeys`
4. `marketing-performance-automation`
5. `ops-watchdog-and-deploy-verification`

Each implementation plan should include:
- trigger schedule
- source data and required fields
- destination channel (Telegram / email / admin UI / WhatsApp)
- approval model (manual / assisted / fully automatic)
- failure handling
- verification checklist

---

## 9. Final Recommendation

CeritaKita Booking sebaiknya tidak memandang automation hanya sebagai “otomasi teknis IT”.

The strongest automation opportunities are:
- preventing lead leakage
- speeding admin follow-up
- improving payment collection
- standardizing customer communication
- giving owner a reliable business pulse every day

Recommended first move:
- start with reminders and digests that reduce forgetfulness and increase response speed
- keep customer-facing flows semi-automatic first
- harden ops automation in parallel, not as the only focus
