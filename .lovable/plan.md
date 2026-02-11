

## Phase 2: Salary, Deadline, Auto-Fetch, Undo Auto-Fill

Adds salary tracking, application deadlines, auto-fetch on paste, undo auto-fill, external link shortcuts, and source-specific hints.

---

### Step 1: Database Migration

Add two nullable columns:

```sql
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS salary text,
  ADD COLUMN IF NOT EXISTS close_date date;
```

---

### Step 2: Update Types -- `src/types/job.ts`

Add to `JobApplication` interface (after `description?: string`):

```typescript
salary?: string;
closeDate?: string;
```

---

### Step 3: Update Hook -- `src/hooks/useJobs.tsx`

- `rowToJob` (line 33-34 area): add `salary: (row as any).salary ?? undefined` and `closeDate: (row as any).close_date ?? undefined`
- `addJob` extras type (line 65): expand to `{ location?, description?, links?, salary?, closeDate? }`
- `addJob` insert payload (lines 76-78): add `salary` and `close_date` fields
- `updateJob` payload (lines 104-106): add `salary: job.salary ?? null` and `close_date: job.closeDate ?? null`

---

### Step 4: Edge Function -- `supabase/functions/scrape-job-url/index.ts`

Add close date extraction functions after the existing `getLocation` function (after line 81):

```typescript
const getCloseDate = (ld: any): string | null => {
  const raw = ld.validThrough || ld.applicationDeadline;
  if (!raw) return null;
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  } catch { return null; }
};

const getCloseDateFromHtml = (html: string): string | null => {
  const patterns = [
    /(?:apply\s+by|closes?\s+on|deadline[:\s]+)[\s]*([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /(?:apply\s+by|closes?\s+on|deadline[:\s]+)[\s]*(\d{4}-\d{2}-\d{2})/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) {
      try {
        const d = new Date(m[1]);
        if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
      } catch {}
    }
  }
  return null;
};
```

In the main handler, after extracting salary from JSON-LD (around line 164):
- Add `let closeDate: string | null = null;`
- If JSON-LD found: `closeDate = getCloseDate(ld);`
- After all extraction: `if (!closeDate) closeDate = getCloseDateFromHtml(html);`
- Add `close_date` to the response data object
- Expand hint logic for indeed.com and generic partial

---

### Step 5: Update AddJobDialog -- `src/components/AddJobDialog.tsx`

This is the largest change. Key additions:

**New imports:** `DollarSign, CalendarDays, Undo2` from lucide-react; `useRef, useEffect` additions

**New state:**
- `fetchedSalary`, `fetchedCloseDate` (strings)
- `debounceRef` (useRef for timer)

**Auto-fetch on paste/blur (debounced 600ms):**
- URL input gets `onPaste` handler that triggers fetch after 600ms
- URL input gets `onBlur` handler that also triggers fetch (if URL changed and not already fetching)
- Uses `debounceRef` to clear/set timeouts

**New form fields (after Application Type, before buttons):**
- "Salary / Range" input with DollarSign icon + auto-filled badge
- "Application Deadline" input type="date" with CalendarDays icon + auto-filled badge

**Undo Auto-Fill button:**
- Shown below URL field when `autoFilled.size > 0`
- On click: clears company, role, fetchedLocation, fetchedDescription, fetchedSalary, fetchedCloseDate; resets autoFilled set

**handleFetch updates:**
- Extract `d.salary` and `d.close_date` from response
- Set `fetchedSalary` and `fetchedCloseDate`, add to `filled` set

**handleSubmit updates:**
- Pass `salary: fetchedSalary || undefined` and `closeDate: fetchedCloseDate || undefined` in extras
- Reset new fields on submit

**onAdd prop type update:**
```typescript
extras?: { location?: string; description?: string; links?: string[]; salary?: string; closeDate?: string }
```

---

### Step 6: Update JobDetailPanel -- `src/components/JobDetailPanel.tsx`

**New imports:** `DollarSign` from lucide-react

**After Description field (after line 187), add:**

- Salary input:
```tsx
<div className="space-y-2">
  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
    <DollarSign className="h-3.5 w-3.5" /> Salary / Range
  </Label>
  <Input
    placeholder="e.g. $120k-$150k"
    value={editedJob.salary ?? ""}
    onChange={(e) => update("salary", e.target.value || undefined)}
  />
</div>
```

- Application Deadline input:
```tsx
<div className="space-y-2">
  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
    <CalendarDays className="h-3.5 w-3.5" /> Application Deadline
  </Label>
  <Input
    type="date"
    value={editedJob.closeDate ?? ""}
    onChange={(e) => update("closeDate", e.target.value || undefined)}
  />
</div>
```

**After the header (after line 115), add "View Original Posting" link:**
```tsx
{editedJob.links?.[0] && (
  <a href={editedJob.links[0]} target="_blank" rel="noopener noreferrer"
     className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline px-6 pt-2">
    <ExternalLink className="h-3 w-3" /> View Original Posting
  </a>
)}
```

---

### Step 7: Update JobCard -- `src/components/JobCard.tsx`

**New imports:** `DollarSign, CalendarDays, ExternalLink` from lucide-react; `differenceInDays, parseISO` from date-fns; `format` from date-fns

**Add helper functions before the component:**
```typescript
const isClosingSoon = (dateStr: string) => {
  try {
    return differenceInDays(parseISO(dateStr), new Date()) < 7;
  } catch { return false; }
};

const formatDeadline = (dateStr: string) => {
  try { return format(parseISO(dateStr), "MMM d"); }
  catch { return dateStr; }
};
```

**After location pill (line 58), add salary and deadline pills:**
```tsx
{job.salary && (
  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
    <DollarSign className="h-2.5 w-2.5" />
    <span className="truncate">{job.salary}</span>
  </div>
)}
{job.closeDate && (
  <div className={`mt-1 flex items-center gap-1 text-[10px] ${
    isClosingSoon(job.closeDate) ? "text-destructive font-medium" : "text-muted-foreground"
  }`}>
    <CalendarDays className="h-2.5 w-2.5" />
    <span>{formatDeadline(job.closeDate)}</span>
  </div>
)}
```

**Add external link icon next to the delete button (after line 71):**
```tsx
{job.links?.[0] && (
  <a href={job.links[0]} target="_blank" rel="noopener noreferrer"
     onClick={(e) => e.stopPropagation()}
     className="mt-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
    <ExternalLink className="h-3.5 w-3.5" />
  </a>
)}
```

---

### Step 8: Update CSV Export -- `src/pages/AppPage.tsx`

Update headers (line 23) and row mapping (lines 24-34):

```typescript
const headers = ["Company", "Role", "Stage", "Type", "Created", "Location", "Salary", "Deadline", "Notes", "Description", "Links"];
// Add to each row:
j.salary ?? "",
j.closeDate ?? "",
```

---

### Files Changed Summary

| File | Change |
|------|--------|
| DB migration | Add `salary` text, `close_date` date columns |
| `src/types/job.ts` | Add `salary?`, `closeDate?` |
| `src/hooks/useJobs.tsx` | Map new fields, expand addJob/updateJob |
| `supabase/functions/scrape-job-url/index.ts` | Add close_date extraction, source hints |
| `src/components/AddJobDialog.tsx` | Salary + deadline fields, auto-fetch on paste/blur, undo button |
| `src/components/JobDetailPanel.tsx` | Salary + deadline fields, "View Original Posting" link |
| `src/components/JobCard.tsx` | Salary pill, deadline with urgency, external link icon |
| `src/pages/AppPage.tsx` | CSV columns for salary + deadline |

### Testing Plan

After implementation:
1. Test the edge function with a LinkedIn URL to verify partial extraction and hints
2. Test with a job board that has JSON-LD (e.g., reed.co.uk) to verify salary and close_date extraction
3. Verify auto-fetch triggers on paste and blur with 600ms debounce
4. Verify the "Undo Auto-Fill" button clears all fetched fields
5. Verify deadline urgency color (red when < 7 days away) on JobCard
6. Verify CSV export includes new columns
7. Verify dark mode rendering on all new fields

