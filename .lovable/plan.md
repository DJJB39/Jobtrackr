

## Path to 9/10: Five High-Impact Improvements

### 1. AI Cover Letter & Interview Prep (5 credits)

**What:** Add an "AI Assistant" button in the JobDetailPanel that generates:
- A tailored cover letter based on job description + user notes
- Interview prep questions based on the role and company
- A "quick summary" of the job posting

**Why:** This is the #1 differentiator for Huntr/Teal in 2026. Without AI features, JobTrackr is a spreadsheet with drag-and-drop.

**Implementation:**

- Create edge function `supabase/functions/ai-assist/index.ts` using Lovable AI gateway (`google/gemini-3-flash-preview`)
- Three modes: `cover_letter`, `interview_prep`, `summarize`
- System prompt includes job description, company, role, notes, salary from the application
- Streaming response via SSE for real-time text generation
- New component `src/components/AIAssistPanel.tsx`:
  - Slide-out Sheet from the right (separate from JobDetailPanel)
  - Mode selector tabs (Cover Letter / Interview Prep / Summary)
  - Streaming markdown output with copy-to-clipboard button
  - "Regenerate" button
- Trigger: Add an AI sparkle button in the `JobDetailPanel` hero header, next to Edit button
- Update `supabase/config.toml` to register the new function with `verify_jwt = true`

**Gotchas:**
- Must handle 429/402 rate limit errors from Lovable AI and show user-friendly toasts
- Keep system prompt on backend, never expose to client
- Limit description input to 2000 chars to avoid token overflow
- Add loading skeleton while streaming

---

### 2. Command Palette with Global Search (3 credits)

**What:** `Cmd+K` opens a command palette (using existing `cmdk` dependency) that searches across ALL jobs, ALL views, and provides quick actions.

**Why:** Users with 50+ applications need instant access. This also replaces the Kanban-only search input and works from Dashboard/Calendar views.

**Implementation:**

- New component `src/components/CommandPalette.tsx`:
  - Uses `cmdk` (already installed) with `Command`, `CommandInput`, `CommandList`, `CommandItem`
  - Fuzzy search across `company`, `role`, `notes`, `description`, `location` fields
  - Results grouped by stage (Found, Applied, etc.)
  - Quick actions: "Add new application", "Switch to Board/Dashboard/Calendar", "Export CSV"
  - Clicking a result opens the JobDetailPanel for that job
- Register global `Cmd+K` / `Ctrl+K` keyboard shortcut in `AppPage.tsx` via `useEffect`
- Pass `jobs` array and `setSelectedJob`/`setPanelOpen` handlers as props
- Remove the search Input from `KanbanBoard.tsx` filter bar (replaced by global search)

**Files to change:**
- New: `src/components/CommandPalette.tsx`
- Edit: `src/pages/AppPage.tsx` (add keyboard listener + render CommandPalette)
- Edit: `src/components/KanbanBoard.tsx` (remove search input, keep filter dropdowns)

---

### 3. Fix Toast Spam + Data Loss Bug + Theme Toggle (3 credits)

**What:** Three quick-win quality fixes.

**A. Remove toast on every save:**
- In `src/hooks/useJobs.tsx`, remove the `toast({ title: "Application saved" })` call from `updateJob` (line 95-96). The detail panel's `saveStatus` indicator already shows save state. Only toast on errors.

**B. Fix debounce data loss:**
- In `src/components/JobDetailPanel.tsx`, instead of clearing the debounce timer on unmount, flush it:
```tsx
useEffect(() => {
  return () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      // Flush pending save
      if (editedJobRef.current && dirtyRef.current) {
        onSave(editedJobRef.current);
      }
    }
  };
}, [onSave]);
```
- Add a `dirtyRef` that tracks whether there are unsaved changes and an `editedJobRef` that always holds the latest state.

**C. Theme toggle:**
- Wrap the app in `ThemeProvider` from `next-themes` (already installed)
- Add a Sun/Moon toggle button in `UserMenu.tsx` dropdown
- `next-themes` handles the `.light` class application automatically, which already has full CSS variable definitions in `index.css`

**Files to change:**
- `src/hooks/useJobs.tsx` (remove success toast from updateJob)
- `src/components/JobDetailPanel.tsx` (flush debounce on unmount)
- `src/App.tsx` (wrap in ThemeProvider)
- `src/components/UserMenu.tsx` (add theme toggle menu item)

---

### 4. Onboarding with Demo Data + Duplicate Detection (4 credits)

**What:** First-login experience that pre-populates sample jobs, plus duplicate warnings on add.

**A. Demo data on first login:**
- New hook `src/hooks/useOnboarding.tsx`:
  - On first load, if `jobs.length === 0`, check `localStorage` for `jobtrackr-onboarded` flag
  - If not onboarded, insert 3 sample jobs via `addJob` (e.g., "Acme Corp - Frontend Engineer" in Found, "TechCo - Senior Dev" in Applied, "StartupXYZ - Full Stack" in Phone Screen)
  - Each sample has realistic data: description, salary, location, one event, one contact
  - Set `localStorage` flag after insertion
  - Show a dismissible banner: "We added some sample jobs to help you explore. Delete them anytime."
- Call this hook in `AppPage.tsx` after `useJobs`

**B. Duplicate detection:**
- In `AddJobDialog.tsx`, before calling `onAdd`, check if any existing job matches `company + role` (case-insensitive)
- If duplicate found, show an `AlertDialog`: "You already have an application for {company} - {role}. Add anyway?"
- Pass `jobs` array as a new prop to `AddJobDialog`

**Files to change:**
- New: `src/hooks/useOnboarding.tsx`
- Edit: `src/pages/AppPage.tsx` (call useOnboarding, show banner)
- Edit: `src/components/AddJobDialog.tsx` (add duplicate check, accept `jobs` prop)

---

### 5. Mobile-Responsive Kanban + Quick Stage Navigation (5 credits)

**What:** Make the Kanban board usable on mobile with a stage selector dropdown and condensed card layout.

**Implementation:**

- In `src/components/KanbanBoard.tsx`:
  - Detect mobile via `useIsMobile()` hook (already exists at `src/hooks/use-mobile.tsx`)
  - On mobile, replace the horizontal scrolling 8-column layout with:
    - A stage selector dropdown at the top showing current stage name + count
    - A single-column vertical list of cards for the selected stage
    - Swipe left/right to navigate between stages (or use the dropdown)
  - Keep existing desktop layout unchanged for `lg+` screens

- In `src/components/KanbanColumn.tsx`:
  - No changes needed (mobile view bypasses columns entirely)

- In `src/components/JobCard.tsx`:
  - On mobile, slightly adjust padding for touch targets (min 44px tap targets on action buttons)

- In `src/components/CalendarView.tsx`:
  - On mobile, hide the fixed `w-[340px]` left sidebar and show the calendar inline full-width
  - Move event list below the calendar instead of beside it
  - Add a floating "+" button to create events from the calendar view

**Files to change:**
- Edit: `src/components/KanbanBoard.tsx` (mobile layout branch)
- Edit: `src/components/CalendarView.tsx` (responsive layout)
- Edit: `src/components/JobCard.tsx` (touch target sizing)

---

### Summary Table

| Improvement | Impact | Credits | Key Files |
|---|---|---|---|
| AI Cover Letter & Interview Prep | Competitive parity with Huntr/Teal | 5 | New edge function + AIAssistPanel.tsx |
| Command Palette (Cmd+K) | Power user retention, replaces fragmented search | 3 | New CommandPalette.tsx, AppPage.tsx |
| Toast/Save/Theme fixes | Polish, data safety, accessibility | 3 | useJobs.tsx, JobDetailPanel.tsx, UserMenu.tsx, App.tsx |
| Onboarding + Duplicate Detection | Activation rate, data quality | 4 | New useOnboarding.tsx, AddJobDialog.tsx, AppPage.tsx |
| Mobile Kanban + Calendar | 40%+ of job seekers use mobile | 5 | KanbanBoard.tsx, CalendarView.tsx, JobCard.tsx |
| **Total** | | **20** | |

