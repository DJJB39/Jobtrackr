

# Phase 1: Purge Crap and Stabilize -- Concrete Implementation Plan

Six changes, each with exact file targets and line-level specifics. No new dependencies.

---

## 1. Purge Fake Stats from Landing Page

**File**: `src/pages/Landing.tsx`

Replace lines 57-61 (the `stats` array) with honest trust indicators:

```ts
const stats = [
  { value: "Unlimited", label: "Applications" },
  { value: "100%", label: "Free Forever" },
  { value: "Zero", label: "Ads, Ever" },
  { value: "Private", label: "By Default" },
];
```

Update the grid at lines 157-166: change `grid-cols-3` to `grid-cols-2 sm:grid-cols-4`. No fake numbers, no asterisks.

---

## 2. Guided Onboarding Tour (Skippable from Step 1, "Never Show Again")

### New file: `src/hooks/useOnboardingTour.tsx`

State machine hook managing:
- `step` (0-4), `active` boolean
- `advance()`, `skip()`, `neverShowAgain()`
- Reads localStorage keys: `jobtrackr-tour-complete`, `jobtrackr-tour-never`
- Tour activates when `tourReady` is true (after seed completes) and neither localStorage flag is set
- "Skip tour" button visible from step 1 (not hidden until later steps)
- "Never show again" checkbox on the skip action -- when checked and skip clicked, sets `jobtrackr-tour-never` flag

### New file: `src/components/OnboardingTour.tsx`

Renders for each step:
- Dark semi-transparent backdrop overlay
- Spotlight cutout around target element (found via `document.querySelector('[data-tour="..."]')`)
- Positioned tooltip bubble with: step text, step counter ("2 of 5"), "Next" button, "Skip tour" link
- On final step: "Got it!" replaces "Next"
- "Don't show again" checkbox visible alongside "Skip tour" at every step
- Uses framer-motion AnimatePresence for transitions
- Repositions on window resize

**Tour steps**:
1. `data-tour="kanban-column"` -- "This is your pipeline. Drag jobs between stages as you progress."
2. `data-tour="add-button"` -- "Add a new application -- paste a job URL to auto-fill details."
3. `data-tour="job-card"` -- "Click any card for full details, notes, events, and AI tools."
4. `data-tour="view-switcher"` -- "Switch between Board, List, Insights, Calendar, and CV views."
5. `data-tour="search-input"` -- "Search all your applications instantly. Try Cmd+K too."

### Modified: `src/hooks/useOnboarding.tsx`

- Export `tourReady` boolean (set to true after seed completes, alongside `showBanner`)
- Return shape becomes `{ showBanner, dismissBanner, tourReady }`

### Modified: `src/pages/AppPage.tsx`

- Import and render `<OnboardingTour />`, passing `active` from `useOnboardingTour({ tourReady })`
- Add `data-tour` attributes to these elements:
  - First KanbanColumn container in the board render
  - AddJobDialog trigger button
  - First visible JobCard (or the column area)
  - View switcher `<nav>` element (line 158)
  - Desktop search input container (line 139)

---

## 3. Auto-Collapse Empty Columns + Compact Mode Toggle

### Modified: `src/components/KanbanColumn.tsx`

Add two new props: `collapsed: boolean`, `compact: boolean`

When `collapsed` is true and `jobs.length === 0`:
- Render a narrow vertical strip (`w-10 h-full`) instead of the full `w-72` column
- Strip contains: the colored status dot, column title rotated 90deg (`writing-mode: vertical-rl`), "0" badge
- `useDroppable` ref stays attached to the strip (still a valid drop target)
- Click on strip sets local `forceExpanded` state to temporarily expand
- When a card is dropped in (jobs.length goes from 0 to 1), auto-expands

When `compact` is true:
- Reduce card gap from `gap-2` to `gap-1`

### Modified: `src/components/KanbanBoard.tsx`

- Add `compact` boolean state, persisted to `localStorage("jobtrackr-compact")`
- Render a Switch toggle in the filter bar (right side, before the Select button) labeled "Compact"
- Pass `compact` prop to all KanbanColumn components
- Pass `collapsed={true}` to columns where `getColumnJobs(column.id).length === 0`

### Modified: `src/components/JobCard.tsx`

Add `compact?: boolean` prop:
- When true: padding `p-2` (from `p-3`), hide metadata dots row entirely, hide application type text, shrink logo to `h-6 w-6`, truncate role to single line with `max-w-[120px]`
- Result: roughly 40% shorter cards

---

## 4. Structured Salary Parsing

### New file: `src/lib/salary.ts`

```ts
export function parseSalary(raw: string | null | undefined): { min: number; max: number } | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[,\s]/g, "");
  // Match patterns: $130k-$160k, $130000-$160000, $130k, EUR 80k, 80000
  const rangeMatch = cleaned.match(/(\d+\.?\d*)\s*k?\s*[-–to]+\s*\$?(\d+\.?\d*)\s*k?/i);
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1]);
    let max = parseFloat(rangeMatch[2]);
    if (raw.toLowerCase().includes("k") || min < 1000) { min *= (min < 1000 ? 1 : 1); max *= (max < 1000 ? 1 : 1); }
    // Normalize to thousands
    if (min > 1000) min = min / 1000;
    if (max > 1000) max = max / 1000;
    return { min, max };
  }
  const singleMatch = cleaned.match(/(\d+\.?\d*)\s*k?/i);
  if (singleMatch) {
    let val = parseFloat(singleMatch[1]);
    if (val > 1000) val = val / 1000;
    return { min: val, max: val };
  }
  return null;
}
// TODO Phase 2: range slider filter component
```

### Modified: `src/components/JobCard.tsx`

- Import `parseSalary` from `@/lib/salary`
- Replace `getSalaryColor` function: use `parseSalary(salary)?.max` instead of naive regex

### Modified: `src/components/KanbanBoard.tsx`

- Import `parseSalary`
- Add salary bracket filter Select after the role filter: "All Salaries", "$0-50k", "$50-100k", "$100-150k", "$150k+"
- Filter jobs using `parseSalary` in the `filteredJobs` memo

### Modified: `src/components/ListView.tsx`

- Import `parseSalary` from `@/lib/salary`
- Replace inline `parseSalary` function (lines 71-77) with the shared import

---

## 5. Search Kbd Badge + First-Visit Pulse

### Modified: `src/pages/AppPage.tsx`

Desktop search input (line 141-145):
- Remove `(Cmd+K)` from placeholder text (just "Search...")
- Add a `<kbd>` element positioned absolutely inside the input (right side): `text-[10px] font-mono bg-muted/60 px-1.5 py-0.5 rounded border border-border/50` showing the platform-appropriate shortcut
- When no `localStorage("jobtrackr-search-seen")` flag exists, add `animate-pulse` class to the search container div that runs 3 times. Set the flag after mount.

Mobile search input (line 210-225): same `<kbd>` badge treatment.

---

## 6. Light Mode / System Theme Support

### Modified: `src/App.tsx`

Line 19: Change `enableSystem={false}` to `enableSystem={true}`.

One-line change. The CSS variables for `.light` already exist in `index.css`. Dark remains default for users without a system preference (`defaultTheme="dark"` stays). Users who have their OS set to light mode will now see the landing page in light mode automatically.

---

## File Change Summary

| File | Action |
|---|---|
| `src/pages/Landing.tsx` | Replace fake stats array + grid layout |
| `src/hooks/useOnboardingTour.tsx` | **New** -- Tour state machine with skip + never-show-again |
| `src/components/OnboardingTour.tsx` | **New** -- Spotlight overlay + tooltip UI |
| `src/hooks/useOnboarding.tsx` | Export `tourReady` boolean |
| `src/pages/AppPage.tsx` | data-tour attrs, tour render, search kbd badge + pulse |
| `src/components/KanbanColumn.tsx` | Auto-collapse empty columns, compact gap |
| `src/components/KanbanBoard.tsx` | Compact toggle, salary filter, pass collapsed/compact props |
| `src/components/JobCard.tsx` | Compact mode, use parseSalary |
| `src/lib/salary.ts` | **New** -- Salary parser utility |
| `src/components/ListView.tsx` | Import shared parseSalary |
| `src/App.tsx` | enableSystem={true} |

No database changes. No new dependencies. All preferences localStorage-persisted.

