# CeritaKita Studio - UI Design System

Dokumentasi sistem desain untuk menjaga konsistensi visual di seluruh pengembangan aplikasi.

---

## 1. Color Palette

### 1.1 Primary Theme: Earthy/Moody (Homepage & Public Pages)

Tema visual untuk halaman publik menggunakan palet warna earthy/moody yang elegan dan profesional untuk studio fotografi.

#### Olive (Primary Backgrounds)
```css
olive-900: #1a1a14  /* Darkest - Main background */
olive-800: #2c2c20  /* Dark overlay */
olive-700: #4a4a3a  /* Secondary dark */
olive-600: #6b6b50  /* Medium */
olive-500: #8a8a6c  /* Lighter accent */
```

#### Cream (Text & Light Accents)
```css
cream-50:  #fdfcfa  /* Lightest */
cream-100: #f5f2eb  /* Primary text on dark */
cream-200: #e8e4d9  /* Secondary text */
cream-300: #d4cfc0  /* Tertiary text */
cream-400: #b8b19e  /* Muted text */
```

#### Gold (CTA & Highlights)
```css
gold-300: #d4b896  /* Light accent */
gold-400: #c9a96e  /* Hover state */
gold-500: #b89856  /* Primary CTA */
gold-600: #9a7d42  /* Active state */
```

#### Warm Brown (Borders & Subtle Elements)
```css
warmBrown-300: #a89580
warmBrown-400: #8b7355
warmBrown-500: #6d5840
```

### 1.2 Secondary Theme: Professional Blue (Admin & Booking Form)

#### Primary (Blue)
```css
primary-50:  #eff6ff
primary-100: #dbeafe
primary-200: #bfdbfe
primary-300: #93c5fd
primary-400: #60a5fa
primary-500: #3b82f6
primary-600: #2563eb  /* Brand Primary */
primary-700: #1d4ed8
primary-800: #1e40af
primary-900: #1e3a8a
```

#### Secondary (Purple)
```css
secondary-50:  #f5f3ff
secondary-100: #ede9fe
secondary-500: #8b5cf6
secondary-600: #7c3aed  /* Brand Secondary */
secondary-700: #6d28d9
```

### 1.3 Semantic Colors

#### Success
```css
success-100: #d1fae5
success-500: #10b981
success-600: #059669
```

#### Warning
```css
warning-100: #fef3c7
warning-500: #f59e0b
warning-600: #d97706
```

#### Error
```css
error-100: #fee2e2
error-500: #ef4444
error-600: #dc2626
```

#### Neutral
```css
neutral-50:  #f9fafb
neutral-100: #f3f4f6
neutral-200: #e5e7eb
neutral-300: #d1d5db
neutral-400: #9ca3af
neutral-500: #6b7280
neutral-600: #4b5563
neutral-700: #374151
neutral-800: #1f2937
neutral-900: #111827
```

---

## 2. Typography

### 2.1 Font Families

| Purpose | Font | Fallback | Tailwind Class |
|---------|------|----------|----------------|
| **Display/Headlines** | Playfair Display | Georgia, serif | `font-display` |
| **Elegant Body** | Cormorant Garamond | Georgia, serif | `font-serif` |
| **Decorative/Script** | Sacramento | cursive | `font-script` |
| **UI/Body Text** | Inter | system-ui, sans-serif | `font-sans` |
| **Monospace/Code** | JetBrains Mono | ui-monospace | `font-mono` |

### 2.2 Typography Usage

```jsx
// Hero Headline
<h1 className="font-display text-4xl md:text-6xl lg:text-7xl">
  Abadikan Setiap Momen
</h1>

// Section Title
<h2 className="font-display text-3xl md:text-4xl">
  Our Services
</h2>

// Elegant Body
<p className="font-serif text-lg md:text-xl leading-relaxed">
  Deskripsi yang elegan dan profesional
</p>

// Script Accent
<span className="font-script text-2xl text-gold-400">
  with love
</span>

// UI Text
<p className="font-sans text-sm font-medium">
  Form label atau button text
</p>
```

### 2.3 Letter Spacing

| Context | Value | Usage |
|---------|-------|-------|
| **Wide Tracking** | `tracking-[0.3em]` | Logo subtext |
| **Medium Tracking** | `tracking-[0.2em]` | Navigation links |
| **Button Tracking** | `tracking-[0.15em]` | CTA buttons |
| **Regular** | `tracking-wide` | General accent text |

---

## 3. Spacing & Layout

### 3.1 Spacing Scale (4px base)

```css
/* Standard Tailwind spacing + custom */
18: 4.5rem (72px)
88: 22rem (352px)
```

### 3.2 Container Widths

```jsx
// Full-width container
<div className="max-w-7xl mx-auto px-6 lg:px-8">

// Content container
<div className="max-w-4xl mx-auto px-6">

// Narrow content
<div className="max-w-2xl mx-auto">
```

### 3.3 Section Spacing

```jsx
// Standard section
<section className="py-16 lg:py-24">

// Large section
<section className="py-24 lg:py-32">

// Hero section
<section className="h-screen">
```

---

## 4. Components

### 4.1 Buttons

#### Primary CTA (Earthy Theme)
```jsx
<button className="inline-block bg-gold-500 hover:bg-gold-600 text-olive-900 font-medium px-8 py-4 tracking-[0.15em] uppercase text-sm transition-all duration-300 hover:scale-105">
  Booking Sekarang
</button>
```

#### Outline CTA (Earthy Theme)
```jsx
<button className="border border-cream-300/50 hover:border-cream-300 text-cream-100 hover:bg-cream-100/10 px-8 py-4 tracking-[0.15em] uppercase text-sm transition-all duration-300">
  Let's Connect
</button>
```

#### Primary Button (Admin Theme)
```jsx
<button className="btn-primary">
  {/* bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg */}
  Submit
</button>
```

#### Secondary Button (Admin Theme)
```jsx
<button className="btn-secondary">
  {/* bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl */}
  Cancel
</button>
```

### 4.2 Cards

#### Modern Card (Admin)
```jsx
<div className="card-modern">
  {/* bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md */}
  <h3>Card Title</h3>
  <p>Card content</p>
</div>
```

### 4.3 Form Inputs

#### Modern Input
```jsx
<input className="input-modern" placeholder="Email" />
{/* w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 */}
```

### 4.4 Navigation Links

```jsx
<a className="text-cream-200 hover:text-gold-400 transition-colors text-sm tracking-[0.2em] uppercase">
  About
</a>
```

---

## 5. Shadows

```css
shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25)
```

---

## 6. Animations

### 6.1 Predefined Animations

| Animation | Class | Duration | Description |
|-----------|-------|----------|-------------|
| **Fade In** | `animate-fade-in` | 0.3s | Opacity 0 → 1 |
| **Slide Up** | `animate-slide-up` | 0.4s | Move up 20px + fade |
| **Slide Down** | `animate-slide-down` | 0.4s | Move down 20px + fade |
| **Bounce Subtle** | `animate-bounce-subtle` | 2s infinite | Subtle vertical bounce |
| **Pulse Slow** | `animate-pulse-slow` | 3s infinite | Slow opacity pulse |

### 6.2 Transition Patterns

```jsx
// Standard transition
className="transition-all duration-300"

// Long transition
className="transition-all duration-500"

// Hover scale
className="hover:scale-105 transition-all duration-300"

// Button active state
className="active:scale-95 transition-all"
```

### 6.3 Loading State

```jsx
// Skeleton shimmer
<div className="loading-shimmer h-4 w-full rounded" />

// Pulse placeholder
<div className="bg-gray-200 animate-pulse rounded-lg" />
```

---

## 7. Breakpoints

| Breakpoint | Min Width | Target |
|------------|-----------|--------|
| `xs` | 475px | Small phones |
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### Mobile-First Examples

```jsx
// Typography scaling
className="text-lg md:text-xl lg:text-2xl"

// Flex direction
className="flex flex-col md:flex-row"

// Padding scaling
className="px-6 lg:px-8"

// Grid columns
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

---

## 8. Accessibility

### 8.1 Touch Targets

Minimum touch target: **44px × 44px**

```jsx
className="min-h-touch min-w-touch"  // 44px minimum
className="touch-target"              // utility class
```

### 8.2 Focus States

```jsx
// Focus visible for keyboard
*:focus-visible {
  outline: 2px solid rgb(217 91% 60%);
  outline-offset: 2px;
}
```

### 8.3 Screen Reader

```jsx
<span className="sr-only">Descriptive text for screen readers</span>
```

### 8.4 Mobile Input Safety

```css
/* Prevent iOS zoom on input focus */
input, select, textarea {
  font-size: 16px;
  min-height: 44px;
}
```

---

## 9. Component Patterns

### 9.1 Logo Variants

| Component | Usage | Import |
|-----------|-------|--------|
| `Logo` | Standard navigation | `import { Logo } from '@/components/ui'` |
| `MobileLogo` | Mobile navigation | `import { MobileLogo } from '@/components/ui'` |
| `HeroLogo` | Hero sections with tagline | `import { HeroLogo } from '@/components/ui'` |

### 9.2 Section Structure

```jsx
// Homepage section with earthy theme
<section className="relative py-24 lg:py-32 bg-olive-900">
  <div className="max-w-7xl mx-auto px-6 lg:px-8">
    <h2 className="font-display text-3xl md:text-4xl text-cream-100 text-center mb-12">
      Section Title
    </h2>
    {/* Content */}
  </div>
</section>
```

### 9.3 Loading States

```jsx
// Section loading
if (isLoading) {
  return <div className="h-[400px] bg-olive-900 animate-pulse" />;
}

// Card loading
<div className="bg-gray-200 h-4 w-20 rounded animate-pulse" />
```

### 9.4 Overlay Patterns

```jsx
// Dark gradient overlay
<div className="absolute inset-0 bg-gradient-to-b from-olive-900/50 via-olive-900/40 to-olive-900/80" />

// Simple overlay
<div className="absolute inset-0 bg-olive-900/85" />
```

---

## 10. Icon System

Menggunakan **Lucide React** untuk semua ikon:

```jsx
import { Camera, Calendar, Users, Settings } from 'lucide-react';

// Standard icon
<Camera size={24} className="text-white" strokeWidth={2} />

// Filled icon
<Camera size={24} className="text-white" strokeWidth={2.5} fill="currentColor" />
```

---

## 11. File Structure

```
components/
├── ui/                    # Reusable UI components
│   ├── Logo.tsx
│   ├── ImageUpload.tsx
│   ├── ValidationMessage.tsx
│   └── index.ts
├── homepage/              # Homepage-specific components
│   ├── Navbar.tsx
│   ├── HeroSection.tsx
│   ├── AboutSection.tsx
│   └── ...
├── booking/               # Booking form components
│   ├── MultiStepForm.tsx
│   ├── ProgressIndicator.tsx
│   └── steps/
├── admin/                 # Admin panel components
│   ├── AdminDashboard.tsx
│   ├── tables/
│   └── modals/
```

---

## 12. Quick Reference

### Color Usage Summary

| Element | Earthy Theme | Admin Theme |
|---------|--------------|-------------|
| Background | `bg-olive-900` | `bg-gray-50` |
| Primary Text | `text-cream-100` | `text-gray-900` |
| Secondary Text | `text-cream-200` | `text-gray-600` |
| Primary CTA | `bg-gold-500` | `bg-primary-600` |
| Accent Hover | `hover:text-gold-400` | `hover:text-primary-600` |
| Border | `border-cream-300/50` | `border-gray-200` |

### Typography Summary

| Element | Class |
|---------|-------|
| Hero H1 | `font-display text-4xl md:text-6xl lg:text-7xl text-cream-100` |
| Section H2 | `font-display text-3xl md:text-4xl text-cream-100` |
| Body Text | `font-serif text-lg md:text-xl text-cream-200 leading-relaxed` |
| Nav Link | `text-sm tracking-[0.2em] uppercase` |
| CTA Button | `font-medium tracking-[0.15em] uppercase text-sm` |

---

## 13. Design Principles

1. **Elegance First** - Gunakan font serif dan display untuk kesan premium
2. **Earthy Warmth** - Warna olive, cream, dan gold menciptakan suasana hangat
3. **Generous Spacing** - Berikan ruang bernafas dengan padding yang cukup
4. **Subtle Animations** - Animasi halus untuk meningkatkan pengalaman
5. **Mobile-First** - Desain responsif dimulai dari mobile
6. **Accessibility** - Minimum touch target 44px, kontras yang baik

---

*Terakhir diperbarui: Januari 2026*
