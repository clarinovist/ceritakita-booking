# Ceritakita Booking — API Validation & Security Hardening Plan

## Tujuan
Menangani dua scope yang gagal diselesaikan Jules secara deterministik langsung di repo lokal:
1. API validation & error response standardization
2. Input sanitization & security hardening

## Konteks
- Beberapa session Jules selesai secara status, tapi artifact patch hilang (`No diff found in the remote VM`).
- Karena itu implementasi harus dikerjakan manual di local checkout.
- Fokus awal: audit dulu state aktual repo, cari pola error responses/API routes, lalu patch bertahap dan verifikasi lint/build.

## Execution Order
1. Audit state repo dan baseline branch saat ini
2. Inventaris API routes dan helper error/validation yang sudah ada
3. Identifikasi pola raw `NextResponse.json({ error: ... })`, route tanpa try/catch, dan input yang belum tervalidasi
4. Rancang helper/utility minimal yang mengikuti style repo saat ini
5. Implement patch bertahap untuk scope high-impact lebih dulu
6. Jalankan lint/build dan perbaiki error yang tersentuh
7. Commit ke branch baru dan buka PR manual

## Acceptance Criteria
- Error response API konsisten memakai shape terstruktur
- Route yang disentuh punya try/catch yang benar
- Validasi input ditambahkan untuk route penting yang sebelumnya longgar
- Hardening sanitization/upload/webhook tidak regresif
- `npm run lint` bersih
- `npm run build` bersih

## Deliverables
- Branch git baru dengan patch final
- PR GitHub manual
- Ringkasan before/after perubahan utama
