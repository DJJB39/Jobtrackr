

# JobCard Premium Redesign -- Refined Plan

Complete visual overhaul of `JobCard.tsx` to match the reference screenshot, with all requested additions.

---

## New Card Layout (top to bottom)

```text
+---------------------------------------------------+
| COMPANY NAME (bold, text-base)   [hover: actions]  |
| Role Title (text-sm muted)           SALARY  CV%   |
| Applied Jan 15, 2026                               |
|                                                     |
| [MapPin] London  [tag] Frontend                     |
|                                                     |
| Notes preview truncated to 2 lines...               |
|                                                     |
| [Clock] Phone screen  Feb 20                        |
| [Clock] Final interview  Mar 1                      |
|                                                     |
| [Users] 2 contacts                                  |
| ================================================== |  <-- progress bar
+---------------------------------------------------+
```

---

## Changes to `src/components/JobCard.tsx`

### Removals
- `getCompanyLogoUrl` helper, `INITIAL_COLORS`, `getInitialColor` -- no more logo fetching
- `logoError` state, logo `<img>` element
- Tiny metadata dots (green/amber/sky circles)
- Pixel-based `pl-[42px]` / `pl-[34px]` indentation

### New Imports
- `MapPin`, `Clock`, `Users` from lucide-react
- `format` from date-fns (in addition to existing imports)

### New Computed Values

**`upcomingEvents`** (useMemo): Filter `job.events` to future dates, sort ascending, take first 2.

**`upcomingEventCount`**: Total count of future events (for compact mode badge).

**`contactCount`**: `job.contacts?.length ?? 0`

**`stageProgress`**: Map `columnId` to a percentage:
- found: 10, applied: 25, phone: 45, interview2: 60, final: 75, offer: 90, accepted: 100, rejected: 0

### Layout Rows

**Row 1 -- Company name**: `font-bold text-base text-card-foreground truncate flex-1`. No logo prefix.

**Row 2 -- Role + badges**: Role as `text-sm text-muted-foreground truncate` on left. On far right: salary pill (`rounded-md px-2.5 py-0.5 text-xs font-semibold` using `getSalaryColorFromParsed`), then CV score badge if present (same colored badge style as current but slightly larger `text-[11px]`).

**Row 3 -- Date applied**: `text-[11px] text-muted-foreground/60` showing `Applied {format(parseISO(job.createdAt), "MMM d, yyyy")}`.

**Row 4 -- Location + Type** (non-compact): Location pill with `MapPin` icon (`rounded-md px-2 py-0.5 text-[11px] bg-muted/60 text-muted-foreground`). Application type as plain muted text beside it.

**Row 5 -- Notes preview** (non-compact, if notes exist): `text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed`.

**Row 6 -- Upcoming events** (non-compact, if any): Up to 2 events listed. Each: `Clock` icon (h-3 w-3) + truncated title + `format(parseISO(e.date), "MMM d")`. Styled `text-[11px] text-muted-foreground`.

**Row 7 -- Contacts** (non-compact, if any): `Users` icon (h-3 w-3) + first contact name or "X contacts" text. `text-[11px] text-muted-foreground`.

**Row 8 -- Progress bar**: Full-width thin bar (`h-1 rounded-full bg-primary/10 overflow-hidden mt-2`). Inner fill div with `bg-primary/40` at width based on `stageProgress`. Only shown if `columnId` is provided and not "rejected".

### Compact Mode

Shows: company name, role + salary/CV badges, date applied, and a bottom row with compact badges:
- `"{N} upcoming"` if events exist (with Clock icon)
- `"{N} contacts"` if contacts exist (with Users icon)
- Progress bar still shown

Hides: location, notes preview, individual event list, individual contact names.

### Hover Actions (preserved)

Top-right overlay (`opacity-0 group-hover:opacity-100`):
- Schedule button (CalendarPlus)
- Up to 3 external link buttons (ExternalLink), with `...` text if more than 3
- Delete button with AlertDialog confirmation

### Selection Checkbox (preserved)

Same absolute-positioned checkbox in top-left when `selectMode` is active.

---

## Changes to `src/components/KanbanColumn.tsx`

- Widen column from `w-72` to `w-80`
- Increase card gap: compact `gap-1.5`, comfortable `gap-2.5`

---

## No Changes Needed

- `src/types/job.ts` -- all fields already exist on `JobApplication`
- No new dependencies

