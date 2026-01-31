# Brainstorming: Manual Journal Entry (Jurnal Umum)

**Goal**: Allows accounting user to manually input journal entries (debit/credit pairs) for transactions not covered by auto-triggers (e.g., Depreciation, Salaries, Corrections).

## Current State
- `AccountingService` exists and can `createJournalEntry`.
- UI for *viewing* reports exists.
- No UI for *creating* manual journals.

## Proposed Approaches

### Option 1: Basic Manual Form (Recommended for MVP)
- **Concept**: A simple form with Header (Date, Description, Reference) and dynamic Lines (Account, Debit, Credit, Description).
- **Pros**: Quick to build, covers 100% of standard use cases.
- **Cons**: Manual data entry can be slow for large journals.
- **Tech**: React Hook Form useFieldArray, Shadcn Combobox for Accounts.

### Option 2: Excel-like Grid / Bulk Import
- **Concept**: A spreadsheet-like interface or CSV upload.
- **Pros**: Fast for massive data entry (e.g., importing payroll from HR).
- **Cons**: High complexity to implement spreadsheet UI correctly.

### Option 3: Recurring/Template Journals
- **Concept**: Pre-defined templates (e.g., "Monthly Rent") where user just fills amount.
- **Pros**: Reduces errors for repetitive tasks.
- **Cons**: Additional database schema for templates needed first.

## Recommendation
**Option 1** is the logical next step. It provides the essential capability to modify the Ledger manually. We can add Templates (Option 3) later.

## Implementation Plan (Option 1)
1.  **Route**: `/dashboard/accounting/journals/create`
2.  **UI Components**:
    -   `DatePicker` for Transaction Date.
    -   `Input` for Reference/Description.
    -   `AccountComboBox` (Searchable Generic Select).
    -   `DynamicTable` for Journal Lines (Add/Remove Row).
    -   `SummaryFooter` showing Total Debit vs Credit (must balance).
3.  **Server Action**: `createManualJournal` (reuses `AccountingService.createJournalEntry`).
