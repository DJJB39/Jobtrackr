# Phase 1 — Today screen (the coach)

Make Cornerman default to a coach view that issues one clear order, instead of dropping users on the Kanban tracker.

## 1. Extract shared signal logic — `src/lib/cornerLogic.ts`

New module, pure functions, no React. Move/duplicate-free extraction from `Dashboard.tsx`:

- `getStaleJobs(jobs, today)` — same-stage 14+ days, excludes accepted/rejected (existing `STALE_THRESHOLD_DAYS`).
- `getGhostJobs(jobs, today)` — applied/phone with no upcoming events, 7+ days since created (existing `GHOST_THRESHOLD_DAYS`).
- `getUpcomingEvents(jobs, days)` — 14-day window across events + closeDate.
- `getPastUnloggedEvents(jobs, today)` — event date in past with `outcome == null`.

Refactor `Dashboard.tsx` to import these (no behaviour change there).

Then export the core API:

```ts
type CornerAction = { label: string; view?: View; jobId?: string; eventId?: string; tool?: "coach"|"bootcamp"|"tailor"|"cover_letter"|"roast"|"add_job"|"log_outcome"|"move_rejected" };
type CornerOrder = { id: string; priority: number; headline: string; detail: string; primary: CornerAction; secondary?: CornerAction };
function getCornerOrders(jobs, cv, roastHistory): CornerOrder[];
```

Rules evaluated in strict priority order (1 = highest). Each matched rule emits one order per matching job (top one promoted as #1, rest stacked):

1. Interview within 48h → bootcamp.
2. Interview within 7d → interview coach.
3. Past event with no outcome → outcome prompt.
4. Quiet application (applied 7+d ago, no events, columnId in applied/phone) → cover-letter follow-up OR move-to-rejected.
5. Stale (14+ d untouched, pre-applied stages: found) → open job / drop.
6. Roast stale (no roast 30+d, or `cv.updated_at > lastRoast.createdAt`) → ruthless review.
7. < 3 active applications (not rejected/accepted) → AddJobDialog.
8. Fallback "Corner's quiet" order.

Roast history input: derive from existing `useRuthlessReview` storage / `user_cvs.last_roast_at` (read whatever is already persisted; if nothing exists, treat as "no roast" — no new tables).

## 2. New component — `src/components/TodayView.tsx`

Props: `{ jobs, cv, onAction(action: CornerAction) }`.

Layout (uses existing `cm-*` classes, Fraunces/IBM Plex/JetBrains tokens):

```text
TODAY'S ORDERS              (mono, uppercase, tracked)
Tuesday, June 9             (Fraunces)

+--------------------------- cm-roast-card -----------------+
| Fight night is close.                  (Fraunces, large) |
| Acme — Senior Engineer · interview in 36h                |
| [ Open Bootcamp ]                       (amber primary)  |
+-----------------------------------------------------------+

Orders 2-4 (stacked compact rows, ghost CTA each)         | FIGHT RECORD (mono)
- Time to spar — Globex · in 5d            [Open Coach]   | ROAST       72  +4
- How did it go? — Initech phone screen    [Log outcome]  | INTERVIEWS  3
- They've gone quiet — Soylent             [Draft chase]  | RESPONSE    28%

Upcoming (next 14 days)  ← reuse existing upcoming-events strip from Dashboard, extracted into a small subcomponent
```

Mobile: right rail collapses below; FIGHT RECORD becomes a 3-cell mono row; respect stripped header + bottom toast offset; use native `overflow-y-auto` wrapper (per project rule).

Fight Record stats (all derived client-side, no new fetches):
- Roast score + delta: latest vs prior from existing roast records.
- Interviews booked this month: count of events with `type==='interview'` and date in current month.
- Response rate: jobs reaching phone+ / jobs in applied+ (rounded %).

Action handler maps `CornerAction` to existing `AppPage`/`DemoPage` handlers (open AddJobDialog, set selectedJob + open Coach/Bootcamp/Tailor, open AI panel in cover_letter follow-up mode, log-outcome dialog already used by CalendarView).

## 3. Wire as default — `src/pages/AppPage.tsx` and `src/pages/DemoPage.tsx`

- Add `"today"` to the `View` union in `src/components/layout/AppHeader.tsx` (first chip, icon `Flame` or `Target`).
- `AppPage`: change `useState<View>("board")` → `useState<View>("today")`. Render `<TodayView ... />` branch first. Keep Kanban available via the switcher (unchanged).
- `DemoPage`: change default from `"ai"` → `"today"`; pass the existing canned demo jobs/cv straight to TodayView.
- Empty-state branch (jobs.length === 0) stays as-is — only triggered if no jobs.

## 4. Optional flourish — Corner Talk (built last)

- New ai-assist mode `corner_talk` in `supabase/functions/ai-assist/index.ts`: system prompt = terse dry corner-coach, `max_tokens ~ 40`, returns one sentence. Skip the per-user free-tier counter for this mode (small, daily-capped server side via cache check).
- Client cache: store `{ date: 'YYYY-MM-DD', line: string }` in existing `user_preferences` JSON column under key `corner_talk`. Fetch once per UTC day; if cached for today, use it; else call edge function, on success persist, on failure pick from a 10-line hardcoded fallback array in `cornerLogic.ts`.
- Render as a single italicised mono line under the date header.

## Files

- New: `src/lib/cornerLogic.ts`, `src/components/TodayView.tsx`.
- Edit: `src/components/Dashboard.tsx` (import from cornerLogic), `src/components/layout/AppHeader.tsx` (add Today chip), `src/pages/AppPage.tsx`, `src/pages/DemoPage.tsx`, `supabase/functions/ai-assist/index.ts` (corner_talk mode, last).

## Out of scope

No new tables. No edge-function changes except `corner_talk`. No changes to Kanban, AI Studio, or any existing tool internals.
