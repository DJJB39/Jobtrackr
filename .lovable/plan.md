

# JobTrackr — Complete Feature Inventory and README/Changelog Draft

## Feature Inventory by Category

### A. Landing Page and Marketing (Feb 7-10)

| Feature | Files | Est. Date | Status |
|---|---|---|---|
| Hero section with animated CTA, stats bar, "How It Works" 3-step | `Landing.tsx` | Feb 7 | Shipped (stats are placeholder) |
| Product screenshots (Kanban, Detail, Dashboard) | `src/assets/screenshot-*.png`, `Landing.tsx` | Feb 8 | Shipped |
| Feature grid (6 cards: Kanban, URL Auto-Fill, Events, CV, AI, Security) | `Landing.tsx` | Feb 8 | Shipped |
| Competitor comparison table | `ComparisonTable.tsx` | Feb 9 | Shipped |
| "Free Forever" pricing section | `PricingSection.tsx` | Feb 9 | Shipped |
| FAQ accordion | `FAQSection.tsx` | Feb 9 | Shipped |
| Chrome extension teaser CTA | `ChromeExtensionCTA.tsx` | Feb 9 | Shipped (no actual extension) |
| Interactive demo mode ("Try Demo") | `DemoPage.tsx`, `useGuestMode.tsx` | Feb 8 | Shipped |
| Glassmorphism/grid background + scroll animations | `Landing.tsx`, `index.css` | Feb 13 | Shipped |
| SEO meta tags and JSON-LD | `index.html` | Feb 9 | Shipped |

### B. Authentication (Feb 7-13)

| Feature | Files | Est. Date | Status |
|---|---|---|---|
| Email/password signup and login | `Auth.tsx`, `useAuth.tsx` | Feb 7 | Shipped |
| Magic link login | `Auth.tsx` | Feb 7 | Shipped |
| Password reset flow | `ResetPassword.tsx` | Feb 8 | Shipped |
| Google OAuth | `Auth.tsx` | Feb 8 | Partial (redirect fix added Feb 13) |
| Apple OAuth | `Auth.tsx` | Feb 8 | Partial (redirect fix added Feb 13) |
| OAuth loading states and error handling | `Auth.tsx` | Feb 13 | Shipped |
| Post-OAuth redirect to /app | `Landing.tsx` | Feb 13 | Shipped |
| Protected routes | `ProtectedRoute.tsx` | Feb 7 | Shipped |

### C. Core Tracking — Kanban Board (Feb 7-13)

| Feature | Files | Est. Date | Status |
|---|---|---|---|
| 8-stage Kanban board (Found through Rejected) | `KanbanBoard.tsx`, `KanbanColumn.tsx`, `types/job.ts` | Feb 7 | Shipped |
| Drag-and-drop with @dnd-kit (closestCorners) | `KanbanBoard.tsx` | Feb 7 | Shipped |
| Job cards with company logo (Clearbit/Google favicon fallback) | `JobCard.tsx` | Feb 8 | Shipped |
| Card metadata dots (events, deadline, links) | `JobCard.tsx` | Feb 9 | Shipped |
| Salary badge on cards | `JobCard.tsx` | Feb 9 | Shipped |
| CV suitability score badge on cards | `JobCard.tsx` | Feb 13 | Shipped |
| Hover action overlay (schedule, link, delete) | `JobCard.tsx` | Feb 9 | Shipped |
| Mobile: single-column stage selector | `KanbanBoard.tsx` | Feb 10 | Shipped |
| Multi-select mode with bulk move/delete | `BulkActionBar.tsx`, `KanbanBoard.tsx` | Feb 11 | Shipped |
| Ctrl/Cmd+A select all visible | `KanbanBoard.tsx` | Feb 11 | Shipped |
| Glassmorphism column/card styling | `KanbanColumn.tsx`, `JobCard.tsx`, `index.css` | Feb 13 | Shipped |

### D. Add Job Dialog (Feb 7-10)

| Feature | Files | Est. Date | Status |
|---|---|---|---|
| Add application form (company, role, stage, type) | `AddJobDialog.tsx` | Feb 7 | Shipped |
| URL auto-fill via edge function scraper | `AddJobDialog.tsx`, `scrape-job-url/index.ts` | Feb 8 | Shipped |
| 600ms debounced fetch on paste/blur | `AddJobDialog.tsx` | Feb 8 | Shipped |
| Undo auto-fill button | `AddJobDialog.tsx` | Feb 9 | Shipped |
| Salary and deadline fields (manual + auto-filled) | `AddJobDialog.tsx` | Feb 9 | Shipped |
| Duplicate detection (case-insensitive company+role) | `AddJobDialog.tsx` | Feb 10 | Shipped |
| Partial data hints (LinkedIn etc.) | `AddJobDialog.tsx` | Feb 9 | Shipped |

### E. Job Detail Panel (Feb 7-13)

| Feature | Files | Est. Date | Status |
|---|---|---|---|
| Slide-out sheet with 4 tabs | `JobDetailPanel.tsx` | Feb 7 | Shipped |
| Overview tab: description, notes, next steps checklist | `DetailOverviewTab.tsx` | Feb 7 | Shipped |
| Activity timeline (stage changes, note edits, events) | `ActivityTimeline.tsx` | Feb 10 | Shipped |
| Events and Contacts tab | `DetailEventsTab.tsx` | Feb 8 | Shipped |
| Links tab | `DetailLinksTab.tsx` | Feb 8 | Shipped |
| CV tab (suitability review using master CV) | `DetailCVTab.tsx` | Feb 12-13 | Shipped |
| Inline click-to-edit for all fields | `InlineEdit.tsx` | Feb 8 | Shipped |
| Stage selector dropdown in header | `JobDetailPanel.tsx` | Feb 9 | Shipped |
| 500ms debounced auto-save with status indicator | `JobDetailPanel.tsx` | Feb 9 | Shipped |

### F. Events and Scheduling (Feb 8-10)

| Feature | Files | Est. Date | Status |
|---|---|---|---|
| Schedule interviews, follow-ups, deadlines | `ScheduleEventDialog.tsx` | Feb 8 | Shipped |
| Event outcome tracking (passed/rejected/pending/rescheduled) | `DetailEventsTab.tsx` | Feb 9 | Shipped |
| Past-event outcome prompt (date < today and no outcome) | `DetailEventsTab.tsx` | Feb 9 | Shipped |
| .ics calendar export | `lib/ics.ts` | Feb 9 | Shipped |
| Google Calendar export link | `DetailEventsTab.tsx` | Feb 9 | Shipped |

### G. Dashboard and Analytics (Feb 9-13)

| Feature | Files | Est. Date | Status |
|---|---|---|---|
| Stats cards (total, active, interviews, offers) | `Dashboard.tsx` | Feb 9 | Shipped |
| By-stage bar chart (clickable — filters to List View) | `Dashboard.tsx` | Feb 9 | Shipped |
| Application type pie chart | `Dashboard.tsx` | Feb 9 | Shipped |
| Weekly activity area chart | `Dashboard.tsx` | Feb 10 | Shipped |
| Conversion funnel chart | `Dashboard.tsx` | Feb 10 | Shipped |
| Stale application alerts (14+ days inactive) | `Dashboard.tsx` | Feb 10 | Shipped |
| Ghost detection (Applied/Phone, 7+ days no events) | `Dashboard.tsx` | Feb 10 | Shipped |
| Upcoming events sidebar (sticky, grouped) | `Dashboard.tsx` | Feb 10 | Shipped |
| Achievements/badges grid (8 milestones) | `Achievements.tsx` | Feb 11 | Shipped |
| Glassmorphism card styling | `Dashboard.tsx` | Feb 13 | Shipped |

### H. Calendar View (Feb 10)

| Feature | Files | Est. Date | Status |
|---|---|---|---|
| Month grid with event dot indicators | `CalendarView.tsx` | Feb 10 | Shipped |
| Click event to open job detail panel | `CalendarView.tsx` | Feb 10 | Shipped |
| Responsive sidebar with event list | `CalendarView.tsx` | Feb 10 | Shipped |

### I. List View (Feb 10)

| Feature | Files | Est. Date | Status |
|---|---|---|---|
| Sortable table (company, role, stage, type, salary) | `ListView.tsx` | Feb 10 | Shipped |
| Search filtering via header search bar | `ListView.tsx`, `AppPage.tsx` | Feb 10 | Shipped |
| Click row to open detail panel | `ListView.tsx` | Feb 10 | Shipped |

### J. CV Management (Feb 12-13)

| Feature | Files | Est. Date | Status |
|---|---|---|---|
| Top-level CV view with upload section | `CVView.tsx`, `CVUploadSection.tsx` | Feb 12 | Shipped |
| PDF text extraction (pdfjs-dist, client-side) | `CVUploadSection.tsx` | Feb 12 | Shipped |
| "Review Against Jobs" grid | `CVView.tsx` | Feb 12 | Shipped |
| AI suitability scoring (0-100, strengths, gaps, suggestions) | `CVView.tsx`, `ai-assist/index.ts` | Feb 12 | Shipped |
| Score badge on Kanban cards (green/amber/rose) | `JobCard.tsx` | Feb 13 | Shipped |
| Private file storage (Supabase) | `CVUploadSection.tsx` | Feb 12 | Shipped |

### K. AI Features (Feb 9-12)

| Feature | Files | Est. Date | Status |
|---|---|---|---|
| AI assist panel (cover letter, interview prep, summary) | `AIAssistPanel.tsx`, `ai-assist/index.ts` | Feb 9 | Shipped |
| Streaming markdown responses | `AIAssistPanel.tsx` | Feb 9 | Shipped |
| CV-aware context injection | `AIAssistPanel.tsx` | Feb 12 | Shipped |
| Resume/CV suitability analysis mode | `ai-assist/index.ts` | Feb 12 | Shipped |

### L. Search and Navigation (Feb 9-11)

| Feature | Files | Est. Date | Status |
|---|---|---|---|
| Persistent header search bar (fuzzy across all fields) | `AppPage.tsx` | Feb 9 | Shipped |
| Command palette (Cmd+K) with job search and actions | `CommandPalette.tsx` | Feb 10 | Shipped |
| Multi-filter bar (type, stage, role) with clear button | `KanbanBoard.tsx` | Feb 10 | Shipped |

### M. Data Management (Feb 8-11)

| Feature | Files | Est. Date | Status |
|---|---|---|---|
| Supabase CRUD with RLS | `useJobs.tsx` | Feb 7 | Shipped |
| 5-second soft-delete with undo toast | `useJobs.tsx` | Feb 9 | Shipped |
| Activity audit log (job_activity_log table) | `useJobs.tsx` | Feb 10 | Shipped |
| CSV export (all fields, human-readable stages) | `AppPage.tsx` | Feb 10 | Shipped |
| Share stats (clipboard + Web Share API) | `ShareStats.tsx` | Feb 11 | Shipped |
| New user onboarding with sample data | `useOnboarding.tsx` | Feb 8 | Shipped |

### N. Notifications (Feb 11)

| Feature | Files | Est. Date | Status |
|---|---|---|---|
| Opt-in email reminders (events within 24h) | `send-reminders/index.ts`, `UserMenu.tsx` | Feb 11 | Shipped |
| Weekly pipeline digest email | `weekly-digest/index.ts` | Feb 11 | Shipped |
| User preferences table (email_reminders, weekly_digest) | DB migration | Feb 11 | Shipped |
| Login-time upcoming event reminders | `useLoginReminders.tsx` | Feb 11 | Shipped |

### O. UX Polish (Feb 8-13)

| Feature | Files | Est. Date | Status |
|---|---|---|---|
| Dark/light theme toggle | `UserMenu.tsx` | Feb 8 | Shipped |
| Framer Motion page transitions and layout animations | Throughout | Feb 8 | Shipped |
| Animated view switcher pill | `AppPage.tsx` | Feb 9 | Shipped |
| Glassmorphism design system (glass, mesh-gradient, glow) | `index.css` | Feb 13 | Shipped |
| Mobile-responsive layout | `KanbanBoard.tsx`, `AppPage.tsx` | Feb 10 | Shipped |

---

## GitHub README / Changelog Section (Draft)

This will be generated in agent mode as a clean markdown block suitable for copy-paste into a README.md or CHANGELOG.md. It will include:

- A concise "Features" section with grouped bullet lists
- A "Built With" tech stack section
- No fluff, marketing language kept minimal

### Planned output structure:

```
## Features

### Kanban Board
- 8-stage drag-and-drop pipeline (Found > Applied > ... > Accepted / Rejected)
- ...

### Job Intelligence
- Paste a URL to auto-fill company, role, salary, deadline
- ...

### AI Assistant
- ...

### Dashboard & Analytics
- ...

### Calendar & Events
- ...

### CV Management
- ...

### Data & Export
- ...
```

The agent mode step will produce the final polished markdown text from this inventory.
