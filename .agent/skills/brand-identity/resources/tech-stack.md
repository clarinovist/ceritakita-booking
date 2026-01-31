# Preferred Tech Stack & Implementation Rules

When generating code or UI components for this brand, you **MUST** strictly adhere to the following technology choices.

## Core Stack
* **Framework:** Next.js 14 (App Router, TypeScript)
* **Styling Engine:** Tailwind CSS (Mandatory)
* **Icons:** Lucide React
* **Database:** SQLite (via `better-sqlite3`)
* **State Management:** SWR for data fetching
* **Forms:** React Hook Form + Zod for validation

## Domain-Specific Libraries
* **Scheduling/Calendar:** FullCalendar (`@fullcalendar/react`)
* **Document Generation:** jsPDF (for booking receipts/invoices)
* **File Storage:** AWS S3 (via `@aws-sdk/client-s3`)
* **Data Export:** XLSX

## Implementation Guidelines

### 1. Tailwind Usage
* Use utility classes directly in JSX.
* Utilize the color tokens defined in `design-tokens.json` (e.g., use `text-olive-700` or `bg-cream-100`).
* Follow the "Earthy & Moody" aesthetic: avoid high-contrast white unless necessary; use cream and muted olive tones instead.

### 2. Component Patterns
* **Buttons:** Use elegant, rounded styles. Subtle hover animations are preferred for a "premium" photography feel.
* **Layout:** Photography-focused layouts should prioritize large, high-quality images and elegant whitespace.

### 3. Forbidden Patterns
* Do NOT use jQuery or Bootstrap.
* Avoid heavy third-party UI libraries if a simple Tailwind implementation suffices, to keep the "bespoke" feel of the studio.
