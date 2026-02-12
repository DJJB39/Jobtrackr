

## Polish JobCard and Make Calendar Interactive

Three changes across three files.

---

### 1. "Fetched" Badge on JobCard (JobCard.tsx)

Add a small muted badge next to the company name when `job.links?.[0]` exists, indicating the job was fetched from a URL.

- On line 98-101 (the company name row), after the `<span className="truncate">{job.company}</span>`, insert a conditional:
  ```tsx
  {job.links?.[0] && (
    <span className="text-[9px] text-muted-foreground/70 font-normal bg-muted rounded px-1 py-0.5 shrink-0">
      Fetched
    </span>
  )}
  ```
- This sits inline with the company name, won't overflow thanks to `shrink-0`, and is subtle enough not to compete with the company text.

### 2. Consistent Pill Truncation (JobCard.tsx)

Standardize all metadata pills to use the same max-width and structure:

- Change `max-w-[120px]` on location (line 109), salary (line 115), and deadline (line 125) pills to `max-w-[140px]` for consistency.
- The event pill (line 131) already uses `max-w-[160px]` which is appropriate since it contains more text (title + date).
- No structural changes needed -- the pills are already consistent in icon size (h-2.5 w-2.5), text size (text-[10px]), and gap (gap-1). Just unify the max-width.

### 3. Interactive Calendar Events (CalendarView.tsx + AppPage.tsx)

**CalendarView.tsx:**

- Update `CalendarViewProps` interface to add `onSelectJob?: (job: JobApplication) => void`
- Store a `jobMap` (Map of jobId to JobApplication) in a useMemo derived from `jobs`
- Make each event/deadline card clickable:
  - Add `onClick` handler that looks up the full job from `jobMap` using `item.data.jobId` and calls `onSelectJob`
  - Add `cursor-pointer hover:bg-muted/50 transition-colors` classes to event cards
- Both event items (line 203) and deadline items (line 260) get click handlers

**AppPage.tsx:**

- Import `JobDetailPanel` and `JobApplication` type
- Add `selectedJob` and `panelOpen` state (same pattern used in Dashboard)
- Create a `handleSelectJob` callback that sets both states
- Pass `onSelectJob={handleSelectJob}` to `<CalendarView>`
- Render `<JobDetailPanel>` after the CalendarView, passing `selectedJob`, `panelOpen`, `onSave={updateJob}`, and `onOpenChange`

---

### Files Modified

| File | Change |
|------|--------|
| `src/components/JobCard.tsx` | Add "Fetched" badge, unify pill max-widths |
| `src/components/CalendarView.tsx` | Add `onSelectJob` prop, make event cards clickable |
| `src/pages/AppPage.tsx` | Wire up JobDetailPanel for calendar view |

