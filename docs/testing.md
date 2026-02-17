# JobTrackr End-to-End Testing Suite

This file tracks manual end-to-end test cases for JobTrackr.  
Run these before major networking pushes or releases.

Status legend:  
- [ ] Not tested  
- [x] Passed  
- [ ] Failed (see comment)  
- [~] Partial / needs retest

Last full run: [DATE - e.g. 2026-02-17]

---

## Automated Tests

Automated component tests live in `src/test/` and cover the high-value, high-visibility components below.

Run with: `npx vitest` or `npx vitest run`

| File | Coverage |
|------|----------|
| `Landing.test.tsx` | LP-01, LP-02, LP-04, Loom embed |
| `Auth.test.tsx` | AF-01, AF-03, AF-04, AF-05, AF-07 |
| `JobCard.test.tsx` | KB core rendering, salary/location pills, contacts, progress bar, compact mode |
| `KanbanColumn.test.tsx` | Column header, empty state, job count |
| `ResetPassword.test.tsx` | AF-07 reset flow |
| `constants.test.ts` | Exported URL constants |

---

## 1. Landing Page (Public, No Auth)

- [x] LP-01 Positive: Hero loads correctly (headline, subtext, CTAs, trust strip visible, no errors) — *automated*
- [x] LP-02 Positive: Features grid displays (6 cards, icons/text) — *automated*
- [ ] LP-03 Positive: Comparison table shows (grid, checks/Xs, responsive scroll on mobile)
- [x] LP-04 Positive: Pricing section ("Free Forever" card, feature list) — *automated*
- [ ] LP-05 Positive: FAQ accordion (5 items expand/collapse smoothly)
- [ ] LP-06 Positive: Feedback link in footer (opens form in new tab)
- [ ] LP-07 Negative: Slow connection (throttle Slow 3G — progressive load, no infinite spinners)
- [ ] LP-08 Edge: Dark/light mode (respects OS preference, no contrast issues)
- [ ] LP-09 Edge: Mobile view (CTAs stack, screenshots full-width, no clipping)

## 2. Auth Flow (/auth, Signup, Login)

- [ ] AF-01 Positive: Email signup (confirmation email, verify link → /app)
- [ ] AF-02 Positive: Magic link login (email arrives, link logs in)
- [x] AF-03 Positive: Google OAuth button renders — *automated*
- [x] AF-04 Positive: Apple OAuth button renders — *automated*
- [x] AF-05 Negative: Login form renders with email/password fields — *automated*
- [ ] AF-06 Negative: Unverified email login (error "Verify email first")
- [x] AF-07 Negative: Password reset UI renders correctly — *automated*
- [ ] AF-08 Edge: Social login cancel (consent denied → error toast, no loop)

## 3. Onboarding (First Login)

- [ ] OB-01 Positive: Sample data seed (banner, 3 jobs seeded)
- [ ] OB-02 Positive: Guided tour (5-step spotlight, skippable, "Never show again")
- [ ] OB-03 Negative: Skip tour (ends, doesn't reappear)
- [ ] OB-04 Edge: Delete samples ("Delete All Samples" button removes them)

## 4. Kanban Board

- [x] KB-01 Positive: Columns render with titles and job counts — *automated*
- [x] KB-02 Positive: JobCard renders company, role, salary, location — *automated*
- [x] KB-03 Positive: Empty column shows "Drop here" state — *automated*
- [ ] KB-04 Positive: Drag and drop moves card between columns
- [ ] KB-05 Positive: Filter by application type works
- [x] KB-06 Edge: Compact mode hides notes, shows badge counts — *automated*

## 5. Job Detail Panel

- [ ] JD-01 Positive: Click card opens detail panel with all tabs
- [ ] JD-02 Positive: Inline edit saves changes (company, role, notes)
- [ ] JD-03 Positive: Add/remove contacts, links, next steps
- [ ] JD-04 Positive: Schedule event from detail panel
- [ ] JD-05 Negative: Empty fields show placeholder state

## 6. Dashboard / Calendar / List / CV View

- [ ] DV-01 Positive: Dashboard charts render with correct data
- [ ] DV-02 Positive: Calendar view shows events on correct dates
- [ ] DV-03 Positive: List view renders all jobs in table format
- [ ] DV-04 Positive: CV upload and analysis flow works

## 7. Reminders & Notifications

- [ ] RN-01 Positive: Email reminder preferences save correctly
- [ ] RN-02 Positive: Push notification subscription works
- [ ] RN-03 Negative: Unsubscribe link disables reminders

## 8. Chrome Extension

- [ ] CE-01 Positive: Extension popup loads with auth state
- [ ] CE-02 Positive: Save job from job posting page

## 9. Edge Cases & Performance

- [ ] EC-01 Edge: 50+ jobs on board (no lag, scroll works)
- [ ] EC-02 Edge: Offline/reconnect (toast, data syncs)
- [ ] EC-03 Edge: Concurrent tabs (no data conflicts)
- [ ] EC-04 Performance: Initial load < 3s on fast connection

## Summary of Failures & Known Issues

(Add notes here as you test)

## Next Full Run Target

[DATE - e.g. After next Lovable push]
