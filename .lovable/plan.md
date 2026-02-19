

# Remove Type Filter + Make Stage Management Discoverable

## What's changing

1. **Remove the "Application Type" filter dropdown** from the Kanban board filter bar entirely -- it adds no value.
2. **Add a "+" column** at the end of the Kanban board so users can add/manage stages directly from the board without hunting through the user menu.

---

## Technical Details

### 1. Remove Application Type Filter (KanbanBoard.tsx)

- Delete the `filterType` state variable and its `Select` dropdown (lines 213-223)
- Remove the `APPLICATION_TYPES` import
- Remove the `filterType` filtering logic from the `filteredJobs` memo
- Remove `filterType` from the `hasActiveFilters` check and the "Clear" button reset

Also remove the `APPLICATION_TYPES` import from `KanbanBoard.tsx` (it's still used in `AddJobDialog` and `JobDetailPanel` for the job type selector when adding/editing jobs, so the constant itself stays).

### 2. Add "+" Column to Kanban Board (KanbanBoard.tsx)

After the last `KanbanColumn` in the desktop `flex gap-4` container, add a clickable "+" strip that opens the `StageManager` dialog directly:

- A thin column (matching collapsed column styling) with a "+" icon and "Add Stage" label
- Clicking it opens the existing `StageManager` component
- Add `StageManager` state (`stageManagerOpen`) and render it in `KanbanBoard.tsx`

This gives users an obvious, always-visible entry point to add or manage their pipeline stages right from the board itself.

### Files Modified

- `src/components/KanbanBoard.tsx` -- remove type filter, add "+" column with StageManager trigger

