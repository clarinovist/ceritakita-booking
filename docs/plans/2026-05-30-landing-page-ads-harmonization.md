# Draft Harmonisasi Landing Page dengan Meta Ads Aktif

**Tanggal:** 30 Mei 2026  
**Status:** DRAFT - Menunggu approval user  
**Context:** Landing page ceritakitastudio.site perlu diharmonisasi dengan 3 Meta Ads yang sedang jalan (meta1: Prewedding/Wedding, meta2: Self Photo Promo, meta3: Birthday)

---

## 🚨 MASALAH KRITIS

### 1. Mismatch Harga Self Photo (URGENT - Impact: Conversion Drop)

**Situasi:**
- Landing page promo section: **"Self Photo Cuma 150K!"**
- Harga sebenarnya di `data/services.json`: **Rp 50,000**
- Meta Ad2 (meta2) mengarahkan orang ke promo 150K

**Dampak:**
- User klik iklan karena tertarik promo 150K
- Masuk booking page, lihat harga 50K
- User bingung → curiga → bounce
- CTR bagus tapi conversion rate jelek

**Solusi yang Perlu Diputuskan:**
```
OPSI A: Harga sebenarnya 50K, ubah copy landing page jadi "50K"
  ✅ Jujur, no misleading
  ❌ Tapi 150K terdengar lebih premium/valuable

OPSI B: Harga 150K adalah paket bundle (self photo + editing + print 10 foto)
  ✅ Justifikasi harga promo
  ❌ Perlu update services.json + buat service baru "Self Photo Premium"
  ❌ Perlu update benefits list

OPSI C: Harga 50K untuk basic, 150K untuk premium (ada di landing page aja)
  ✅ Ada upsell opportunity
  ❌ Perlu 2 service entry di database
```

**Rekomendasi:** Opsi B - buat service baru "Self Photo Premium 150K" dengan benefits jelas

---

## 🎯 MASALAH FUNNEL CONVERSION

### 2. Booking Page Gak Pre-Select Package dari Ads

**Situasi:**
- Landing page service cards pakai link: `/booking?package=prewedding`
- Tapi booking page gak baca parameter `package` dari URL
- Semua user masuk ke halaman yang sama, harus scroll cari service yang relevan

**Dampak:**
- User dari Ad1 (Prewedding) harus scroll cari "Prewedding Bronze/Silver/Gold"
- User dari Ad2 (Self Photo) harus cari "Self Photo" di list panjang
- Friction tinggi → drop-off

**Solusi:**
File: `app/booking/page.tsx`

```typescript
// Tambahin logic untuk baca URL parameter
export default function BookingPage() {
  const searchParams = useSearchParams()
  const packageParam = searchParams?.get('package')
  
  // Map parameter ke service ID
  const packageToServiceId: Record<string, string> = {
    'prewedding': '5', // Prewedding Silver (middle tier)
    'wedding': 'af17cca7-d511-429f-82f8-5fab9733c14e', // Wedding Gold
    'wisuda': '7', // Indoor Wisuda
    'birthday': '9',
    'family': '8',
    'maternity': '8', // Pakai Family sebagai fallback
    'selfphoto': '11', // Self Photo basic
    'selfphoto-premium': 'NEW_SERVICE_ID', // 150K package
  }
  
  const preselectedServiceId = packageParam 
    ? packageToServiceId[packageParam.toLowerCase()] 
    : null
  
  // Set default selected service
  const [selectedService, setSelectedService] = useState<string | null>(
    preselectedServiceId || null
  )
  
  // ... rest of the code
}
```

**File yang perlu diubah:**
- `app/booking/page.tsx` - tambah URL parameter reading + pre-selection logic
- `lib/constants.ts` - tambah mapping package → service ID (optional)

---

### 3. Maternity Link Case-Sensitive Bug

**Situasi:**
- Landing page link: `/booking?package=Maternity` (kapital M)
- Others: `/booking?package=prewedding` (lowercase)
- Backend bisa case-sensitive

**Dampak:**
- User klik Maternity card → parameter gak recognized → gak pre-select

**Solusi:**
File: `app/page.tsx` (landing page)

```tsx
// Line ~XXX (Maternity card)
<Link href="/booking?package=maternity">  // lowercase
```

**File yang perlu diubah:**
- `app/page.tsx` - ubah "Maternity" → "maternity"

---

## 🌐 MASALAH BRANDING & TARGET AUDIENCE

### 4. Bahasa Inconsistent (Target: Solo Lokal, Budget 50K-800K)

**Situasi:**
- Hero headline: "Capture unforgettable moments with us!" (English)
- Service section: "Kategori Layanan" (Indonesia)
- CTA buttons: "BOOKING SEKARANG" (Indo) tapi "Explore Full Gallery" (English)
- Target audience: Solo + radius 30km, budget-conscious, middle-class Indonesia

**Dampak:**
- Tone gak konsisten
- English phrases bisa bikin target market lokal merasa "ini bukan untuk saya"
- Conversion rate bisa turun karena gak relatable

**Solusi:**

#### A. Hero Section (app/page.tsx)
```tsx
// BEFORE:
<h1>Capture unforgettable moments with us!</h1>
<p>Dari wisuda hingga pernikahan, kami siap merekam cerita indah Anda dalam bingkai kenangan.</p>

// AFTER:
<h1>Abadikan Momen Berharga Bersama Kami!</h1>
<p>Dari wisuda hingga pernikahan, kami siap merekam cerita indah Anda dalam bingkai kenangan.</p>
```

#### B. CTA Buttons
```tsx
// BEFORE:
<Link href="/gallery">Explore Full Gallery</Link>
<Link href="/booking">Book a Session</Link>

// AFTER:
<Link href="/gallery">Lihat Semua Galeri</Link>
<Link href="/booking">Booking Sesi Foto</Link>
```

#### C. Navigation Footer
```tsx
// BEFORE:
<li><Link href="/gallery">Gallery</Link></li>
<li><Link href="/about">About Us</Link></li>

// AFTER:
<li><Link href="/gallery">Galeri</Link></li>
<li><Link href="/about">Tentang Kami</Link></li>
```

**File yang perlu diubah:**
- `app/page.tsx` - hero headline, CTA buttons, footer links
- `components/Header.tsx` (if exists) - navigation menu
- `components/Footer.tsx` (if exists) - footer links

---

## 💡 ENHANCEMENT (NICE TO HAVE)

### 5. Tambah Testimonial Count

**Situasi:**
- Sekarang cuma 2 testimonial visible
- Untuk konversi ads-to-booking, idealnya 4-6 testimonial

**Solusi:**
File: `app/page.tsx` (testimonial section)

```tsx
// Tambahin 2-4 testimonial lagi
const testimonials = [
  {
    name: "Jessica M.",
    package: "Graduation Package",
    text: "Momen wisuda jadi makin berkesan berkat CeritaKita. Kualitas cetaknya juga premium abis. Thank you!"
  },
  {
    name: "Sarah & Dimas",
    package: "Prewedding Session",
    text: "Hasil fotonya sangat memuaskan! Timnya ramah dan profesional banget. Suka banget sama editingnya yang natural."
  },
  // ADD:
  {
    name: "Bu Ratna",
    package: "Family Photo",
    text: "Foto keluarga jadi kenangan yang priceless. Anak-anak juga nyaman selama sesi, fotografernya sabar banget!"
  },
  {
    name: "Rina",
    package: "Birthday Package",
    text: "Ulang tahun anakku jadi lebih spesial. Hasil fotonya lucu-lucu, cocok buat dipajang di rumah."
  }
]
```

**File yang perlu diubah:**
- `app/page.tsx` - testimonial array
- Atau: `data/testimonials.json` (kalau mau pisahin data)

---

### 6. Tambah Pre-Wedding Package Details di Landing Page

**Situasi:**
- Landing page cuma bilang "Prewedding" tanpa detail harga
- User harus masuk booking page baru tau harga (400K-800K)
- Meta Ad1 (meta1) fokus ke prewedding/wedding

**Solusi:**
File: `app/page.tsx` (service cards section)

```tsx
// Prewedding card
<div>
  <h3>PREWEDDING</h3>
  <p>Satu langkah lebih dekat, menuju cerita 'kita selamanya'</p>
  <p className="price">Mulai dari Rp 400.000</p>  {/* ADD THIS */}
  <Link href="/booking?package=prewedding">PILIH PAKET</Link>
</div>
```

**File yang perlu diubah:**
- `app/page.tsx` - tambah price range di service cards

---

## 📊 IMPACT ANALYSIS

| # | Masalah | Severity | Effort | Impact ke Conversion |
|---|---------|----------|--------|---------------------|
| 1 | Mismatch harga Self Photo | 🔴 Critical | Low | High (bounce rate) |
| 2 | No package pre-selection | 🟠 High | Medium | High (friction) |
| 3 | Maternity case bug | 🟡 Medium | Low | Low (edge case) |
| 4 | Bahasa inconsistent | 🟠 High | Medium | Medium (trust) |
| 5 | Testimonial count | 🟢 Low | Low | Medium (social proof) |
| 6 | Price range di cards | 🟢 Low | Low | Medium (transparency) |

---

## 🚀 RECOMMENDED EXECUTION ORDER

### Phase 1: Critical Fixes (Hari ini)
1. **Fix mismatch harga Self Photo** - putusin dulu: 50K atau 150K bundle?
2. **Fix Maternity case bug** - 5 menit kerja

### Phase 2: Funnel Optimization (Besok)
3. **Add package pre-selection logic** - 1-2 jam kerja
4. **Add price range di service cards** - 30 menit kerja

### Phase 3: Branding Polish (Minggu ini)
5. **Harmonize bahasa ke full Indonesia** - 1 jam kerja
6. **Tambah testimonial count** - 30 menit kerja

---

## ❓ PERTANYAAN UNTUK USER

Sebelum eksekusi, tolong konfirmasi:

### 1. Self Photo Pricing Decision
- **OPSI A:** Harga sebenarnya 50K, ubah copy jadi "50K"
- **OPSI B:** Harga 150K adalah bundle (self photo + editing + print), buat service baru
- **OPSI C:** Ada penjelasan lain?

### 2. Approval untuk Eksekusi
- Mau langsung eksekusi Phase 1 (critical fixes)?
- Atau mau review draft ini dulu lebih detail?

### 3. Additional Testimonials
- Ada testimonial real dari customer yang bisa ditambahin?
- Atau pakai contoh di atas dulu (nanti bisa diupdate)?

---

## 📝 NOTES

- Semua perubahan bisa di-commit ke branch `feature/landing-page-ads-harmonization`
- Setelah merge, CI/CD akan auto-deploy ke VPS
- Testing: cek manual di browser + verify WA clicks tracking masih jalan

---

**Next Steps:**
1. User jawab pertanyaan di atas
2. Eksekusi Phase 1
3. Review & test
4. Lanjut Phase 2 & 3
