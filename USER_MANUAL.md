# User Manual - CeritaKita Studio Booking System

**For Studio Staff & Administrators**

This manual provides non-technical instructions for managing the booking system through the Admin Dashboard.

---

## 📋 Table of Contents
1. [Accessing the Admin Dashboard](#accessing-the-admin-dashboard)
2. [Managing Portfolio Images](#managing-portfolio-images)
3. [Payment Methods Management](#payment-methods-management)
4. [User Account Management](#user-account-management)
5. [Booking Status Management](#booking-status-management)
6. [Site Branding Configuration](#site-branding-configuration)
7. [Leads Management (Kanban Board)](#leads-management-kanban-board)
8. [Analytics & SEO Configuration](#analytics--seo-configuration)
9. [Invoice Management](#invoice-management)

---

## Accessing the Admin Dashboard

### Login Steps
1. Open your web browser and go to: `https://your-domain.com/admin`
2. Enter your **Username** and **Password**
3. Click **"Login"** or press Enter

### Logout
1. Click the **"Logout"** button in the admin dashboard
2. You will be redirected to the login page

**Note**: For security, always logout when finished, especially on shared computers.

---

## Managing Portfolio Images

Portfolio images showcase your photography work to potential clients.

### Adding New Portfolio Images

1. **Navigate to Portfolio Section**
   - Login to Admin Dashboard
   - Look for **"Portfolio Management"** section

2. **Upload Images**
   - Click **"Add Image"** or **"Upload"** button
   - Select photos from your computer (JPEG, PNG, WebP formats)
   - Recommended size: 1920x1080px for best display
   - Maximum file size: 5MB per image

3. **Add Image Details**
   - **Title**: Brief description (e.g., "Wedding at Bali Beach")
   - **Category**: Select from dropdown (Wedding, Portrait, Event, etc.)
   - **Description**: Optional details about the shoot

4. **Save**
   - Click **"Save"** or **"Upload"**
   - Image will appear in portfolio gallery immediately

### Managing Existing Images

- **View**: All portfolio images displayed in a grid
- **Edit**: Click the **pencil icon** to update title/description
- **Delete**: Click the **trash icon** to remove an image
- **Reorder**: Drag and drop images to change display order

### Best Practices
- Upload high-quality, representative images
- Organize by category for easy browsing
- Update regularly with recent work
- Remove outdated or low-quality images

---

## Payment Methods Management

Manage all accepted payment methods for customer bookings.

### Adding a New Payment Method

1. **Navigate to Payment Settings**
   - Login to Admin Dashboard
   - Find **"Payment Methods"** section

2. **Add Method**
   - Click **"Add Payment Method"**
   - Fill in the details:
     - **Name**: Payment method name (e.g., "BCA Transfer", "QRIS", "DANA")
     - **Account Number**: Your business account number
     - **Account Name**: Name on the account
     - **Instructions**: Payment instructions for customers

3. **Save**
   - Click **"Save"**
   - Payment method is immediately available for bookings

### Toggling Payment Methods On/Off

**To Temporarily Disable**:
- Find the payment method in the list
- Click the **toggle switch** next to it (turns gray/off)
- Customers won't see this option during booking

**To Re-enable**:
- Click the toggle switch again (turns blue/on)
- Payment method becomes available immediately

### Managing Existing Methods

- **Edit**: Click the **pencil icon** to update details
- **Delete**: Click the **trash icon** to remove permanently
- **View Status**: Green toggle = Active, Gray toggle = Inactive

### Multiple Payment Methods
You can have multiple active payment methods simultaneously:
- **BCA Transfer**: Account number, a.n. [Name]
- **QRIS**: QR code for instant payment
- **DANA/OVO/GOPAY**: Digital wallet transfers
- **Cash**: For in-person payments

**Customer Experience**: During booking, customers see all active payment methods and choose their preferred option.

---

## User Account Management

Manage staff accounts who can access the Admin Dashboard.

### Adding New Staff Accounts

1. **Navigate to User Management**
   - Login to Admin Dashboard
   - Find **"User Management"** section

2. **Add User**
   - Click **"Add User"** or **"Create Account"**
   - Enter:
     - **Username**: Login name (e.g., "admin_sarah")
     - **Password**: Secure password
     - **Role**: Select from dropdown (Admin, Staff, etc.)
     - **Full Name**: Staff member's name

3. **Save**
   - Click **"Create"** or **"Save"**
   - New staff can login immediately with these credentials

### Managing Existing Users

- **View List**: See all user accounts
- **Edit**: Click **pencil icon** to update password or role
- **Delete**: Click **trash icon** to remove account
- **Reset Password**: Edit user and enter new password

### User Roles & Permissions

**Admin Role**:
- Full access to all features
- Can manage users, bookings, payments, settings
- Can export data and view financial reports

**Staff Role**:
- View and manage bookings
- Update booking statuses
- Add payment records
- Cannot manage users or system settings

### Security Best Practices

- **Strong Passwords**: Minimum 8 characters, mix of letters, numbers, symbols
- **Unique Accounts**: One account per staff member (no sharing)
- **Regular Updates**: Change passwords every 3-6 months
- **Immediate Deletion**: Remove accounts when staff leaves
- **Never Share**: Don't write passwords where others can see them

---

## Booking Status Management

Track and update booking progress from inquiry to completion.

### Understanding Booking Statuses

**Active**:
- Current booking being processed
- Awaiting payment or confirmation
- Upcoming sessions

**Completed**:
- Session completed
- Full payment received
- Ready for delivery

**Cancelled**:
- Customer cancelled
- Full refund issued (if applicable)
- Remove from active schedule

**Rescheduled**:
- Date/time changed
- Original booking modified
- History tracked automatically

### Viewing Bookings

1. **Dashboard Overview**
   - Total bookings count
   - Revenue statistics
   - Quick status summary

2. **Calendar View**
   - Visual timeline of all bookings
   - Color-coded by status
   - Click date to see bookings

3. **Booking Table**
   - List view with search and filter
   - Sort by date, name, or status
   - Click row for full details

### Updating Booking Status

1. **Find the Booking**
   - Use search bar (name, WhatsApp, booking ID)
   - Filter by status or date range

2. **Update Status**
   - Click the booking row
   - In detail view, find **"Status"** dropdown
   - Select new status:
     - **Active** → **Completed** (after session)
     - **Active** → **Cancelled** (if cancelled)
     - **Active** → **Rescheduled** (if date changed)

3. **Add Notes** (Optional)
   - Add reason for status change
   - Important for record keeping

### Managing Payments

**Adding Payment Record**:
1. Open booking details
2. Click **"Add Payment"**
3. Enter:
   - **Amount**: Payment received
   - **Date**: When payment was made
   - **Method**: How they paid (BCA, QRIS, etc.)
   - **Note**: Optional description
4. **Upload Proof**: Click **"Choose File"** to attach payment screenshot
5. **Save**: Payment is recorded immediately

**Viewing Payment History**:
- All payments shown in booking details
- Total paid vs. total price displayed
- Payment progress bar shows completion percentage

### Rescheduling Bookings

1. **Open Booking Details**
2. Click **"Reschedule"** button
3. Select new date and time
4. Add reason for reschedule
5. **Confirm**: System tracks history automatically

### Customer Communication Tips

- **Before Session**: Send reminder 1 day before
- **After Payment**: Confirm receipt immediately
- **After Session**: Thank customer and request feedback
- **For Issues**: Contact customer promptly via WhatsApp

### Daily Workflow Checklist

**Morning**:
- [ ] Check calendar for today's bookings
- [ ] Review new inquiries from overnight
- [ ] Confirm payment proofs received

**Throughout Day**:
- [ ] Update booking statuses as they progress
- [ ] Add new payment records
- [ ] Respond to reschedule requests

**End of Day**:
- [ ] Review completed bookings
- [ ] Update any pending statuses
- [ ] Check revenue totals
- [ ] Prepare for next day's sessions

---

## Quick Reference

### Keyboard Shortcuts (Admin Dashboard)
- **/**: Focus search bar
- **Esc**: Close modals/popups
- **Enter**: Confirm actions

### Common Tasks
- **Add Payment**: Open booking → Add Payment → Upload proof → Save
- **Reschedule**: Open booking → Reschedule → Pick new date → Confirm
- **Complete Booking**: Update status to "Completed" → Add final notes
- **Cancel Booking**: Update status to "Cancelled" → Add refund notes

### Getting Help
- **Technical Issues**: Contact your developer/IT support
- **System Questions**: Refer to this manual
- **Emergency**: Check system logs or restart browser

---

**Remember**: Always double-check booking details before updating status. Customer satisfaction is our priority!

---

## Site Branding Configuration

Customize your website's identity directly from the admin panel.

### Changing Site Name & Logo

1. **Navigate to Settings**
   - Login to Admin Dashboard
   - Click **"System Settings"** (or the Gear Icon)
   - Ensure you are on the **"General & SEO"** tab

2. **Update Site Name**
   - Enter your new business name in the **"Site Name"** field
   - This name appears in the browser title and site headers

3. **Upload Logo**
   - Click **"Upload New Logo"**
   - Select a transparent PNG or high-quality JPG
   - The system will upload it (supports large files up to 5MB)
   - **Preview**: You can see your new logo immediately

4. **SEO Settings**
   - Update **"Hero Title"** to change the main headline on the homepage
   - Update **"Meta Title"** and **"Meta Description"** for Google search results

5. **Save Changes**
   - Click **"Save All Settings"**
   - **Verify**: Refresh your public website to see the changes instantly (Logo, Title, and Favicon)

---

## Leads Management (Kanban Board)

Manage customer inquiries with a visual Kanban board.

### Accessing Leads

1. **Navigate to Leads**
   - Login to Admin Dashboard
   - Click **"Leads"** in the sidebar

### Using Kanban View

1. **Switch to Kanban View**
   - Click the **"Kanban"** toggle button (top right)
   - Leads are organized in columns by status

2. **Status Columns**
   - **New**: Fresh inquiries
   - **Contacted**: Initial contact made
   - **Qualified**: Potential customer confirmed
   - **Converted**: Became a booking
   - **Lost**: Did not convert

3. **Moving Leads**
   - **Drag and Drop**: Click and drag a lead card to another column
   - Status updates automatically and saves immediately
   - Visual feedback confirms the move

### Using Table View

1. **Switch to Table View**
   - Click the **"Table"** toggle button
   - See leads in a traditional list format
   - Search and filter capabilities available

### Converting Leads to Bookings

1. Open a qualified lead
2. Click **"Convert to Booking"**
3. Customer info auto-populates in booking form
4. Complete the booking as usual

---

## Analytics & SEO Configuration

Configure tracking and search engine optimization settings.

### Setting Up Google Analytics

1. **Navigate to Settings**
   - Click **"System Settings"** → **"General & SEO"** tab
   
2. **Add Google Analytics ID**
   - Find **"Google Analytics Measurement ID"** field
   - Enter your GA4 ID (format: `G-XXXXXXXXXX`)
   - Get this from your Google Analytics dashboard
   
3. **Save Changes**
   - Click **"Save All Settings"**
   - Tracking starts immediately on all pages

### Setting Up Meta Pixel

1. **Navigate to Settings**
   - Click **"System Settings"** → **"General & SEO"** tab
   
2. **Add Meta Pixel ID**
   - Find **"Meta Pixel ID"** field  
   - Enter your Pixel ID (numeric format)
   - Get this from Meta Business Manager
   
3. **Save Changes**
   - Click **"Save All Settings"**
   - Conversion tracking starts immediately

### SEO Best Practices

- **Meta Title**: Keep under 60 characters
- **Meta Description**: Keep between 120-160 characters
- **Hero Title**: Use action-oriented language
- Update these settings when running promotions or campaigns

---

## Invoice Management

Generate and preview professional invoices.

### Viewing Invoices

1. **Navigate to Bookings**
   - Click **"Bookings"** in sidebar
   - Find the booking you need

2. **Open Invoice**
   - Click the booking row
   - Click **"View Invoice"** button

### Invoice Preview

1. **Preview Before Generating**
   - Click **"Preview Invoice"** button
   - Review all details (customer info, services, prices)
   - Close preview or proceed to print/download

### Invoice Settings

1. **Customize Invoice Details**
   - Go to **"System Settings"** → **"Finance"** tab
   - Update: Company name, address, bank details
   - Set tax rate and invoice notes
   
2. **Save Changes**
   - All future invoices use updated settings
   - Existing invoices are not affected