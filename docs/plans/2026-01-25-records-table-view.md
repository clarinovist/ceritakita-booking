# Records Table View Implementation Plan

**Goal:** Implement a premium SaaS-style "Records" table view for the CRM Workspace, matching the reference design with Lead Score, Agents, and high-end UI elements.

**Architecture:**
- Create a new `LeadsRecordsTable` component as a dedicated table view.
- Add a third view mode (`table`) to `CRMWorkspace.tsx`.
- Implement a refined header with breadcrumbs, "Ask AI" button, and search/filter bar.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide Icons.

**Reference:**
![Records UI Reference](file:///Users/nugroho/.gemini/antigravity/brain/1420b228-34d2-42fd-84d5-284212361106/uploaded_media_1769348961658.png)

---

## Task 1: Create `LeadsRecordsTable` Component
**Goal**: Build the core table component matching the reference design.

**Files:**
- Create: `components/admin/crm/LeadsRecordsTable.tsx`

### Step 1: Create component file with interface
```typescript
interface LeadsRecordsTableProps {
    leads: Lead[];
    onSelectLead: (lead: Lead) => void;
    isLoading: boolean;
}
```

### Step 2: Implement table structure
- Table Header: Checkbox, Contact Information, Contacts, Lead Stage, Lead Score, Agents, Actions.
- Table Row: Avatar initial, name with creation date, email/phone, status badge, score progress bar, agent avatars, action icons.

### Step 3: Add Lead Score column
- Implement pseudo-random score calculation based on lead status.
- Visualize with a progress bar (blue for high, indigo for mid, gray for low).

### Step 4: Add Agents column
- Display a stack of avatar circles.
- Include "+" button for adding agents.

### Step 5: Add Actions column
- Chat icon to open WhatsApp.
- More options icon (placeholder).

### Step 6: Add Pagination footer
- Show "Showing X to Y of Z Records".
- Include Previous/Next page buttons and page number indicator.

---

## Task 2: Update `CRMWorkspace.tsx` with Table View Mode
**Goal**: Integrate the new Records table as the third view option.

**Files:**
- Modify: `components/admin/crm/CRMWorkspace.tsx`

### Step 1: Import new component and icons
```typescript
import { LeadsRecordsTable } from './LeadsRecordsTable';
import { Table, Search, SlidersHorizontal, Sparkles, Plus } from 'lucide-react';
```

### Step 2: Update `viewMode` state type
```typescript
const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'table'>('table');
```

### Step 3: Add `searchQuery` state
```typescript
const [searchQuery, setSearchQuery] = useState('');
```

### Step 4: Add Table button to view mode switcher
- Add a third icon button (`<Table />`) in the view mode toggle group.
- Style identically to the List and Kanban buttons.

### Step 5: Conditionally hide Stats Strip in table mode
- Wrap the Stats Strip in `{viewMode !== 'table' && (...)}`.

### Step 6: Implement Table View content area
- Add `{viewMode === 'table' && (...)}` block.
- Include SaaS Header (breadcrumbs, "Ask AI" button, "Add Records" button).
- Include Search & Filter Row (search input, Filters button, Sort button).
- Render `<LeadsRecordsTable />` with filtered leads.

---

## Task 3: Implement SaaS Header Design
**Goal**: Match the header area to the reference image.

### Step 1: Breadcrumbs
- Text: "Contacts / Records" with subtle uppercase styling.

### Step 2: Page Title
- Large h1: "Records" with a settings cog icon.

### Step 3: Action Buttons
- **Ask AI**: Gradient button (indigo -> purple -> rose) with `<Sparkles />` icon.
- **Add Records**: Dark (slate-900) button with `<Plus />` icon.

---

## Task 4: Implement Search & Filter Row
**Goal**: Add the refined search and filter controls.

### Step 1: Search Input
- Left icon: `<Search />`.
- Placeholder: "Search name, email, phone, or address".
- Full-width with max-w-md, rounded-xl, shadow-sm.

### Step 2: Filters Button
- Icon: `<SlidersHorizontal />`.
- Text: "Filters".
- Styled as a bordered, rounded-xl button.

### Step 3: Sort Button
- Icon: `<Sparkles />` (in blue).
- Text: "Sort".
- Styled identically to Filters button.

---

## Verification Plan

### Manual Verification
1. Open `/admin/crm` route.
2. Verify the default view is the new "Records" table.
3. Click on different view mode buttons (List, Table, Kanban) and confirm each renders correctly.
4. Type in the search box and verify leads are filtered by name, email, or phone.
5. Click on a row to open the Lead Detail Panel and verify it slides in correctly.
6. Verify the Lead Score column displays a progress bar with percentage.
7. Verify the Agents column displays avatar circles with a "+" button.

### Lint Check
```bash
npm run lint
```
Expected: No errors.
