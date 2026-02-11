

## Polish /app Experience -- Refined Implementation

Four changes across four files, all respecting dark mode (using Tailwind semantic colors like `text-foreground`, `bg-background`, `text-muted-foreground`) and responsive layout.

---

### 1. Empty State in AppPage.tsx

When `jobs.length === 0` and not loading, render a centered empty state instead of the board/dashboard toggle content:
- Large muted `Briefcase` icon (h-16 w-16, `text-muted-foreground/50`)
- "No applications yet" heading + "Add your first job to get started" subtext
- Button that opens the AddJobDialog

To support this, `AddJobDialog` will accept optional `open`/`onOpenChange` props so the empty-state button can control it externally. When not provided, it uses its own internal state (backward compatible).

### 2. "Clear Filters" Button in KanbanBoard.tsx

Add a ghost `Button` with an `X` icon labeled "Clear Filters" after the three filter dropdowns. It only renders when any filter is non-default (`filterType !== "All" || filterStage !== "all_stages" || filterRole !== "all_roles"`). On click, resets all three filters to defaults.

### 3. Export to CSV in AppPage.tsx

Add a "Export CSV" button (with `Download` icon) in the header next to "Add Application". The handler:
- Builds CSV with columns: Company, Role, Stage, Type, Created, Notes (first 100 chars), Links
- Maps `columnId` to readable stage name via `COLUMNS`
- Uses `format(new Date(), "yyyy-MM-dd")` from `date-fns` for filename: `jobtrackr-export-2026-02-11.csv`
- Triggers download via `Blob` + `URL.createObjectURL`
- Shows success toast

### 4. Success + Error Toasts in useJobs.tsx

Add success toasts after each successful CRUD operation:
- `addJob` success: "Application added" / "{company} - {role} has been added"
- `updateJob` success: "Application saved" / "Changes saved successfully"  
- `deleteJob` success: "Application deleted" / "The application has been removed"

Error toasts already exist with `variant: "destructive"` -- no changes needed there.

---

### Technical Details

**Files to modify:**

1. **`src/components/AddJobDialog.tsx`**
   - Add optional `open?: boolean` and `onOpenChange?: (open: boolean) => void` to props
   - Use external props when provided, internal state otherwise
   - Remove `DialogTrigger` when externally controlled (no trigger needed)

2. **`src/pages/AppPage.tsx`**
   - Add `dialogOpen` state for controlling AddJobDialog from empty state
   - Add empty state block when `jobs.length === 0`: Briefcase icon, text, button
   - Add CSV export button in header with `Download` icon
   - Add `exportToCSV` function using `COLUMNS` for stage mapping and `date-fns` `format` for filename
   - Import `Button` from shadcn, `Download` from lucide, `format` from date-fns, `COLUMNS` from types, `toast` from hooks

3. **`src/components/KanbanBoard.tsx`**
   - Import `Button` from shadcn and `X` from lucide
   - Add `hasActiveFilters` computed boolean
   - Render "Clear Filters" ghost button conditionally after the filter selects

4. **`src/hooks/useJobs.tsx`**
   - Add success toasts in `addJob`, `updateJob`, and `deleteJob` after successful operations

