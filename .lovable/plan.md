

# Remove "All" Filter Option + Custom Pipeline Stages

## Overview

Two changes: (1) quick removal of "All" from `APPLICATION_TYPES`, and (2) user-customizable pipeline stages (columns) stored in the database.

---

## Part 1: Remove "All" from APPLICATION_TYPES (Quick Fix)

**File:** `src/types/job.ts`

Remove `"All"` from the `APPLICATION_TYPES` array. Then update the two places that rely on it:

**File:** `src/components/KanbanBoard.tsx`
- Change the type filter `Select` to show a manual "All Types" option with value `"all_types"`, followed by `APPLICATION_TYPES.map(...)` (no more filtering needed since "All" is gone)
- Update `filterType` default state from `"All"` to `"all_types"`
- Update `hasActiveFilters` check accordingly

**File:** `src/components/AddJobDialog.tsx`
- Remove the `.filter((t) => t !== "All")` since "All" no longer exists in the array

---

## Part 2: Custom Pipeline Stages (User Preference)

This is a larger feature. It requires a new database table and changes across many components.

### Database Migration

Create a `user_stages` table:

```text
user_stages
  id          uuid PK default gen_random_uuid()
  user_id     uuid NOT NULL (references auth.uid())
  stage_id    text NOT NULL (e.g. "found", "applied", custom slugs)
  title       text NOT NULL
  color_class text NOT NULL
  position    int  NOT NULL (for ordering)
  created_at  timestamptz default now()

  UNIQUE(user_id, stage_id)
  RLS: user_id = auth.uid()
```

Seed with default stages matching the current `COLUMNS` array on first login (or via a database function triggered on user creation).

### New Hook: `src/hooks/useStages.tsx`

- Fetches user's stages from `user_stages` ordered by `position`
- Provides `addStage`, `deleteStage`, `reorderStages` mutations
- Falls back to default `COLUMNS` if no custom stages exist
- Exposes a `stages` array that replaces the static `COLUMNS` import everywhere

### New Component: `src/components/StageManager.tsx`

A dialog/sheet accessible from the UserMenu ("Manage Stages"):
- Lists current stages with drag-to-reorder
- Delete button per stage (with confirmation if jobs exist in that stage -- offers to move them first)
- "Add Stage" form at the bottom (title + color picker from preset colors)
- Cannot delete below 2 stages

### Component Updates

Every file that imports `COLUMNS` from `src/types/job.ts` would need to switch to using the `useStages` hook instead. Affected files:

- `KanbanBoard.tsx` -- render dynamic columns
- `KanbanColumn.tsx` -- receive column data as prop (likely already does)
- `JobDetailPanel.tsx` -- stage selector dropdown
- `AddJobDialog.tsx` -- stage selector
- `BulkActionBar.tsx` -- bulk move dropdown
- `ListView.tsx` -- stage display and sorting
- `Dashboard.tsx` -- charts and stats
- `ShareStats.tsx` -- stage breakdown
- `CommandPalette.tsx` -- stage labels
- `CVView.tsx` -- stage display
- `AppPage.tsx` -- CSV export stage mapping

The static `COLUMNS` array in `types/job.ts` would remain as the default fallback but would no longer be the source of truth for logged-in users.

### UserMenu Addition

**File:** `src/components/UserMenu.tsx`

Add a "Manage Stages" menu item (with a `Columns3` icon) that opens the StageManager dialog.

---

## Recommendation

Part 1 (removing "All") is a quick 3-file change. Part 2 (custom stages) is a significant feature touching 12+ files and requiring a database migration. I recommend implementing them separately -- Part 1 now, Part 2 as a follow-up.

