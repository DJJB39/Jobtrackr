

## Kanban Board Redesign -- Implementation

Two files to change: `JobCard.tsx` and `KanbanColumn.tsx`. No new dependencies.

---

### File 1: `src/components/JobCard.tsx` -- Full Rewrite

**Remove:**
- `STATUS_BORDER_COLORS` map and `borderLeftColor` style
- `border-l-[3px]` and `bg-gradient-to-r from-card to-card/80` classes
- `Building2`, `Briefcase`, `MapPin`, `DollarSign`, `CalendarDays`, `Clock` icon imports
- All stacked metadata rows (location, salary, deadline, events, type badge)
- Inline action buttons (grip, schedule, link, delete) from the card body flow

**Add:**
- `getCompanyLogoUrl(job)` helper: extracts domain from `job.links[0]` or guesses from company name, returns Clearbit logo URL
- `getSalaryColor(salary)` helper: returns colored pill classes based on parsed salary number (emerald >= 150k, blue >= 100k, amber >= 50k, primary fallback)
- `formatSalary(salary)` helper: truncates to 12 chars
- `getInitialColor(name)` helper: deterministic color from company name hash for fallback circle
- `logoError` state with `useState(false)` for graceful fallback
- `hasUpcomingEvents` and `deadlineSoon` memos replacing the old `nextEvent` memo

**New card structure (3 rows):**

```text
Row 1: [Logo 32x32] Company Name (bold)         [$120k pill]
Row 2:              Role Title (muted, truncated)
Row 3:              [type text] [green dot] [amber dot] [sky dot]
```

- Card classes: `rounded-xl border border-border/50 bg-card p-3 shadow-sm` (no gradient, no left border)
- Logo: 32x32 rounded-lg with `<img>` + `onError` fallback to colored initial circle
- Salary: right-aligned colored pill `rounded-full px-2.5 py-0.5 text-[11px] font-semibold`
- Metadata dots: green (events), amber (deadline soon), sky (has link) -- each `h-2 w-2 rounded-full`
- Hover actions: `absolute top-2 right-2` overlay with `bg-card/90 backdrop-blur-sm` containing grip, schedule, link, delete
- AlertDialog for delete confirmation preserved exactly as-is

### File 2: `src/components/KanbanColumn.tsx` -- Simplified

**Remove:**
- `STATUS_COLORS_HEX` map
- `tintColor` variable and all references
- Tinted header background (`style={{ backgroundColor: tintColor + "15" }}`)
- Status dot (`h-3 w-3 rounded-full`)
- Count badge pill with tinted background
- Uppercase tracking on title

**Change:**
- Column width: `w-64` to `w-72`
- Column background: remove `bg-gradient-to-b from-column to-transparent`

**New header:**
```tsx
<div className="px-3 py-3 text-center">
  <h3 className="text-sm font-semibold text-foreground">
    {column.title} <span className="text-muted-foreground font-normal">({jobs.length})</span>
  </h3>
</div>
```

---

### What This Achieves

- Cards shrink from 6-8 lines to 3 lines with logo-centric layout
- Company logos provide instant visual recognition
- Salary becomes a prominent colored badge, instantly scannable
- Column headers are clean and minimal
- Hover actions keep the card surface uncluttered
- Overall board matches the polished screenshot aesthetic

