# Changelog

All notable changes to the CeritaKita Studio Booking System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0](https://github.com/clarinovist/ceritakita-booking/compare/v1.0.0...v1.1.0) (2026-04-09)


### Features

* add explicit save button for Google Drive link with success feedback ([c0763ef](https://github.com/clarinovist/ceritakita-booking/commit/c0763efdc0baa2bf7e039d998ddc0765e7981f32))


### Bug Fixes

* allow drive link updates on completed bookings and resolve input value sync bug ([75147dd](https://github.com/clarinovist/ceritakita-booking/commit/75147dd948042404c1d12badc4864d4ba242d9f7))
* explicit dimensions for QR code svg to prevent print collapsing ([fd6a114](https://github.com/clarinovist/ceritakita-booking/commit/fd6a114340ac6d2bc80c5752c51c33fb0aa9b00c))
* persist drive_link correctly on booking update ([78358c8](https://github.com/clarinovist/ceritakita-booking/commit/78358c8b850e69a412aa78bec14e63c4e06cde74))

## 1.0.0 (2026-04-08)


### Features

* add auto-deployment job to GitHub CI/CD workflow ([aec22ac](https://github.com/clarinovist/ceritakita-booking/commit/aec22ace55d89255de9c8ca0575e6a317ad26d1b))
* add automated email report system (daily/weekly/monthly) ([2d67491](https://github.com/clarinovist/ceritakita-booking/commit/2d67491829f2131b2c52b906fc5766e8f9c71f14))
* add automatic code reset on deploy and DB sync for dev flow ([449c1a2](https://github.com/clarinovist/ceritakita-booking/commit/449c1a269fff150b550426fef92b1dfdd5c07b5d))
* Add customer booking email confirmation and optional email field ([92a7aa1](https://github.com/clarinovist/ceritakita-booking/commit/92a7aa1ad3af7d9abf843188eb71478b5586b736))
* add DateFilterToolbar component and enhance dashboard UI ([19258be](https://github.com/clarinovist/ceritakita-booking/commit/19258be59994b450e18fa3b0bba534a976472d2c))
* add delete booking functionality and verify add-on selection ([5574036](https://github.com/clarinovist/ceritakita-booking/commit/5574036f1f662ed9e28301c259d30366d24b7684))
* add financial report preview and fix export routes ([1706384](https://github.com/clarinovist/ceritakita-booking/commit/17063844319afd83f83dcc6de2489ae86092c102))
* add GallerySection component (WIP - needs design refinement) ([c5dab61](https://github.com/clarinovist/ceritakita-booking/commit/c5dab61f36f37202d38e613d9e0381a2e982864f))
* add Google Drive link to booking invoices ([73d675b](https://github.com/clarinovist/ceritakita-booking/commit/73d675b5fb6ab7ac119d8b9969d6f90ab984d0d7))
* add lead performance analytics dashboard ([d68499b](https://github.com/clarinovist/ceritakita-booking/commit/d68499b363a422c524dbd23bda0a02ad046d63e9))
* add Meta Ads Performance History with comprehensive improvements ([34a2582](https://github.com/clarinovist/ceritakita-booking/commit/34a2582561376795e032bce3a00f967f37d462a4))
* Add new service categories for photo bookings ([7b988dc](https://github.com/clarinovist/ceritakita-booking/commit/7b988dcc9733b88c69bfdc9dcb2ad3fea49edc34))
* add service benefits management and display ([ef0ba36](https://github.com/clarinovist/ceritakita-booking/commit/ef0ba36f7de316589915454b45aa2fa6a4a0d6fb))
* **auth:** redesign login page with earthy theme and new features ([7bb0a78](https://github.com/clarinovist/ceritakita-booking/commit/7bb0a78b63ed6d531d49d41a17b42b72ac5659b3))
* complete coupon management integration ([6a62a65](https://github.com/clarinovist/ceritakita-booking/commit/6a62a65d947f9fb496dfc8e1f02c242c56eebe85))
* complete major refactoring and feature updates ([7345078](https://github.com/clarinovist/ceritakita-booking/commit/7345078cfee97af21f15b52dc4c306f532c1587e))
* enable HTTPS/SSL with automatic HTTP to HTTPS redirect ([1f851e8](https://github.com/clarinovist/ceritakita-booking/commit/1f851e8a452955e09b387436bd3906460fe06e23))
* enhance admin settings with improved API handling and UI updates ([7431773](https://github.com/clarinovist/ceritakita-booking/commit/74317735e2f233e86d3423bcfe431db451594e22))
* enhance Meta Ads integration with date filters and marketing funnel ([8286293](https://github.com/clarinovist/ceritakita-booking/commit/828629357100bbedcc31f41629a20efe38f4e0f1))
* enhance service selection UI with tiered pricing and premium styles ([f292d9e](https://github.com/clarinovist/ceritakita-booking/commit/f292d9e342bb05d1d56c4e1dfbe9f0dbbbf4baff))
* **freelancer:** integrate active freelancer management module ([b06a6d5](https://github.com/clarinovist/ceritakita-booking/commit/b06a6d5b956c0f15e2c3724bcd7ff6fc17390736))
* **homepage:** add Ramadan Berkah theme across all sections ([cc4c98e](https://github.com/clarinovist/ceritakita-booking/commit/cc4c98e92737af02433370e0a842851c20c6b630))
* implement bulk leads management with pagination ([785fc6a](https://github.com/clarinovist/ceritakita-booking/commit/785fc6a744981812a6a8674a2c707cfd425afae5))
* implement comprehensive admin settings refactor with tabbed interface ([fa791f2](https://github.com/clarinovist/ceritakita-booking/commit/fa791f2df57f9755b3d9ae6d616dd9126e36402f))
* implement comprehensive security fixes for Completed booking status ([cb82ab3](https://github.com/clarinovist/ceritakita-booking/commit/cb82ab31b9a65f8169d03ae4445cb998b4902599))
* implement custom website traffic analytics in admin dashboard ([24d7554](https://github.com/clarinovist/ceritakita-booking/commit/24d7554ce5a18a33c006f0b038f01d2c00f8b201))
* implement custom website traffic analytics in admin dashboard ([21b07fc](https://github.com/clarinovist/ceritakita-booking/commit/21b07fc9bb7787300583956238bfb0ec12bbaa59))
* implement dynamic background images for Testimonials and CTA sections ([f73058f](https://github.com/clarinovist/ceritakita-booking/commit/f73058f1661cb1e66a99962c33b61d9b0987d978))
* Implement dynamic site branding (logo, title, favicon) ([0ea156f](https://github.com/clarinovist/ceritakita-booking/commit/0ea156f7283838d7a0fbdc9e3198a91a02444251))
* implement dynamic WhatsApp settings and template management ([de02d73](https://github.com/clarinovist/ceritakita-booking/commit/de02d738d241d53c5f72cc92839ac1c0264ded24))
* Implement Finance module with expenses and revenue tracking ([327fe22](https://github.com/clarinovist/ceritakita-booking/commit/327fe2264404185db97609e6d3200fdee574a262))
* Implement Homepage CMS migration and Admin Panel ([2104f1d](https://github.com/clarinovist/ceritakita-booking/commit/2104f1d5a6b8d30dc178af4b4138ddf7162de726))
* implement leads kanban board with drag and drop ([d859f25](https://github.com/clarinovist/ceritakita-booking/commit/d859f25fbafd5e510ee055757ef6f3344746eb3f))
* implement Leads Management (Mini CRM) system ([6ee32ce](https://github.com/clarinovist/ceritakita-booking/commit/6ee32ce0612fc040dd15f71caa7f2be5e86d6a47))
* implement leads performance optimization and monitoring dashboard integrated into settings ([6e56789](https://github.com/clarinovist/ceritakita-booking/commit/6e56789990018b5748aafd133c0e4d615a465c89))
* implement modern UI/UX improvements for booking system ([20310f3](https://github.com/clarinovist/ceritakita-booking/commit/20310f3ed34af1bbb1cddca162d974a6f3ca01a7))
* implement monthly cash position report with summary, trend charts, and pdf export ([10e4b5d](https://github.com/clarinovist/ceritakita-booking/commit/10e4b5ddf308e61331c7482ffc15eb127b973ae3))
* implement real trend logic in DashboardMetrics ([9134997](https://github.com/clarinovist/ceritakita-booking/commit/9134997e69119fdfbeea314693f2674726b6eb1e))
* implement System Settings with comprehensive fixes + Ads History feature ([3ee0cd3](https://github.com/clarinovist/ceritakita-booking/commit/3ee0cd3278eea987e2d0819379ba3c55f31abf48))
* implement Universal Invoice System with centralized settings ([b2d7612](https://github.com/clarinovist/ceritakita-booking/commit/b2d7612984b1d4459f4a84c7e111370a7285f1d5))
* improve analytics dashboard with traffic sources and normalized top pages ([0f05541](https://github.com/clarinovist/ceritakita-booking/commit/0f05541132f894ee3aee4ab3fbc1d7f43a81121a))
* improve dashboard metrics accuracy and implement consistent date formatting ([75266f7](https://github.com/clarinovist/ceritakita-booking/commit/75266f70be76f7b07bc4c8b92fe49f85fde6390b))
* integrate Backblaze B2 cloud storage for payment proofs ([3633322](https://github.com/clarinovist/ceritakita-booking/commit/363332240f648682b182d2cec6e3539477a978e2))
* integrate Meta Marketing API for Ads Insights ([3e6a90f](https://github.com/clarinovist/ceritakita-booking/commit/3e6a90f31f64b5c57ad08d248676cf18bd462b48))
* integrate Telegram automated reports and commands ([e37fe04](https://github.com/clarinovist/ceritakita-booking/commit/e37fe04070ea39c790d74fb74bec31eb2ad9eeb8))
* **leads:** add interest column and filtering capability ([77a55d5](https://github.com/clarinovist/ceritakita-booking/commit/77a55d51f80b86763bbba4b216e5e2c63a27169a))
* merge optimization and pnl PRs ([4d469c8](https://github.com/clarinovist/ceritakita-booking/commit/4d469c8266d301a6c14b4ac8589d0f3c5bb042b7))
* migrate ads logging from monthly to daily granularity ([014545e](https://github.com/clarinovist/ceritakita-booking/commit/014545e17bb25ead8b54b4607d10e95e7d4825f5))
* **nginx:** add configuration for ads tracker subdomain ([5b44252](https://github.com/clarinovist/ceritakita-booking/commit/5b44252edae104dae5ef51f09811fe14bd2b0720))
* optimize admin dashboard for mobile with responsive card views and shell improvements ([df634e3](https://github.com/clarinovist/ceritakita-booking/commit/df634e3bf45524aa2ba2d05cc02463cdc0610045))
* Optimize P&L report by filtering in the database ([43f850c](https://github.com/clarinovist/ceritakita-booking/commit/43f850c7a3c1bc5f480607da2d16d84c74b274c2))
* **perf:** implement pagination for bookings API ([a4cc3e3](https://github.com/clarinovist/ceritakita-booking/commit/a4cc3e3c2e6e7f966d1dc09183b5de84b142b231))
* redesign overdue follow-up email section into dashboard layout ([1f6d062](https://github.com/clarinovist/ceritakita-booking/commit/1f6d0624d8111541f30ec9e0a30420ba3d550799))
* refactor Branding & SEO settings with analytics integration ([4f183d0](https://github.com/clarinovist/ceritakita-booking/commit/4f183d053007ad49e9542eff17c7536b0bc57048))
* refresh landing page theme for wisuda and pernikahan season ([f3a2c5e](https://github.com/clarinovist/ceritakita-booking/commit/f3a2c5e0577e6ef8769970e432956fa376bfeb74))
* **reports:** streamline daily digest email layout and logic ([e9a6ef1](https://github.com/clarinovist/ceritakita-booking/commit/e9a6ef17c64f5fddbcc7a2a007ba942c1f43a998))
* **settings:** Add UI and toggle to configure Customer Email confirmation from Admin Settings ([3a0fcf9](https://github.com/clarinovist/ceritakita-booking/commit/3a0fcf939e6f6dec5f508e6f3a116f2c45003199))
* **telegram:** add real-time notifications for new bookings and payments ([e8119c5](https://github.com/clarinovist/ceritakita-booking/commit/e8119c5d7790aa690ba333c91a932df3dc7f3fad))
* update user permissions for leads, coupons, payment and homepage cms ([e26be64](https://github.com/clarinovist/ceritakita-booking/commit/e26be644aa639188a23ef497b8b93049a4f7be3e))


### Bug Fixes

* add dynamic export to /api/finance/summary route ([f55d067](https://github.com/clarinovist/ceritakita-booking/commit/f55d06767bccb358f161fa6988c7095b5e8dc8c5))
* add index signature to TrafficSourceData to satisfy recharts type ([c1dd96a](https://github.com/clarinovist/ceritakita-booking/commit/c1dd96ad978e12933b747b6f29f989818564bca7))
* add logs directory and remove service_images foreign key constraint ([d5ed34e](https://github.com/clarinovist/ceritakita-booking/commit/d5ed34e1f4c8d4aa702166a20ac49c3434b0d7fb))
* add Selesai button to StepPayment and form submission handling ([a795b8d](https://github.com/clarinovist/ceritakita-booking/commit/a795b8d4b143d2a995f370cc008955cd05b055eb))
* add sharp package for Next.js image optimization ([a756d82](https://github.com/clarinovist/ceritakita-booking/commit/a756d82392bac4453e3e4a6e24f0cd1497b88b2e))
* **admin:** add CSRF token to booking creation request in AdminDashboard ([23b3666](https://github.com/clarinovist/ceritakita-booking/commit/23b3666b49fa393e735207815d2dde1b33024259))
* **admin:** add fallback for null values in freelancer monthly recap ([0e37b2a](https://github.com/clarinovist/ceritakita-booking/commit/0e37b2ac449a40aa15d6018672f3b6abc3fc8976))
* allow year-month subdirectories in file upload paths ([962297b](https://github.com/clarinovist/ceritakita-booking/commit/962297bd2b470682b70e47f308382eae0defe306))
* **api:** resolve freelancer name disappearing on refresh due to aggressive API caching ([01f7a3d](https://github.com/clarinovist/ceritakita-booking/commit/01f7a3de73ef4f5bbc201bc5735e0064a186a0ec))
* apply date range filter to all metrics and bookings ([11704d6](https://github.com/clarinovist/ceritakita-booking/commit/11704d61dd50b9cf694bc3e35cf6b9823995033b))
* correct service type import in ServicesTable ([87e17ac](https://github.com/clarinovist/ceritakita-booking/commit/87e17acb4b04a51bec237c68d767f08a2dfb1bb0))
* dashboard now shows all bookings in date range regardless of status ([710324c](https://github.com/clarinovist/ceritakita-booking/commit/710324c03d81550da0246a335d4e7223aced6195))
* **dashboard:** Ensure outstanding balance is calculated correctly ([55f12f5](https://github.com/clarinovist/ceritakita-booking/commit/55f12f59ac90418e49793ccac9e6d0038709af10))
* **deployment:** implement auto-refresh on server action mismatch and stable build id ([cb896ed](https://github.com/clarinovist/ceritakita-booking/commit/cb896ed71f50a9a9d9cc90a375505647078a7d2e))
* disable caching on homepage API to reflect CMS updates ([753448e](https://github.com/clarinovist/ceritakita-booking/commit/753448e4b8c85c3d938f9ee0861c17f51b7f4598))
* display B2-hosted payment proofs in admin panel ([0704aa6](https://github.com/clarinovist/ceritakita-booking/commit/0704aa6299f9b43c9c13d5863bc146734216c4a0))
* Enforce strict validation for service categories ([67b34ef](https://github.com/clarinovist/ceritakita-booking/commit/67b34efe02c35b62799af19b6b2b148b9a1912ea))
* escape apostrophe in EmailReportsSettings to fix ESLint build error ([238d38d](https://github.com/clarinovist/ceritakita-booking/commit/238d38df102c331f2b67ea682f50d89ac087cd7f))
* **eslint:** rename unused reset variable in error.tsx to _reset ([46479c5](https://github.com/clarinovist/ceritakita-booking/commit/46479c595be4f5c8d7ca629b608d985c22fb465a))
* extend default date range to include next month for future bookings ([6de12fb](https://github.com/clarinovist/ceritakita-booking/commit/6de12fbfd1fda03d5364dc3ac4c78d4fcc329282))
* filter orphaned and inactive images from gallery API ([041ccc0](https://github.com/clarinovist/ceritakita-booking/commit/041ccc09084c4542d372a0551797aa45b4c409eb))
* **finance:** remove ads integration and fix default date timezone ([d1cfbe6](https://github.com/clarinovist/ceritakita-booking/commit/d1cfbe6f2a43a3da4e6240e8bf39c5af2f3ce687))
* **frontend:** add global error boundary for server action mismatch and adjust rate limiter ([a4e0c71](https://github.com/clarinovist/ceritakita-booking/commit/a4e0c719e22af85bd27d988c79339af170d9b03f))
* **frontend:** fix CSS syntax in image generators and add global deployment mismatch handler ([a3970a0](https://github.com/clarinovist/ceritakita-booking/commit/a3970a0865e37f4e4134794c5df388ebd04aabb4))
* **homepage:** improve text contrast on Portfolio and About sections ([70be192](https://github.com/clarinovist/ceritakita-booking/commit/70be192eb11323fddc3b81c71ca555d34ff18b8c))
* **homepage:** restore CMS variable for HeroSection tagline that was accidentally hardcoded ([ca00a4d](https://github.com/clarinovist/ceritakita-booking/commit/ca00a4d8d063d91957137f555c60a7b934c010cb))
* improve booking form price calculation and simplify payment UI ([f6e0e1b](https://github.com/clarinovist/ceritakita-booking/commit/f6e0e1b660040755f9952e6b54e896adeb5a8267))
* improve upload functionality and feedback in admin panel ([7ecb13c](https://github.com/clarinovist/ceritakita-booking/commit/7ecb13c1bf9bb367d0f42104937b109242eae8cc))
* **lock:** fix typescript type error in cleanupStaleLocks ([19d7cb5](https://github.com/clarinovist/ceritakita-booking/commit/19d7cb5097f970d944a24ee31972122d561dd11e))
* move MobileStepNavigation inside form for proper submission ([c07827e](https://github.com/clarinovist/ceritakita-booking/commit/c07827e2254f2f34902ffa3ddf75f9f5723e841b))
* move portfolio showcase to Step 2 and prevent undefined errors ([8561fb9](https://github.com/clarinovist/ceritakita-booking/commit/8561fb9cd1dd8d50e565a08ed70a70ab1f3e0bd5))
* move seedDefaultPaymentMethods to GET endpoint for proper initialization ([264063b](https://github.com/clarinovist/ceritakita-booking/commit/264063b99600e112ef19660599a4616d7e25c58c))
* pass dateRange prop to BookingsTable for export functionality ([f1c2d9a](https://github.com/clarinovist/ceritakita-booking/commit/f1c2d9a4e2e84f02306cbc336e5e0057a6becc88))
* prevent premature coupon application from stale state ([53986b0](https://github.com/clarinovist/ceritakita-booking/commit/53986b096d8343f775097314a5872ffa50d1753f))
* remove Recent Activity section from dashboard for focused summary view ([72e584c](https://github.com/clarinovist/ceritakita-booking/commit/72e584c15d51c082b136635f8b80498d7e497976))
* remove unused variable in TrafficStats to fix build ([c8d765b](https://github.com/clarinovist/ceritakita-booking/commit/c8d765bf8da7f60bf051b3e5369a24d6a1b1629c))
* **reports:** use actual date for upcoming schedules and remove overdue follow-ups ([eee5683](https://github.com/clarinovist/ceritakita-booking/commit/eee56839bee808fdff39e5aad277b95f3a1dd0a8))
* resolve benefit addition failure and 500 internal server error in services catalog ([307ed28](https://github.com/clarinovist/ceritakita-booking/commit/307ed283f0156cd990d3038fe229688d9dbc684a))
* resolve booking form errors and add portfolio image support ([8efed54](https://github.com/clarinovist/ceritakita-booking/commit/8efed54a2e3f0087fabf3918a2a4f373f4ca0aaa))
* resolve booking issues and improve admin table ([1124836](https://github.com/clarinovist/ceritakita-booking/commit/1124836bd7161264b767986b4dc0e1d43c5586f7))
* resolve build error by removing unused import and sync dependencies ([f6bc853](https://github.com/clarinovist/ceritakita-booking/commit/f6bc8537091cae6e1b864b324b74a2ffd1693b5a))
* resolve build errors in pnl report and benchmark script ([e714ad5](https://github.com/clarinovist/ceritakita-booking/commit/e714ad5819f737a09091e312f366177a0b08338a))
* resolve ESLint configuration errors and unused variables ([b1de254](https://github.com/clarinovist/ceritakita-booking/commit/b1de2541e08fb384df989b468280571dc373c6ac))
* resolve lint and type errors to ensure successful build ([3ec1b68](https://github.com/clarinovist/ceritakita-booking/commit/3ec1b68fb15df2d033d70424d171e0f0a1bf3009))
* resolve Next.js and Nginx warnings ([a663ec1](https://github.com/clarinovist/ceritakita-booking/commit/a663ec1f635ce9c29a98dbfb2b810b6b63adfe11))
* resolve NextAuth route context parameter error in App Router ([b637aab](https://github.com/clarinovist/ceritakita-booking/commit/b637aab961a3e86079389d658f132f65a3985374))
* resolve settings persistence bug and add active status indicators ([d93b8da](https://github.com/clarinovist/ceritakita-booking/commit/d93b8da9e71a57b4ab3ec3d70a3bd60288eaef5e))
* resolve TS errors causing github action build failures ([30f0acf](https://github.com/clarinovist/ceritakita-booking/commit/30f0acf610dba34eec5bc6e99fed2ec7b571e862))
* restore and organize user permission toggles in UserManagement ([7b548ea](https://github.com/clarinovist/ceritakita-booking/commit/7b548eafccf38de58e62da2c4d7cd71a7c03d56c))
* Service selection mismatch in Ringkasan Sementara ([f64f0de](https://github.com/clarinovist/ceritakita-booking/commit/f64f0deeb32970312d0fde23b091ab33406e096b))
* suppress benign Server Action errors from stderr to stop OpenClaw Telegram alerts ([e58e197](https://github.com/clarinovist/ceritakita-booking/commit/e58e1976b400046854eabf3d813a066ec8796c24))
* **ui:** Show email address in admin Bookings and Leads tables ([0a69364](https://github.com/clarinovist/ceritakita-booking/commit/0a6936446d2c5627b93dc627a9922aa89430cc8a))
* **uploads:** robust upload strategy and docs update ([efb3295](https://github.com/clarinovist/ceritakita-booking/commit/efb3295e39cd423df01b3380dc5d50f49313eaea))
* use sh instead of bash for alpine compatibility in diagnostic script ([4e8d26d](https://github.com/clarinovist/ceritakita-booking/commit/4e8d26ded913c2161cc1ed167d40633227933a02))


### Performance Improvements

* Implement exponential backoff for file lock polling ([ad733ae](https://github.com/clarinovist/ceritakita-booking/commit/ad733ae567b5639ae1e4f3f758c55666ae043a75))
* Optimize ads history backfill with batched DB writes ([a8aaf43](https://github.com/clarinovist/ceritakita-booking/commit/a8aaf43829f0b2aee293b704e68df7eb3e16ca84))
* optimize financial export with single-pass iteration ([350dcd1](https://github.com/clarinovist/ceritakita-booking/commit/350dcd159a3193e65de75ac2dba787cb1ea49872))
* Optimize getBookingsByStatus to fix N+1 query issue ([787df34](https://github.com/clarinovist/ceritakita-booking/commit/787df34f68f1e5f295cccf8691ba7bf0be2dfc1e))
* optimize lock cleanup with parallel operations ([7aacafb](https://github.com/clarinovist/ceritakita-booking/commit/7aacafb960cc4aefbd1f4bf2279db97ee03912ee))
* Optimize mapRowToAddon with JSON parsing cache ([84013c9](https://github.com/clarinovist/ceritakita-booking/commit/84013c90c57b7efa667afe18cf3ca30eaf47c011))
* Optimize searchBookings with batch fetching ([93047ba](https://github.com/clarinovist/ceritakita-booking/commit/93047bacdeee7b86a63b743b492499b9f66276cc))

## [Unreleased]

### Repository Synchronization & Performance Optimizations - 2026-01-25

#### Performance & Optimization
- **Database Query Fix**: Added index-aware optimization for `readData` query using `booking_date`.
- **Addon Parsing Optimization**: Implemented JSON parsing cache in `mapRowToAddon` for faster row mapping.
- **Admin Hook Enhancement**: Improved logging and comprehensive error handling in `useServices` hook.

#### Build & Type Fixes
- **Build Fix (P&L Report)**: Resolved "cannot reassign to a variable declared with const" in `app/api/reports/pnl/route.ts`.
- **Type Fix (Benchmark Script)**: Added nullish coalescing to `startDate` and `endDate` in `scripts/benchmark-export-filtering.ts` to prevent potential undefined errors.

#### DevOps & Infrastructure
- **Security & Permissions**: Updated `docker-compose.yml` to set specific app user and enhanced handling of `./data/services.json` permissions (`EACCES` prevention).
- **Documentation**: Updated `DEPLOYMENT_GUIDE.md` with detailed `./data` folder permission management.

#### Files Modified
- `app/api/reports/pnl/route.ts`
- `scripts/benchmark-export-filtering.ts`
- `components/admin/hooks/useServices.ts`
- `lib/repositories/bookings.ts`
- `docker-compose.yml`
- `DEPLOYMENT_GUIDE.md`

---

### Branding & SEO Settings with Analytics Integration - 2026-01-15

#### Refactored Settings Architecture
- **Simplified Branding Tab**: Removed redundant "System Contact Info" section for cleaner interface
- **Analytics & SEO Section**: New dedicated section for tracking configurations
- **Google Analytics Support**: Configurable GA4 Measurement ID integration
- **Meta Pixel Integration**: Facebook Pixel tracking for conversion optimization
- **Dynamic Script Injection**: `DynamicAnalytics` component renders tracking scripts in `<head>`

#### Files Modified
- `lib/types/settings.ts` - Added `googleAnalyticsId` and `metaPixelId` fields
- `components/admin/settings/BrandingTab.tsx` - Refactored with new Analytics section
- `components/analytics/DynamicAnalytics.tsx` - New component for dynamic script rendering
- `app/layout.tsx` - Integrated `DynamicAnalytics` component

---

### Universal Invoice System - 2026-01-15

#### Centralized Invoice Settings
- **Invoice Template Component**: Reusable `InvoiceTemplate` for consistent invoice rendering
- **Invoice Settings in Global Settings**: Company info, bank details, tax rate, notes all configurable
- **Preview Modal**: Preview invoices before generating in booking details
- **Dynamic Data Binding**: Invoices auto-populate from booking and settings data

#### Files Modified
- `components/admin/invoices/InvoiceTemplate.tsx` - Universal invoice component
- `app/admin/invoices/[id]/page.tsx` - Updated to use `InvoiceTemplate`
- `app/api/settings/route.ts` - Enhanced serialization for nested invoice settings
- `lib/storage-sqlite.ts` - Updated storage for invoice settings

---

### Leads Kanban Board View - 2026-01-15

#### Visual Lead Management
- **Kanban Board**: Drag-and-drop interface for managing leads by status
- **Status Columns**: New → Contacted → Qualified → Converted → Lost
- **Optimistic UI Updates**: Instant feedback on status changes
- **Dual View Toggle**: Switch between Table and Kanban views
- **Library**: Uses `@hello-pangea/dnd` for accessible drag-and-drop

#### Files Modified
- `components/admin/LeadsKanban.tsx` - New Kanban board component
- `hooks/useLeads.ts` - Enhanced with optimistic update support
- `components/admin/AdminDashboard.tsx` - Added view toggle button

---

### Dashboard Real Trend Logic - 2026-01-14

#### Dynamic Trend Indicators
- **Real Calculations**: Trend percentages now based on actual period comparisons
- **Period Comparison**: Current period vs previous period metrics
- **Visual Indicators**: Up/down arrows with green/red coloring
- **Multiple Metrics**: Revenue, bookings, and conversion trends

---

### Performance Optimizations - 2026-01-14

#### Database & API Improvements
- **N+1 Query Fix**: Optimized `getBookingsByStatus` with batch fetching
- **Addon Fetching**: Single addon fetch by ID instead of full list
- **Search Optimization**: Batch fetching for search results
- **System Settings Cache**: In-memory caching for settings
- **Financial Export**: Single-pass iteration for report generation
- **Ads Backfill**: Batched database writes for history import
- **Homepage ISR**: Incremental Static Regeneration for homepage API

---

### Security Enhancements - 2026-01-14

#### CSRF Protection
- **Token Validation**: CSRF tokens validated on authenticated booking requests
- **Secure Endpoints**: All mutation endpoints protected

---

### Service Upgrade Logic - 2026-01-14

#### Comprehensive Transition System
- **Upgrade Path Mapping**: Clear service transition paths (Bronze → Silver → Gold)
- **Price Difference Calculation**: Automatic upgrade price computation
- **Validation**: Prevents invalid downgrades or lateral moves

---

### Dynamic Branding & Upload Reliability - 2026-01-02

#### Dynamic Site Branding
- **Configurable Branding**: Admins can now update Site Name and Logo directly from the Admin Panel.
- **Real-time Updates**: Changes reflect instantly on the public website header, browser tab title, and favicon.
- **Zero-Latency Metadata**: Server-side metadata fetching optimized with direct DB access for best performance.

#### Robust File Uploads
- **Smart B2 Integration**: Auto-detection of Backblaze B2 region from endpoint configuration.
- **Local Storage Fallback**: Automatic fallback to local `public/uploads` storage if external storage fails, ensuring 100% upload reliability.

#### Files Modified
- `lib/types/settings.ts` - Added branding fields.
- `components/admin/settings/GeneralTab.tsx` - Added logo upload and site name editing.
- `components/ui/Logo.tsx` - Made logo and text dynamic.
- `app/layout.tsx` - Implemented dynamic metadata generation.
- `lib/b2-s3-client.ts` - Fixed region detection.
- `app/api/uploads/route.ts` - Added local fallback logic.

### Portfolio Showcase Display Fix - 2026-01-01

#### Bug Fix: Portfolio Display in Multi-Step Form
- **Fixed Portfolio Positioning**: Moved PortfolioShowcase from Step 1 to Step 2 (Add-ons Selection)
- **Safe Data Access**: Implemented null-safe portfolio image retrieval with fallback handling
- **Error Prevention**: Added optional chaining to prevent "Cannot read properties of undefined" errors
- **Conditional Rendering**: Portfolio only displays when images are available and service is selected
- **Enhanced UX**: Portfolio images now appear above add-ons list in Step 2 for better visibility

#### Files Modified
- `components/booking/steps/AddonsSelection.tsx` - Added PortfolioShowcase with safe data access
- `components/booking/steps/ServiceSelection.tsx` - Removed duplicate portfolio display

#### Technical Implementation
- Used `formData?.portfolioImages || []` pattern for safe array access
- Implemented conditional rendering: `isContextMode && selectedService && portfolioImages.length > 0`
- Proper prop passing to PortfolioShowcase component (selectedService, portfolioImages, openLightbox)
- Wrapped portfolio and addons sections in `space-y-6` container for proper spacing

### Dashboard Enhancements - 2026-01-01

#### DateFilterToolbar Component
- **New Component**: Added DateFilterToolbar for consistent date filtering across admin views
- **Quick Filters**: Today, Yesterday, This Week, This Month, Last Month, Custom Range
- **Responsive Design**: Mobile-friendly date selection interface
- **Integration**: Implemented in bookings and dashboard views

#### Payment Methods Initialization
- **Auto-Seeding**: Default payment methods now initialized on first GET request
- **Improved UX**: No manual setup required for fresh installations
- **Database Migration**: Automatic creation of default bank transfer method

### Admin Settings Refactor - 2026-01-01

#### Comprehensive Settings Management with Tabbed Interface
- **Tabbed Settings UI**: Refactored admin settings into 5 logical tabs for better organization
  - **General & SEO**: Site branding, hero title, meta tags for SEO
  - **Contact & Socials**: Business email, social media links (Instagram, TikTok), Google Maps link
  - **Finance**: Bank details (name, number, holder), invoice notes, tax rate, deposit rules
  - **Booking Rules**: Minimum booking notice, maximum booking advance period
  - **Templates**: WhatsApp message template management with variable support

#### Enhanced Invoice Generation
- **Dynamic Bank Details**: Invoices now display bank information from system settings
- **Business Email**: Configurable business email shown on invoices
- **Tax Calculation**: Automatic tax calculation with configurable rate (0-100%)
- **Social Media Links**: Optional social media profiles displayed on invoices
- **Custom Invoice Notes**: Configurable footer notes for payment terms and disclaimers

#### Booking Rules Enforcement
- **Minimum Notice Period**: Prevents same-day bookings based on configured notice
- **Maximum Advance Booking**: Limits how far in advance customers can book
- **Server-Side Validation**: Booking API enforces rules to prevent bypassing client validation
- **Smart Date Picker**: Calendar interface disables dates outside allowed range

#### Database & Type Safety
- **Schema Expansion**: Added 15+ new settings columns to `system_settings` table
- **TypeScript Interfaces**: Comprehensive type definitions in `lib/types/settings.ts`
- **Migration Script**: SQLite-compatible migration with default values and backward compatibility
- **No `any` Types**: Full type safety maintained throughout

#### New Components
- `components/admin/settings/GeneralTab.tsx` - Branding and SEO management
- `components/admin/settings/ContactTab.tsx` - Contact info and social links
- `components/admin/settings/FinanceTab.tsx` - Financial settings
- `components/admin/settings/RulesTab.tsx` - Booking constraints
- `components/admin/settings/TemplatesTab.tsx` - Message templates

#### Files Modified
- `components/admin/SettingsManagement.tsx` - Refactored to tabbed interface
- `app/admin/invoices/[id]/page.tsx` - Dynamic settings integration
- `app/api/bookings/route.ts` - Server-side rule validation
- `components/booking/steps/ScheduleInfo.tsx` - Client-side rule enforcement
- `lib/types/settings.ts` - Expanded type definitions
- `scripts/migrate-settings.sql` - Database migration script
- `user_stories_admin_settings_refactor.md` - Comprehensive documentation

#### Testing & Validation
- **Settings Persistence**: All 5 tabs successfully save and load settings via `/api/settings`
- **Tax Rate Configuration**: Tested tax calculation (11% rate) with invoice generation
- **Bank Details Update**: Verified bank information updates reflect in invoices
- **Booking Rules**: Confirmed min/max booking notice enforcement works correctly
- **Type Safety**: All TypeScript interfaces validated with no `any` types
- **Audit Trail**: Settings changes properly logged with user context

#### Impact
- **Improved UX**: Settings organized logically, easier to find and manage
- **Dynamic Configuration**: All business settings configurable without code changes
- **Enhanced Invoices**: Professional invoices with accurate business information
- **Flexible Booking Rules**: Business owners control booking constraints
- **Type Safety**: Reduced bugs through comprehensive TypeScript types
- **Backward Compatible**: Existing functionality preserved while adding new features

### Leads Management System - 2025-12-XX

#### Mini CRM Implementation
- **Lead Tracking**: Comprehensive system for managing customer inquiries
- **Status Pipeline**: New → Contacted → Qualified → Converted → Lost
- **Customer Data**: Name, phone, email, source, and custom notes
- **Follow-up System**: Track last contact date and next follow-up
- **Conversion Tracking**: Convert leads directly to bookings
- **Filtering**: Status-based filtering and search functionality
- **API Endpoints**: Full CRUD operations for lead management

### Dynamic WhatsApp Settings - 2025-12-XX

#### Template Management
- **Dynamic Templates**: Configure WhatsApp message templates from admin settings
- **Variable Support**: Use placeholders like {{customer_name}}, {{service}}, {{date}}, {{time}}
- **Live Preview**: Test templates with sample data before sending
- **Template Variables**: Full list of available variables with descriptions
- **Auto-Replacement**: System automatically replaces variables when sending messages

### Code Quality Improvements - 2025-01-XX

#### Standardized Error Handling & Logging
- **Standardized error handling**: All API routes now use `createErrorResponse` helper for consistent error responses
- **Centralized logging**: Replaced all `console.error/log/warn` calls in API routes with structured `logger` utility
- **Improved error context**: All error logs now include relevant context information for better debugging
- **Type safety improvements**: Enhanced TypeScript types throughout the codebase

#### Code Cleanup
- **Utility improvements**: Removed console.error calls from date formatting utilities (silent failure pattern)
- **Import consistency**: Fixed import inconsistencies across API routes
- **Documentation consolidation**: Merged redundant documentation files and updated README with Meta Ads integration details

#### Files Modified
- All API routes (20+ files) - Standardized error handling and logging
- `utils/dateFormatter.ts` - Cleaned up error handling
- `README.md` - Added Meta Ads integration section
- Documentation files consolidated and cleaned up

#### Impact
- Better error tracking with structured logs
- Consistent error responses across all API endpoints
- Improved debugging capabilities with contextual error information
- Cleaner codebase with reduced redundancy

### Fixed - 2025-12-26

#### Booking Form & Portfolio Images
- **Fixed CSS typo in StepAddons component**: Corrected invalid CSS class `gap- gap-2` to `gap-2` in addon quantity controls (components/booking/StepAddons.tsx:198)
- **Fixed portfolioImages undefined error**: Resolved "Cannot read properties of undefined (reading 'length')" error by properly accessing `portfolioImages` from `formData.portfolioImages` instead of trying to destructure it directly from context
- **Added Backblaze B2 image domain configuration**: Added `ceritakita-images.s3.eu-central-003.backblazeb2.com` to Next.js `remotePatterns` in next.config.mjs to enable portfolio image optimization and display

#### Impact
These fixes enable:
- Proper display of addon quantity controls in the booking form
- Portfolio images to load and display correctly in the addons step
- Next.js Image Optimization for Backblaze B2-hosted portfolio images

### Technical Details
- **Files Modified**:
  - `components/booking/StepAddons.tsx` - Fixed CSS class and portfolioImages access
  - `next.config.mjs` - Added Backblaze B2 domain to image remotePatterns
- **Deployment**: Changes deployed via Docker rebuild on 2025-12-26

---

## Previous Changes

### Added - Earlier
- Portfolio image fetching and display in booking form
- Multi-step booking form with addons
- Coupon system with validation
- Payment settings API
- Backblaze B2 integration for image storage
- Docker deployment configuration
- Nginx reverse proxy setup
