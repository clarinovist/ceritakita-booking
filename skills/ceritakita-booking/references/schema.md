# Database Schema Reference

## Tables Overview

### Core Booking Tables

#### bookings
Primary booking records.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID, primary key |
| created_at | TEXT | ISO timestamp |
| status | TEXT | Active/Cancelled/Rescheduled/Completed |
| customer_name | TEXT | Customer full name |
| customer_whatsapp | TEXT | WhatsApp number |
| customer_category | TEXT | Service category (prewedding/wedding/etc) |
| customer_service_id | TEXT | FK to service |
| booking_date | TEXT | Session date |
| booking_notes | TEXT | Special requests |
| booking_location_link | TEXT | Google Maps link |
| total_price | INTEGER | Final price in rupiah |
| service_base_price | INTEGER | Base service price |
| base_discount | INTEGER | Category discount |
| addons_total | INTEGER | Sum of addons |
| coupon_discount | INTEGER | Coupon deduction |
| coupon_code | TEXT | Applied coupon |
| photographer_id | TEXT | FK to photographers |
| updated_at | TEXT | Last update |

#### payments
Payment records linked to bookings.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Auto-increment |
| booking_id | TEXT | FK to bookings |
| date | TEXT | Payment date |
| amount | INTEGER | Amount in rupiah |
| note | TEXT | Payment notes |
| proof_filename | TEXT | Local filename |
| proof_url | TEXT | B2 URL |
| storage_backend | TEXT | local/b2 |
| created_at | TEXT | Timestamp |

#### booking_addons
Many-to-many junction for bookings and addons.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Auto-increment |
| booking_id | TEXT | FK to bookings |
| addon_id | TEXT | FK to addons |
| quantity | INTEGER | Default 1 |
| price_at_booking | INTEGER | Price snapshot |

### Add-ons & Pricing

#### addons
Available add-on services.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID |
| name | TEXT | Add-on name |
| price | INTEGER | Price in rupiah |
| applicable_categories | TEXT | JSON array of categories |
| is_active | INTEGER | 0/1 |

#### coupons
Discount codes.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID |
| code | TEXT | Unique coupon code |
| discount_type | TEXT | percentage/fixed |
| discount_value | REAL | Discount amount |
| min_purchase | REAL | Minimum order |
| max_discount | REAL | Cap for percentage |
| usage_limit | INTEGER | Max uses |
| usage_count | INTEGER | Current uses |
| valid_from | TEXT | Start date |
| valid_until | TEXT | End date |
| is_active | INTEGER | 0/1 |

### Staff Management

#### photographers
Studio photographers.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID |
| name | TEXT | Full name |
| phone | TEXT | Contact |
| specialty | TEXT | Specialization |
| is_active | INTEGER | 0/1 |

#### users
Admin system users.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID |
| username | TEXT | Unique login |
| password_hash | TEXT | bcrypt hash |
| role | TEXT | admin/staff |
| is_active | INTEGER | 0/1 |
| permissions | TEXT | JSON array |

### CRM & Leads

#### leads
Mini CRM lead tracking.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID |
| name | TEXT | Lead name |
| whatsapp | TEXT | Contact |
| email | TEXT | Email |
| status | TEXT | New/Contacted/Follow Up/Won/Lost/Converted |
| source | TEXT | Meta Ads/Organic/Referral/etc |
| interest | TEXT | JSON array of services |
| notes | TEXT | Notes |
| assigned_to | TEXT | FK to users |
| booking_id | TEXT | FK to bookings |
| converted_at | TEXT | When converted |
| last_contacted_at | TEXT | Last contact |
| next_follow_up | TEXT | Scheduled follow-up |

#### lead_interactions
Interaction history for leads.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID |
| lead_id | TEXT | FK to leads |
| interaction_type | TEXT | WhatsApp/Phone/Email/Note |
| interaction_content | TEXT | Content |
| created_by | TEXT | FK to users |
| meta_event_sent | INTEGER | 0/1 |
| meta_event_id | TEXT | Meta event ID |

### Expenses & Finance

#### expenses
Business expense tracking.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID |
| date | TEXT | Expense date |
| category | TEXT | operational/equipment/marketing/salary/other |
| description | TEXT | Description |
| amount | INTEGER | Amount in rupiah |
| created_by | TEXT | FK to users |

#### system_settings
Key-value store for business config.

| Column | Type | Notes |
|--------|------|-------|
| key | TEXT | Primary key |
| value | TEXT | Setting value |

### Freelancer Management

#### freelancers
Freelance staff.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID |
| name | TEXT | Full name |
| phone | TEXT | Contact |
| default_fee | INTEGER | Standard fee |
| is_active | INTEGER | 0/1 |

#### freelancer_roles
Freelancer role types.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID |
| name | TEXT | Role name |
| short_code | TEXT | Code (FG/MUA/VG/etc) |

#### freelancer_jobs
Freelancer job assignments.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID |
| freelancer_id | TEXT | FK |
| booking_id | TEXT | FK (optional) |
| role_id | TEXT | FK to roles |
| work_date | TEXT | Date worked |
| fee | INTEGER | Amount |
| notes | TEXT | Notes |

### Homepage CMS

#### homepage_content
Key-value content for public pages.

| Column | Type | Notes |
|--------|------|-------|
| section | TEXT | hero/about/cta/footer/promo |
| content_key | TEXT | Key name |
| content_value | TEXT | Content |

#### service_categories
Photography service types.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID |
| name | TEXT | Category name |
| slug | TEXT | URL slug |
| description | TEXT | Description |
| thumbnail_url | TEXT | Image URL |
| display_order | INTEGER | Sort order |
| is_active | INTEGER | 0/1 |

#### testimonials
Customer testimonials.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID |
| quote | TEXT | Testimonial text |
| author_name | TEXT | Customer name |
| author_title | TEXT | Session type |
| display_order | INTEGER | Sort order |
| is_active | INTEGER | 0/1 |

#### value_propositions
Homepage value props.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID |
| title | TEXT | Headline |
| description | TEXT | Body text |
| icon | TEXT | Lucide icon name |
| display_order | INTEGER | Sort order |

### Analytics

#### ads_performance_log
Meta Ads metrics cache.

| Column | Type | Notes |
|--------|------|-------|
| date_record | TEXT | Date (UNIQUE) |
| spend | REAL | Daily spend |
| impressions | INTEGER | Impressions |
| clicks | INTEGER | Clicks |
| reach | INTEGER | Reach |

#### website_traffic
Traffic analytics.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID |
| path | TEXT | Page path |
| visitor_id | TEXT | Anonymous ID |
| user_agent | TEXT | Browser UA |
| device_type | TEXT | mobile/desktop/tablet |
| referer | TEXT | Referrer |
| visited_at | TEXT | Timestamp |

#### performance_metrics
Operation timing metrics.

| Column | Type | Notes |
|--------|------|-------|
| operation | TEXT | Operation name |
| module | TEXT | Module name |
| execution_time_ms | REAL | Duration |
| metadata | TEXT | JSON context |
