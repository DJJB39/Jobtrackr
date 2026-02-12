

## Smart Event Hub -- Lean Implementation Plan

Tracks interviews, follow-ups, deadlines, and outcomes as a JSONB array on the existing `job_applications` table. No new tables. Manual trigger only.

---

### Step 1: Database Migration

Add a single JSONB column:

```sql
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS events jsonb NOT NULL DEFAULT '[]'::jsonb;
```

No new table, no new RLS -- existing policies cover the column automatically.

---

### Step 2: Types -- `src/types/job.ts`

```typescript
export type EventType = "interview" | "follow_up" | "deadline";
export type EventOutcome = "passed" | "rejected" | "pending" | "rescheduled" | null;

export interface JobEvent {
  id: string;          // crypto.randomUUID()
  title: string;
  date: string;        // YYYY-MM-DD
  time: string | null;  // HH:mm or null
  type: EventType;
  location: string | null;
  prepNotes: string | null;
  outcome: EventOutcome;
  createdAt: string;    // ISO string
}
```

Add to `JobApplication`:
```typescript
events: JobEvent[];
```

---

### Step 3: Hook -- `src/hooks/useJobs.tsx`

- `rowToJob`: add `events: (row as any).events ?? []`
- `updateJob` payload: add `events: job.events as any`
- No change to `addJob` (new jobs start with `events: []` from the DB default)

---

### Step 4: .ics Utility -- `src/lib/ics.ts` (new file)

Two exports, no external library:

```typescript
export const generateICS = (event: {
  title: string; date: string; time?: string;
  location?: string; notes?: string; durationMinutes?: number;
}): string => {
  // Build VCALENDAR text with VEVENT
  // DTSTART as local time (YYYYMMDDTHHMMSS), default 1h duration
};

export const downloadICS = (content: string, filename: string) => {
  // Blob + anchor click
};

export const googleCalendarUrl = (event: {
  title: string; date: string; time?: string;
  location?: string; durationMinutes?: number;
}): string => {
  // Returns https://calendar.google.com/calendar/render?action=TEMPLATE&...
};
```

---

### Step 5: Schedule Event Dialog -- `src/components/ScheduleEventDialog.tsx` (new file)

Reusable modal for create and edit.

**Props:**
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobApplication;
  event?: JobEvent;              // if editing
  onSave: (updatedJob: JobApplication) => void;
}
```

**Form fields:**
- Title -- Input, auto-suggested as `"{Column title} - {Company}"` for new events
- Date -- shadcn Popover + Calendar (with `pointer-events-auto` on Calendar)
- Time -- `<Input type="time" />`
- Type -- Select: Interview, Follow-up, Deadline (badge-styled items)
- Location -- Input (optional)
- Prep Notes -- Textarea
- Outcome -- Select dropdown, only visible when editing a past event (Passed, Rejected, Pending, Rescheduled)

**Action buttons:**
- "Save" -- adds/updates event in `job.events`, calls `onSave`
- "Add to Google Calendar" icon -- opens `googleCalendarUrl()` in new tab
- "Download .ics" icon -- calls `downloadICS(generateICS(...))`
- "Delete" -- only in edit mode, removes event from array, calls `onSave`

Events in the array are sorted by date+time on save (soonest first).

---

### Step 6: Wire into JobDetailPanel -- `src/components/JobDetailPanel.tsx`

Add an "Events" section after Next Steps (before Links):

```text
[CalendarDays icon] Events
                                    [+ Schedule Event] button

  Existing events as compact cards:
  +------------------------------------------+
  | Interview  Phone Screen - Google         |
  | Feb 18, 2:00 PM  |  Virtual              |
  | [.ics] [Google Cal] [Edit] [Delete]      |
  +------------------------------------------+

  Past events without outcome show:
  "How did it go?" banner -> click opens edit dialog with outcome dropdown
```

- "Schedule Event" button opens `ScheduleEventDialog` with current job
- Edit button opens `ScheduleEventDialog` with the event pre-filled
- All mutations go through the existing `onSave` prop (updates `job.events` array)

---

### Step 7: Wire into JobCard -- `src/components/JobCard.tsx`

**Event indicator pill** (after close date pill):
```tsx
{nextEvent && (
  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
    <Clock className="h-2.5 w-2.5" />
    <span>{formatDeadline(nextEvent.date)}{nextEvent.time ? ` ${nextEvent.time}` : ""}</span>
  </div>
)}
```

`nextEvent` = first event with `date >= today`, sorted by date.

**Schedule button on hover** (alongside ExternalLink and Trash2):
```tsx
<button
  onClick={(e) => { e.stopPropagation(); onSchedule?.(job); }}
  className="mt-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
>
  <CalendarPlus className="h-3.5 w-3.5" />
</button>
```

New props on JobCard:
```typescript
onSchedule?: (job: JobApplication) => void;
```

KanbanBoard manages the schedule dialog state:
- `scheduleTarget: JobApplication | null`
- `scheduleDialogOpen: boolean`
- Passes `onSchedule` to JobCard, renders `ScheduleEventDialog`

---

### Step 8: Dashboard "Upcoming This Week" Widget -- `src/components/Dashboard.tsx`

New card inserted above the existing stat cards:

```text
+----------------------------------------------+
| [CalendarDays] Upcoming This Week             |
|                                               |
|  Feb 18  Interview  Phone Screen - Google     |
|  Feb 20  Follow-up  Acme Corp                 |
|  Feb 21  Deadline   Apply - Stripe            |
|                                               |
|  "Nothing this week" if empty                 |
+----------------------------------------------+
```

Data sources:
- Events from `job.events` where date is within next 7 days
- Deadlines from `job.closeDate` where date is within next 7 days (synthesized as type "deadline")

Both sorted by date. Each row shows date, type badge, title, and company. Clickable (future: could scroll to card).

Dashboard props updated:
```typescript
interface DashboardProps {
  jobs: JobApplication[];
}
```
No new props needed -- events live on the jobs themselves.

---

### Step 9: Login Reminders -- `src/hooks/useLoginReminders.tsx` (new file)

```typescript
export const useLoginReminders = (jobs: JobApplication[]) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!jobs.length) return;
    const now = new Date();
    const upcoming: Array<{ title: string; date: string; company: string }> = [];

    for (const job of jobs) {
      // Check events within 24h
      for (const evt of job.events) {
        if (isWithin24h(evt.date, evt.time, now)) {
          upcoming.push({ title: evt.title, date: evt.date, company: job.company });
        }
      }
      // Check close_date within 24h
      if (job.closeDate && isWithin24h(job.closeDate, null, now)) {
        upcoming.push({ title: "Deadline", date: job.closeDate, company: job.company });
      }
    }

    // Cap at 2 toasts
    upcoming.slice(0, 2).forEach((item) => {
      toast({ title: `Coming up: ${item.title}`, description: `${item.company} -- ${item.date}` });
    });
  }, [jobs.length]); // only on initial load
};
```

Called from `AppPage` after jobs load.

---

### Step 10: AppPage Wiring -- `src/pages/AppPage.tsx`

- Import and call `useLoginReminders(jobs)` after loading completes
- Pass jobs (with events) to Dashboard (already done, events live on jobs)
- No new view tab in this lean version (calendar view deferred)

---

### Files Summary

| File | Status | Purpose |
|------|--------|---------|
| DB migration | New | Add `events jsonb DEFAULT '[]'` |
| `src/types/job.ts` | Modified | `JobEvent`, `EventType`, `EventOutcome` types |
| `src/hooks/useJobs.tsx` | Modified | Map events in rowToJob + updateJob |
| `src/lib/ics.ts` | New | .ics generation, download, Google Calendar URL |
| `src/components/ScheduleEventDialog.tsx` | New | Create/edit event modal |
| `src/components/JobDetailPanel.tsx` | Modified | Events section with list + outcome banner |
| `src/components/JobCard.tsx` | Modified | Next event pill + schedule hover button |
| `src/components/KanbanBoard.tsx` | Modified | Schedule dialog state, pass onSchedule to cards |
| `src/components/Dashboard.tsx` | Modified | "Upcoming This Week" widget |
| `src/hooks/useLoginReminders.tsx` | New | Toast for events within 24h (max 2) |
| `src/pages/AppPage.tsx` | Modified | Wire useLoginReminders |

### Implementation Sequence

1. DB migration (events column)
2. Types (JobEvent, EventType, EventOutcome)
3. useJobs hook (map events)
4. `src/lib/ics.ts` (standalone utility)
5. `ScheduleEventDialog` component
6. Wire into `JobDetailPanel` (events section)
7. Wire into `JobCard` + `KanbanBoard` (pill + hover button + dialog state)
8. Dashboard "Upcoming This Week" widget
9. `useLoginReminders` hook + wire into AppPage

### Gotchas

- **`pointer-events-auto`**: Calendar inside dialog must have this class or date picking fails
- **JSONB sort on save**: Always sort `job.events` by `date + time` before persisting to keep display consistent
- **Timezone**: Dates stored as YYYY-MM-DD, times as HH:mm, no timezone offset. .ics uses local time format. Calendar apps interpret as device timezone. Correct for single-user scheduling
- **No duplicate toasts**: `useLoginReminders` uses `jobs.length` as dependency, fires once on load only
- **Outcome prompt**: Check `event.date < today && !event.outcome` when rendering event cards in the detail panel
- **Backward compat**: Existing jobs have no `events` key in DB; the `DEFAULT '[]'` and `?? []` in rowToJob handle this cleanly

