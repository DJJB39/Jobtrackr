

# Complete UX Overhaul: All Critique Recommendations

This plan addresses every recommendation from the product critique. Given the scope, this is a significant effort.

## Estimated Credit Cost: 12-18 credits
Each recommendation maps to roughly 2-3 messages depending on complexity. The total depends on iteration cycles.

---

## Recommendation 1: Interactive Demo on Landing Page (2-3 credits)

**Problem**: Landing page has no product demo, fake-looking testimonials, and users bounce without seeing the product.

**Changes**:
- Add a "Try Demo" button in the hero that navigates to `/app` in a guest/demo mode (no signup required)
- Create a `useGuestMode` hook that loads hardcoded sample data into state (no database) so visitors can drag cards, open detail panels, and explore without creating an account
- Replace the 3 anonymous testimonials with a "How it works" 3-step section (Paste URL, Drag to track, Get reminders) -- more credible for a new product
- Add a hero animation: an auto-playing embedded screenshot carousel or a subtle CSS animation on the main screenshot

**Files**: `src/pages/Landing.tsx`, `src/pages/AppPage.tsx`, new `src/hooks/useGuestMode.tsx`

---

## Recommendation 2: Real Analytics Funnel in Dashboard (2-3 credits)

**Problem**: Dashboard shows vanity metrics (total count, "response rate"). No conversion funnel, no ghost detection, no actionable insights.

**Changes**:
- Replace the "Response Rate" stat card with a "Funnel Drop-off" metric (% that move past Applied)
- Add a **Conversion Funnel chart** (horizontal funnel: Found -> Applied -> Interview -> Offer -> Accepted) showing drop-off percentages at each stage
- Add a **"Stale Applications" alert section**: jobs that have been in the same stage for 14+ days with no activity, prompting the user to follow up or archive
- Add a **"Ghost Detection" indicator**: applications in Applied/Phone Screen with no events scheduled for 7+ days
- Make the bar chart interactive: clicking a bar filters the Kanban board to that stage

**Files**: `src/components/Dashboard.tsx`

---

## Recommendation 3: Persistent Search Bar + List View (2-3 credits)

**Problem**: Search is hidden behind Cmd+K (most users never discover it). No list/table view for high-density browsing.

**Changes**:
- Add a visible search input in the AppPage header (between the view switcher and export button) that filters jobs in real-time across company, role, notes, and description
- Add a 4th view: **"List"** -- a compact table view with sortable columns (Company, Role, Stage, Type, Date, Salary) using the existing table component
- Clicking a row in list view opens the detail panel
- The list view supports the same filters as the Kanban board
- Add a `List` icon to the view switcher nav

**Files**: `src/pages/AppPage.tsx`, new `src/components/ListView.tsx`

---

## Recommendation 4: Refactor Detail Panel UX (2-3 credits)

**Problem**: 637-line monolith with an "Edit/Done" toggle that hides all editing behind a mode switch. Users can't quickly edit a single field.

**Changes**:
- Replace "Edit/Done" toggle with **inline click-to-edit** on all text fields (company, role, salary, location, description, notes). Clicking a text value turns it into an input; clicking away or pressing Enter saves.
- Organize the body into **tabs**: "Overview" (description, notes, next steps), "Events & Contacts", "Links & Resume"
- Extract tab content into smaller sub-components: `DetailOverviewTab.tsx`, `DetailEventsTab.tsx`, `DetailLinksTab.tsx`
- Keep the hero header compact with inline-editable fields

**Files**: `src/components/JobDetailPanel.tsx`, new `src/components/detail/DetailOverviewTab.tsx`, `src/components/detail/DetailEventsTab.tsx`, `src/components/detail/DetailLinksTab.tsx`, new `src/components/InlineEdit.tsx`

---

## Recommendation 5: Bulk Actions (1-2 credits)

**Problem**: No way to move, delete, or export multiple applications at once. Managing 50+ jobs one-by-one is painful.

**Changes**:
- Add multi-select mode to the Kanban board: a checkbox on each card that appears when Shift is held or when a "Select" toggle is active
- When cards are selected, show a floating action bar at the bottom with: "Move to [Stage]", "Delete Selected", "Export Selected"
- Support Shift+Click to select ranges within a column
- The bulk action bar shows the count of selected items

**Files**: `src/components/KanbanBoard.tsx`, `src/components/JobCard.tsx`, new `src/components/BulkActionBar.tsx`

---

## Recommendation 6: Email Reminders via Edge Function (2-3 credits)

**Problem**: "Reminders" are just in-app toasts on login. No push notifications, no email, no weekly digest. Users miss interviews.

**Changes**:
- Create a new edge function `send-reminders` that queries upcoming events (within 24h) and sends email reminders via the built-in auth email service or a simple SMTP integration
- Add a user preference toggle in the UserMenu: "Email reminders" on/off, stored in a new `user_preferences` table
- Create a `weekly-digest` edge function that summarizes the user's pipeline (new apps this week, upcoming events, stale applications) and sends it every Monday
- Both functions can be triggered via scheduled invocations or a cron-like approach

**Files**: new `supabase/functions/send-reminders/index.ts`, new `supabase/functions/weekly-digest/index.ts`, `src/components/UserMenu.tsx`, new database migration for `user_preferences` table

---

## Implementation Order

1. **Recommendation 3** (Search + List View) -- highest daily-use impact, self-contained
2. **Recommendation 4** (Detail Panel refactor) -- improves core interaction loop
3. **Recommendation 2** (Dashboard funnel) -- adds real analytical value
4. **Recommendation 1** (Landing page demo) -- improves conversion
5. **Recommendation 5** (Bulk actions) -- power-user feature
6. **Recommendation 6** (Email reminders) -- requires backend work, best saved for last

Each recommendation will be implemented in 1-2 messages, tested, then moved to the next. Total estimated credits: **12-18** depending on iteration.

