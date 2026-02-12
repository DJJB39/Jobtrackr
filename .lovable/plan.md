

## Fix Critical UX Blockers

Four targeted changes across three files to address the most impactful UX issues.

---

### 1. Delete Confirmation Dialog (JobCard.tsx)

Wrap the trash button with a shadcn `AlertDialog` to prevent accidental deletions.

- Import `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogAction`, `AlertDialogCancel` from `@/components/ui/alert-dialog`
- Add local state `const [deleteOpen, setDeleteOpen] = useState(false)` to JobCard
- Replace the bare trash `<button>` (lines 165-174) with an `AlertDialog` wrapping the trigger button
- Dialog text: title "Delete application?", description "This will permanently delete {job.company} - {job.role} and all associated events."
- Destructive-styled confirm button calls `onDelete(job.id)`
- Both trigger and confirm buttons use `e.stopPropagation()` to avoid opening the detail panel

---

### 2. Debounce Detail Panel Saves (JobDetailPanel.tsx)

Currently `update()` (line 72-76) calls `onSave()` on every keystroke, triggering an API call and toast each time.

- Add a `useRef` for a debounce timer and a `savingState` indicator (`idle` | `saving` | `saved`)
- Split `update()` into two parts:
  - Immediate: `setEditedJob(updated)` for responsive UI
  - Debounced (500ms): call `onSave(updated)` after user stops typing
- Add a subtle saving indicator in the sheet header (e.g., small text "Saving..." / "Saved" that fades after 1.5s) instead of per-keystroke toasts
- The `onSave` callback in `KanbanBoard.tsx` already handles the API call -- no changes needed there
- Clean up the timer on unmount via `useEffect` cleanup

---

### 3. Remove Duplicate Next Event Pill (JobCard.tsx)

Lines 117-125 show the event title/count. Lines 127-135 duplicate with date/time. Merge into one pill.

- Delete the second `{nextEvent && (...)}` block (lines 127-135)
- Modify the first block (lines 117-125) to append the date and optional time after the title/count text
- Result format: `"Interview at Google -- MMM d 2:00 PM"` or `"3 events -- MMM d"` (showing the nearest date)

---

### 4. Global Search Input (KanbanBoard.tsx)

Add a text input to the existing filter bar that filters jobs client-side by company, role, or notes.

- Add `searchQuery` state (default `""`)
- Import `Search` icon from lucide-react and `Input` from `@/components/ui/input`
- Insert an `Input` at the start of the filter bar (before the Filter icon) with placeholder "Search company, role..."
- Extend the `filteredJobs` memo to also filter by `searchQuery` matching against `job.company`, `job.role`, and `job.notes` (case-insensitive substring)
- Include `searchQuery` in the "Clear Filters" reset logic

---

### Technical Details

**Files modified:**
- `src/components/JobCard.tsx` -- AlertDialog for delete, merge event pills
- `src/components/JobDetailPanel.tsx` -- debounced save with indicator
- `src/components/KanbanBoard.tsx` -- search input and filter logic

**No new dependencies.** All components (AlertDialog, Input, icons) already exist in the project.

