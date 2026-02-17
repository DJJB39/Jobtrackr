# JobTrackr

Open-source job application tracker with a Kanban board, AI assistant, and analytics dashboard.

## Features

### Kanban Board
- 8-stage drag-and-drop pipeline: Found → Applied → Phone Screen → 2nd Interview → Final Interview → Offer → Accepted / Rejected
- Company logos via Clearbit/Google favicon with colored circle fallbacks
- Salary badges, CV suitability score badges, and metadata indicators on cards
- Hover overlay with quick actions (schedule, add link, delete)
- Multi-select mode with bulk move/delete and Ctrl/Cmd+A support
- Mobile-responsive single-column layout with stage selector

### Job Intelligence
- Paste a job URL to auto-fill company, role, location, salary, and deadline via server-side scraper
- 600ms debounced fetch on paste/blur with undo auto-fill
- Duplicate detection (case-insensitive company + role match)
- Partial-data hints for restricted sources (LinkedIn, etc.)

### Job Detail Panel
- Slide-out sheet with 4 tabs: Overview, Events & Contacts, Links & Resume, CV
- Inline click-to-edit for all fields with 500ms debounced auto-save
- Activity timeline tracking stage changes, note edits, and event outcomes
- Stage selector dropdown in panel header

### AI Assistant
- Generate tailored cover letters, interview prep questions, and job summaries
- Streaming markdown responses powered by Gemini
- CV-aware context injection for personalized output
- CV suitability scoring (0–100) with strengths, gaps, and suggestions

### Dashboard & Analytics
- Stats cards: total applications, active, interviews scheduled, offers received
- Interactive by-stage bar chart (click to filter → List View)
- Application type pie chart, weekly activity area chart, conversion funnel
- Stale application alerts (14+ days inactive) and ghost detection (7+ days, no events)
- Achievements/badges grid (8 milestones)
- Sticky upcoming events sidebar

### Calendar & Events
- Month grid with event dot indicators and click-to-open detail panel
- Schedule interviews, follow-ups, and deadlines with outcome tracking
- .ics export and Google Calendar deep links
- Past-event outcome prompts

### CV Management
- Upload a master CV (PDF) with client-side text extraction
- Review suitability against any tracked job (AI-powered 0–100 scoring)
- Color-coded match badges on Kanban cards (green ≥75%, amber ≥50%, rose <50%)
- Private file storage

### Search & Navigation
- Persistent header search bar with fuzzy matching across all fields
- Command palette (Cmd+K) for job search and quick actions
- Multi-filter bar: application type, stage, and role

### Data & Export
- Full CRUD with row-level security
- 5-second soft-delete with undo toast
- Activity audit log
- CSV export with human-readable stage names
- Share stats via clipboard or Web Share API
- New-user onboarding with sample data

### Notifications
- Opt-in email reminders for events within 24 hours
- Weekly pipeline digest email
- Login-time upcoming event alerts

### Authentication
- Email/password, magic link, Google OAuth, Apple OAuth
- Password reset flow and protected routes

### UX Polish
- Dark/light theme toggle
- Glassmorphism design system (glass surfaces, mesh gradients, glow effects)
- Framer Motion page transitions and layout animations
- Mobile-responsive layout throughout

### Landing Page
- Animated hero with CTA, product screenshots, feature grid
- Competitor comparison table, pricing section, FAQ accordion
- Interactive demo mode (no signup required)
- SEO meta tags and JSON-LD structured data

## Built With

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion
- **Drag & Drop:** @dnd-kit
- **Charts:** Recharts
- **Backend:** Supabase (Postgres, Auth, Edge Functions, Storage)
- **AI:** Gemini via Edge Functions
- **PDF Parsing:** pdfjs-dist (client-side)

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd jobtrackr
npm install
npm run dev
```
## Testing & Quality

End-to-end manual test cases and results are tracked in  
→ [docs/testing.md](docs/testing.md)

All critical paths are tested before networking pushes or releases.
## License

MIT
