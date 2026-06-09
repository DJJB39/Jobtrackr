# Cornerman — End-to-End Site & Codebase Reference

> A single source-of-truth document covering the entire Cornerman application: the product, the design system, every route, every major component, every hook, the backend (Lovable Cloud / Supabase) schema and edge functions, the Chrome extension, payments, demo mode, and operational notes. File paths in this document are real — open them directly to see implementations.

---

## 1. Product Overview

**Cornerman** is an opinionated, AI-first job-search coach disguised as a job tracker. It started life as "JobTrackr" (a Kanban for applications) and has since pivoted: the Kanban is still there, but the hero feature is a **ruthless AI coach** that roasts your CV, tailors it per job, generates cover letters, and runs mock interviews.

- **Target user:** mid-to-senior knowledge workers actively job hunting who want brutally honest feedback, not a polite to-do list.
- **Positioning:** "AI coach for the job you actually want." The visual & verbal language is borrowed from a boxing corner — Spar (interview), Roast (CV review), Tape (FAQ/playback), Coach (chat), Cornerman (the brand).
- **Business model:** Freemium. Free tier = 10 AI generations/month. Pro = £9/mo or £69/yr (Paddle as Merchant of Record), unlimited AI.
- **Primary surfaces:** marketing landing page (`/`), authenticated app (`/app`), no-signup demo (`/demo`), and a Chrome extension for one-click job capture.

---

## 2. Design System

The Cornerman aesthetic was rebuilt from the original glassmorphism look into a warm editorial dark theme.

### Tokens (`src/index.css`, `tailwind.config.ts`)

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#0a0908` | Page background |
| `--bg-elev` | `#14110d` | Elevated cards / surfaces |
| `--line` | `#211d18` | Borders, dividers |
| `--text` | `#f5f1ea` | Warm off-white body text |
| `--text-dim` | muted warm grey | Secondary text |
| `--amber` | `#f5a524` | **Reserved** for primary CTAs and accent words only |

A subtle SVG grain texture overlays the background. Halo gradients sit behind the hero. Amber is never used for chrome — only as semantic emphasis.

### Typography

- **Headlines:** `Fraunces` (variable serif, optical sizing) — `font-display`.
- **Body:** `IBM Plex Sans` — `font-sans` (default).
- **Labels / metadata:** `JetBrains Mono`, uppercased, tracked — `font-mono`.

Loaded via Google Fonts in `index.html`.

### Component classes

- `cm-roast-card` — elevated surface used across feature/comparison/pricing/FAQ blocks.
- Buttons follow shadcn `cva` variants; the `premium`/primary variant maps to amber-on-near-black.

### Mobile rules (project memory)

- Header strips non-essential elements on small screens.
- Toasts offset 24 px from the bottom to clear the FAB.
- shadcn `Calendar` requires `pointer-events-auto`.
- Scrollable dialogs use a native `<div overflow-y-auto>` wrapper, not the Radix scroll area.

---

## 3. Tech Stack & Build

- **Frontend:** React 18, Vite 5 (`@vitejs/plugin-react-swc`), TypeScript 5, Tailwind v3, shadcn/ui (Radix primitives), Framer Motion, Recharts, dnd-kit, react-day-picker, cmdk, sonner, react-markdown, pdfjs-dist, papaparse, jszip.
- **State:** Zustand (`src/stores/jobStore.ts`) for jobs; React Context for auth (`useAuth`); local React state elsewhere. TanStack Query is wired in `App.tsx` but used sparingly.
- **Routing:** `react-router-dom` v6 with lazy-loaded routes and a shared `RouteLoader` skeleton.
- **Theming:** `next-themes` with `defaultTheme="dark"`.
- **Backend:** Lovable Cloud (Supabase) — Postgres, Auth, Edge Functions (Deno), Storage.
- **AI:** Lovable AI Gateway (Gemini family by default, user-configurable model) called from edge functions.
- **Payments:** Paddle Billing (MoR) — checkout overlay + webhooks.
- **Tests:** Vitest + Testing Library + jsdom. Files under `src/test/`.
- **Lint:** ESLint flat config (`eslint.config.js`).
- **Vite config:** path alias `@ → src`, `lovable-tagger` in dev mode.

---

## 4. Routing & App Shell

Defined in `src/App.tsx`:

```
/                  → Landing                    (public, lazy)
/auth              → Auth (sign-in / sign-up)   (public)
/demo              → DemoPage                   (public, no auth)
/privacy           → Privacy                    (public)
/pricing           → Pricing                    (public)
/reset-password    → ResetPassword              (public)
/onboarding        → Onboarding                 (ProtectedRoute)
/app               → AppPage                    (ProtectedRoute → RequireOnboarding)
*                  → NotFound
```

### Providers (top-down)

```
ThemeProvider (next-themes, defaultTheme=dark)
└─ QueryClientProvider
   └─ AuthProvider (src/hooks/useAuth.tsx)
      └─ TooltipProvider
         ├─ <Toaster /> (shadcn)
         ├─ <Sonner />
         └─ BrowserRouter
            └─ ErrorBoundary (src/components/ErrorBoundary.tsx)
               └─ Suspense fallback={<RouteLoader />}
                  └─ Routes
```

### Guards

- **`ProtectedRoute`** (`src/components/ProtectedRoute.tsx`): redirects to `/auth` if no session; shows a spinner while `loading`.
- **`RequireOnboarding`** (`src/components/RequireOnboarding.tsx`): on top of `ProtectedRoute`. Reads the user CV (`useUserCV`) and counts existing jobs. If both are empty AND `onboarding_completed` is false, redirects to `/onboarding`. Legacy users with jobs are allowed straight through and shown a soft banner inside `AppPage`.

---

## 5. Authentication

### `useAuth` (`src/hooks/useAuth.tsx`)

Wraps `supabase.auth`. Subscribes to `onAuthStateChange` and hydrates the initial `getSession()`. Exposes `{ user, session, loading, signOut }`.

### Auth page (`src/pages/Auth.tsx`)

- Email + password (sign-in / sign-up tabs)
- Magic link
- Google OAuth
- Apple OAuth
- "Forgot password" → `/reset-password`

Per project memory: anonymous sign-ups are disabled; Google provider must be configured server-side or first sign-in throws "Unsupported provider". Loading states are explicit per-provider to prevent double-clicks.

### Reset password (`src/pages/ResetPassword.tsx`)

Handles both the request flow and the post-redirect "set new password" flow by inspecting the URL fragment for a Supabase recovery token.

### Session model

- JWT stored in `localStorage` via Supabase client (`src/integrations/supabase/client.ts`).
- Edge functions all require the `Authorization: Bearer <jwt>` header and validate via `supabase.auth.getUser()` server-side.

---

## 6. Onboarding

Located in `src/pages/Onboarding.tsx` plus `src/components/onboarding/*`.

Steps (in order):

1. **`CVUploadStep`** — drag-and-drop a PDF. Client-side text extraction via `pdfjs-dist`. The extracted text is stored on `user_cvs.master_text`.
2. **`CVAssessmentStep`** — calls the `ai-assist` edge function in "ruthless review" mode. Streams a brutal score (0–100) plus strengths / gaps / actions.
3. **`CVCleanupStep`** — surfaces inline rewrite suggestions, optionally accepted into a cleaned master CV. Uses `BeforeAfterDiff` for side-by-side comparison.
4. **`OnboardingDone`** — confetti screen, sets `user_cvs.onboarding_completed = true`, then routes to `/app`.

`useOnboarding` (`src/hooks/useOnboarding.tsx`) tracks step index and persistence. `RequireOnboarding` gates entry. A separate **product tour** (`OnboardingTour` + `useOnboardingTour`) plays once inside `/app`, gated by a `localStorage` flag.

---

## 7. In-App Shell (`src/pages/AppPage.tsx`)

`AppPage` is a single-page workspace with a view switcher. The user picks among:

| View | Component | Notes |
| --- | --- | --- |
| Kanban | `KanbanBoard` | Default for returning users with jobs |
| List | `ListView` | High-density table, advanced salary sorting |
| Calendar | `CalendarView` | Month grid with event dots |
| Dashboard | `Dashboard` | Stats, charts, achievements, alerts |
| CV | `CVView` | Master CV editor + per-job career-boost generator |
| AI Studio | `AIStudioView` | 6-card hub for all AI tools |

### `AppHeader` (`src/components/layout/AppHeader.tsx`)

- Brand wordmark (Fraunces, "Cornerman").
- View tabs (icon + label on desktop, icon-only on mobile).
- Persistent **AI Studio sparkles** button (memory: always visible in header).
- Global search input (drives `jobStore.searchQuery`).
- `CommandPalette` trigger badge (Cmd+K).
- `UserMenu` (avatar, settings, billing, sign out).
- **Demo mode strip:** a thin grey bar with a single pulsing amber dot and a mono "DEMO" label — replaces the older noisy banner.

### `UserMenu` (`src/components/UserMenu.tsx`)

Theme toggle, `AISettings` modal (model selection), subscription state, sign-out, feedback link (controlled by `FEEDBACK_FORM_URL` in `src/lib/constants.ts`).

---

## 8. Job Data Model

Defined in `src/types/job.ts`.

```ts
interface JobApplication {
  id: string;
  company: string;
  role: string;
  columnId: ColumnId;     // default stage id OR custom user stage id
  createdAt: string;
  notes: string;
  contacts: Contact[];    // JSONB
  nextSteps: NextStep[];  // JSONB
  links: string[];        // JSONB
  applicationType: string;// one of 15 categories (no "All")
  location?: string;
  description?: string;
  salary?: string;
  closeDate?: string;
  events: JobEvent[];     // JSONB
  importedFrom?: string;
}
```

### Default stages

`found → applied → phone → interview2 → final → offer → accepted | rejected` (8 columns).

### Custom stages

`useStages` (`src/hooks/useStages.tsx`) merges defaults with rows from `user_stages`. Users can rename, reorder, recolour, and add stages via `StageManager`.

### Application categories (`APPLICATION_TYPES`)

15 fixed professional roles (Engineering, Design, Product, Marketing, Sales, Finance, Operations, HR & People, Legal, Healthcare, Education, Creative, Data & Analytics, Consulting, Other). Per memory: there is intentionally no "All" option in selectors.

### Events (`JobEvent`)

`interview | follow_up | deadline`, with an optional outcome (`passed | rejected | pending | rescheduled`). Stored as JSONB on the job row. Dates use the project-wide format `YYYY-MM-DD HH:mm` in **local time with no offset** (memory: timezone architecture).

---

## 9. Job Store (Zustand)

`src/stores/jobStore.ts` is the single source of truth for jobs.

### State

```ts
{ jobs: JobApplication[]; loading: boolean; searchQuery: string }
```

### Key actions

- **`fetchJobs(userId)`** — paginated read in 1000-row pages until exhausted. Maps DB rows via `rowToJob`.
- **`addJob(...)`** — insert + push into local state. Returns the new job for immediate UI use.
- **`updateJob(job, userId?)`** — optimistic local update, then `UPDATE`. On error, re-fetches. Diffs old vs new and writes `job_activity_log` rows for stage changes, notes edits, contact/event/link mutations (`diffActivityLogs`).
- **`deleteJob(id)`** — soft-delete with 5s undo timer (`undoRef`). Flushes any pending delete first; returns `{ undoFn }` for the toast to call.
- **`setJobs`** — functional updater for batch operations (drag/drop, bulk actions).
- **`setSearchQuery`** — global filter consumed by every view.

### Activity log diff

`diffActivityLogs(oldJob, newJob)` emits actions: `stage_change`, `notes_edited`, `contact_added/removed`, `event_added/removed`, `link_changed`. These power the `ActivityTimeline` component.

---

## 10. Kanban & Job UI

### `KanbanBoard` (`src/components/KanbanBoard.tsx`)

- dnd-kit with `closestCorners` collision detection.
- Functional `setJobs` updates avoid stale closures during drag.
- Empty stages auto-collapse to a thin header (memory: kanban-columns).
- Multi-select mode: Ctrl/Cmd+click for toggle, Shift+click for range, **Cmd+A** to select all in view.

### `KanbanColumn` (`src/components/KanbanColumn.tsx`)

Wide column shell with stage colour, count, and drop target. Filtering by salary band, stage, and role is applied here (memory: kanban-filtering — note there is intentionally **no** application-type filter on the board).

### `JobCard` (`src/components/JobCard.tsx`)

Content-first design:
- Company favicon (Clearbit → Google fallback → coloured initial circle).
- Role + company, location, salary pill, optional CV match badge (green ≥75 / amber ≥50 / rose <50).
- Hover overlay with quick actions: schedule event, add link, delete, and a sparkles AI shortcut (memory: kanban-cards).

### `JobDetailPanel` (`src/components/JobDetailPanel.tsx`)

Slide-out `Sheet` with five tabs:

1. **Overview** (`DetailOverviewTab`) — inline-editable company/role/type/location/salary/deadline + notes.
2. **Events & Contacts** (`DetailEventsTab`) — schedule via `ScheduleEventDialog`, outcome prompts for past events, contacts CRUD.
3. **Links & Resume** (`DetailLinksTab`) — job URL, attached files.
4. **CV** (`DetailCVTab`) — per-job CV suitability scoring and tailored CV generation.
5. **Activity** — `ActivityTimeline` sourced from `job_activity_log`.

Auto-save is debounced 500 ms (memory: job-details). Inline edits use `InlineEdit`.

### `BulkActionBar`

Floats when multi-select is active. Bulk move-to-stage and bulk delete with the same 5s undo mechanic.

---

## 11. Job Ingestion

### Add Job dialog (`src/components/AddJobDialog.tsx`)

Three tabs:

1. **URL** — paste a job URL; on paste/blur with 600 ms debounce, calls `scrape-job-url`. Auto-fills company, role, location, salary, close date. Shows partial-data hints for LinkedIn (heuristic: title likely contains "hiring"). Duplicate detection (case-insensitive `company + role` match) warns before save (memory: duplicate-detection, url-auto-fill).
2. **Screenshot** — paste/drop an image; uploads to `analyze-resume`-style flow (`useScreenshotCapture`) — actually routes through `ai-assist` vision mode to extract fields.
3. **Manual** — straight form.

### CSV import (`src/components/CSVImportModal.tsx`, `src/hooks/useCSVImport.ts`)

- Accepts Huntr and Teal exports out of the box, plus arbitrary CSVs.
- Uses an AI pass to **normalise column headers** to Cornerman fields when mapping is ambiguous.
- Batches inserts in groups of 25 to avoid hitting payload limits.
- Stores `imported_from` on the row for analytics.

### Chrome extension (`chrome-extension/`)

- Manifest V3; popup + content script + background worker.
- Authenticates by reading the user JWT from `chrome.storage.local` (set after login on the web app).
- Scrapes the current tab and POSTs to `extension-save-job` with bearer auth.

---

## 12. AI Studio & Generation

### `AIStudioView` (`src/components/AIStudioView.tsx`)

A 6-card hub:

1. **Ruthless CV Review** — score + roast.
2. **CV Tailor** — rewrite the master CV for one job.
3. **Cover Letter** — generate a tailored letter.
4. **Interview Coach** — voice-enabled mock interview.
5. **Day-Before Bootcamp** — 1-day prep plan for an upcoming interview.
6. **Career Boost** — broader narrative/positioning content.

Each card has an inline job selector. A monthly usage progress bar at the top reflects the user's free-tier consumption.

### Model routing

- `useAIPreferences` (`src/hooks/useAIPreferences.ts`) persists the user's selected model.
- The `ai-assist` edge function (`supabase/functions/ai-assist/index.ts`, 1k+ LOC) is a unified router that fans out to the chosen model via the Lovable AI Gateway. All AI feature calls go through it.

### Streaming

- `useSSEStream` (`src/hooks/useSSEStream.ts`) consumes the function's Server-Sent Events response.
- `useAIGeneration` wraps SSE + state machine (idle/streaming/done/error) and exposes the markdown buffer.

### Usage limits

- Free tier: **10 generations per calendar month**, enforced server-side. Over-quota returns HTTP 403.
- Counted in `ai_usage_logs` (one row per call). Pro subscribers are unlimited.
- The UI surfaces remaining count and gracefully degrades to an upgrade prompt on 403.

---

## 13. AI Tools — Detail

### Ruthless CV Review (`src/hooks/useRuthlessReview.ts`)

Four intensity levels (gentle → savage). Returns a numeric score, a paragraph of roast, and a **high-visibility action checklist** rendered above the prose (memory: ruthless-cv-review).

### CV Tailor (`src/components/CVTailorModal.tsx`, `src/hooks/useCVTailor.ts`)

- Side-by-side diff (original vs tailored) using a custom diff renderer.
- **Honesty guardrail (core memory rule):** the model is system-prompted to never invent skills or experience — only rephrase what exists in the master CV. This is enforced both in the prompt and via a post-generation sanity check.

### Cover Letter

Single generation call, markdown output, copy-to-clipboard.

### Interview Coach (`src/components/InterviewCoach.tsx`, `src/hooks/useInterviewCoach.ts`)

- Browser SpeechSynthesis for the coach voice, SpeechRecognition for the candidate.
- Two modes: **Ruthless** (cutting follow-ups) and **Helpful** (coaching tone).
- STAR scoring on each answer with rubric breakdown.
- Sessions persisted to `interview_sessions`.

### Day-Before Bootcamp (`src/components/DayBeforeBootcamp.tsx`, `src/hooks/useBootcamp.ts`)

Generates a 1-day prep plan for a chosen upcoming interview: company research highlights, likely questions, STAR drills, commute logistics. Auto-injects the Ruthless context.

### Career Boost

Inline generator on `CVView` for ongoing narrative/positioning materials, with an auto-roast toggle for first-time users.

---

## 14. Analytics & Dashboard

`src/components/Dashboard.tsx`:

- **Stat cards:** total, active, interviews scheduled, offers received.
- **By-stage bar chart:** click a bar → jumps to filtered List View.
- **Application-type pie chart.**
- **Weekly activity area chart.**
- **Conversion funnel** — drops stages with zero values (memory: dashboard — "no zero-value stages").
- **Stale alerts** for jobs untouched 14+ days; **ghost detection** for applications with no events after 7+ days.
- **Achievements** (`src/components/Achievements.tsx`): 8 milestone badges (first app, first interview, 10 apps, etc.).
- **Upcoming events** sticky sidebar.

`ShareStats` (`src/components/ShareStats.tsx`) formats a pipeline summary for clipboard / Web Share API.

---

## 15. Calendar & Events

`src/components/CalendarView.tsx`:

- shadcn `Calendar` (react-day-picker) with `pointer-events-auto` fix.
- Day cells aggregate event dots from all jobs.
- Click a day → side list of events with click-through to the job detail panel.

`ScheduleEventDialog` writes into `job.events` JSONB. `src/lib/ics.ts` produces `.ics` strings for individual events and an "Add to Google Calendar" deep link.

Past events without an outcome trigger a prompt on next login (memory: event-tracking).

---

## 16. Reminders & Notifications

### Edge functions

- `send-reminders` — cron-driven (pg_cron). Finds events within 24 hours where the user opted in; sends email via Resend.
- `weekly-digest` — Sunday cron, summarises pipeline activity.
- `send-push` — VAPID web-push fan-out.
- `unsubscribe` — one-click email unsubscribe.

### Client

- `usePushNotifications` (`src/hooks/usePushNotifications.tsx`) — registers the service worker (`public/sw.js`), subscribes to VAPID, posts subscription to backend.
- `useLoginReminders` — on login, surfaces upcoming events as toast/dialog.

---

## 17. Payments (Paddle)

- **Plan:** Pro — £9/month or £69/year (memory note records an earlier £8/mo experiment).
- `src/lib/paddle.ts` initialises Paddle.js with the environment-bound client token and price IDs.
- `usePaddleCheckout` opens the overlay checkout.
- `supabase/functions/get-paddle-price/index.ts` resolves price metadata for the pricing UI.
- `supabase/functions/payments-webhook/index.ts` consumes Paddle webhooks (Merchant of Record events: `subscription.activated`, `.updated`, `.canceled`, etc.) and upserts `public.subscriptions`.
- `useSubscription` (`src/hooks/useSubscription.ts`) syncs the row to the client and gates Pro features.
- `PaymentTestModeBanner` warns the user when Paddle is running in sandbox.

`src/pages/Pricing.tsx` renders two cards (Free £0 / Pro £9 mo or £69 yr) with the new Cornerman editorial styling.

---

## 18. Demo / Guest Mode

- `src/pages/DemoPage.tsx` — no auth required. Lands directly on **AI Studio hub** (`view: "ai"`) so first-time visitors see the AI experience, not the Kanban.
- `useGuestMode` (`src/hooks/useGuestMode.tsx`) — replaces Supabase reads/writes with in-memory state for the session.
- AI calls are **simulated** with canned streaming responses (no quota burned, no auth needed).
- Persistence is disabled; refresh wipes the session.
- A thin grey strip with a pulsing amber dot in the header indicates demo mode.
- `DemoCVView` is a tailored variant of `CVView` for the canned demo CV (`src/lib/demo-cv-data.ts`).

---

## 19. Chrome Extension

`chrome-extension/`:

- `manifest.json` — Manifest V3, host permissions for major job boards, `activeTab`, `storage`.
- `popup.html` / `popup.js` / `popup.css` — sign-in status, "Save this job" button.
- `content.js` — DOM scraping per known site, sanitises before send.
- `background.js` — service worker, holds the JWT from `chrome.storage.local`, posts to `extension-save-job` edge function with `Authorization` header.
- See `chrome-extension/README.md` for install / dev notes.

---

## 20. Backend — Lovable Cloud (Supabase)

### Tables (under `public`)

| Table | Purpose |
| --- | --- |
| `job_applications` | Core job rows (see §8) |
| `job_activity_log` | Append-only diff log per job (`stage_change`, etc.) |
| `user_cvs` | Master CV text, parsed sections, `onboarding_completed` flag |
| `user_stages` | Custom Kanban columns per user |
| `user_preferences` | UI prefs (theme, AI model, opt-ins) |
| `ai_usage_logs` | One row per AI call — drives free-tier quota |
| `interview_sessions` | Persisted interview-coach transcripts and scores |
| `subscriptions` | Paddle-synced subscription state |
| (push subs table) | VAPID endpoints for push notifications |
| `user_roles` + `app_role` enum | Roles in a **separate** table (security memory rule) |

### Security pattern

- RLS is **on** for every public table.
- Standard policies: `auth.uid() = user_id` for SELECT/INSERT/UPDATE/DELETE.
- Role checks use a `SECURITY DEFINER` function `public.has_role(_user_id uuid, _role app_role)` to avoid recursive RLS.
- Every public table has explicit `GRANT`s to `authenticated` and `service_role`; `anon` only where genuinely public.

### Triggers / functions

- `update_updated_at_column()` — auto-touches `updated_at` on UPDATE; attached to most tables.
- Cron schedules (pg_cron) drive `send-reminders` (hourly) and `weekly-digest` (Sunday).

### Storage buckets

- Private buckets for uploaded CV PDFs and screenshots. Signed URLs only.

---

## 21. Edge Functions Catalog

All under `supabase/functions/`. Every function:
- Sets CORS for the app domain (allowlisted; memory: environment-config).
- Validates the user JWT (`supabase.auth.getUser`) unless explicitly public (`unsubscribe`).
- Sanitises scraped input.

| Function | Purpose |
| --- | --- |
| `ai-assist` | Unified AI router. Handles roast, tailor, cover letter, interview, bootcamp, vision (screenshot extraction). SSE streaming. Enforces the 10/mo free quota (HTTP 403 over limit). |
| `analyze-resume` | CV suitability scoring (0–100, strengths/gaps/suggestions) for a given job. |
| `scrape-job-url` | Server-side fetch + parse of a job posting (Open Graph, JSON-LD, site-specific heuristics for LinkedIn etc.). |
| `extension-save-job` | Authenticated insert endpoint used by the Chrome extension. |
| `get-paddle-price` | Resolves Paddle price metadata for the pricing page. |
| `payments-webhook` | Paddle webhook receiver; syncs `subscriptions`. |
| `send-reminders` | Hourly cron; sends Resend emails for events within 24h. |
| `weekly-digest` | Weekly pipeline summary email. |
| `send-push` | VAPID push fan-out. |
| `unsubscribe` | One-click email unsubscribe (public). |

`_shared/paddle.ts` holds Paddle signature verification + helpers reused by webhook & price functions.

---

## 22. Landing Page

`src/pages/Landing.tsx` composes:

1. **Hero** — Fraunces headline, amber accent words, primary CTA (`/auth`) + secondary "Try the demo" (`/demo`). Grain texture and halo gradients.
2. **FeaturesSection** (`src/components/landing/FeaturesSection.tsx`) — "Six tools" grid (Coach / Roast / Capture / Tailor / Cover Letter / Kanban), `lg:grid-cols-3`.
3. **ComparisonTable** — Cornerman vs Huntr/Teal/Notion with explicit "Yes / Limited / No" mono labels.
4. **PricingSection** — Free £0 and Pro £9/mo (or £69/yr toggle).
5. **FAQSection** ("Tape") — editorial accordion, Fraunces questions, amber toggle indicators.
6. **ChromeExtensionCTA** — install banner.
7. **Footer** — "© Cornerman · 2026 · Built for the day the recruiter calls back."

### SEO (`index.html`)

- `<title>` Cornerman — AI coach for the job you actually want
- Meta description (<160 chars), canonical, viewport, Open Graph + Twitter tags, JSON-LD `SoftwareApplication`.
- Single H1 in the hero. Semantic sections. Lazy-loaded images.

---

## 23. Service Worker & Push (`public/sw.js`)

- Registered by `usePushNotifications`.
- Handles `push` events → `showNotification`.
- `notificationclick` opens the relevant `/app` deep link.

---

## 24. Testing (`src/test/`)

Vitest suite (run `npm test`):

| File | Covers |
| --- | --- |
| `Landing.test.tsx` | Landing renders, CTAs link correctly |
| `Auth.test.tsx` | Sign-in/up flows, provider buttons |
| `ResetPassword.test.tsx` | Recovery token handling |
| `JobCard.test.tsx` | Badges, hover actions |
| `KanbanColumn.test.tsx` | Drop target, count, collapse |
| `CVTailorModal.test.tsx` | Diff render, honesty guard |
| `DayBeforeBootcamp.test.tsx` | Plan generation flow |
| `ScreenshotCaptureModal.test.tsx` | Vision extraction wiring |
| `aiFeatures.test.ts` | Quota enforcement, model routing |
| `constants.test.ts` | App constants integrity |
| `csvImport.test.ts` | Huntr/Teal mapping, batching |
| `edgeCases.test.ts` | Salary parsing, duplicate detection, empty states |
| `jobStore.test.ts` | Optimistic updates, undo, diff log |
| `useSSEStream.test.ts` | SSE parsing |
| `useScreenshotCapture.test.ts` | Upload + parse pipeline |
| `setup.ts`, `mocks.ts`, `test-utils.tsx` | Shared scaffolding |

---

## 25. Annotated File Map

```
src/
├─ App.tsx                       Router + providers
├─ main.tsx                      Entry
├─ index.css                     Cornerman tokens + base styles
├─ pages/
│  ├─ Landing.tsx                Marketing page
│  ├─ Auth.tsx                   Sign in / up
│  ├─ ResetPassword.tsx
│  ├─ Onboarding.tsx             Multi-step CV onboarding
│  ├─ AppPage.tsx                Authenticated workspace shell
│  ├─ DemoPage.tsx               Guest mode → lands on AI Studio
│  ├─ Pricing.tsx                Free / Pro cards
│  ├─ Privacy.tsx
│  ├─ NotFound.tsx
│  └─ Index.tsx                  Legacy redirect
├─ components/
│  ├─ layout/AppHeader.tsx
│  ├─ landing/                   Hero + sections of /
│  ├─ onboarding/                CVUploadStep, CVAssessmentStep, CVCleanupStep, OnboardingDone, BeforeAfterDiff
│  ├─ detail/                    JobDetailPanel tabs
│  ├─ ui/                        shadcn primitives
│  ├─ KanbanBoard.tsx + KanbanColumn.tsx + JobCard.tsx
│  ├─ ListView.tsx
│  ├─ CalendarView.tsx
│  ├─ Dashboard.tsx + Achievements.tsx + ActivityTimeline.tsx
│  ├─ CVView.tsx + DemoCVView.tsx + CVUploadSection.tsx
│  ├─ AIStudioView.tsx + AIAssistPanel.tsx + AISettings.tsx
│  ├─ CVTailorModal.tsx + ResumeAnalysis.tsx
│  ├─ InterviewCoach.tsx + DayBeforeBootcamp.tsx
│  ├─ AddJobDialog.tsx + CSVImportModal.tsx + ScreenshotCaptureModal.tsx
│  ├─ ScheduleEventDialog.tsx
│  ├─ JobDetailPanel.tsx
│  ├─ BulkActionBar.tsx + StageManager.tsx
│  ├─ CommandPalette.tsx + InlineEdit.tsx + NavLink.tsx
│  ├─ ShareStats.tsx
│  ├─ OnboardingTour.tsx
│  ├─ PaymentTestModeBanner.tsx
│  ├─ UserMenu.tsx
│  ├─ ErrorBoundary.tsx
│  ├─ ProtectedRoute.tsx + RequireOnboarding.tsx
├─ hooks/                        See §11–§17 for details
├─ stores/jobStore.ts            Zustand job store
├─ lib/
│  ├─ constants.ts               FEEDBACK_FORM_URL et al
│  ├─ salary.ts                  Shared salary parser
│  ├─ ics.ts                     .ics builders
│  ├─ paddle.ts                  Paddle.js bootstrap + price IDs
│  ├─ demo-cv-data.ts            Canned demo CV
│  └─ utils.ts                   cn() helper
├─ types/job.ts                  Domain types & defaults
├─ integrations/
│  ├─ supabase/{client,types}.ts auto-gen — do not edit
│  └─ lovable/index.ts           Lovable AI gateway helper
└─ test/                         Vitest suite

supabase/
├─ config.toml                   auto-gen, do not edit
├─ migrations/                   timestamped SQL (read-only)
└─ functions/
   ├─ _shared/paddle.ts
   ├─ ai-assist/                 Unified AI router (1k+ LOC)
   ├─ analyze-resume/
   ├─ scrape-job-url/
   ├─ extension-save-job/
   ├─ get-paddle-price/
   ├─ payments-webhook/
   ├─ send-reminders/
   ├─ weekly-digest/
   ├─ send-push/
   └─ unsubscribe/

chrome-extension/                Manifest V3 capture extension
public/sw.js                     Push service worker
```

---

## 26. Operational Rules (project memory)

These are enforced across the codebase and any future change must respect them:

- **Timezone:** store and render dates as `YYYY-MM-DD HH:mm` in local time, **no offsets**.
- **AI honesty:** the CV Tailor must never fabricate skills — only rephrase existing experience.
- **AI quota:** free tier capped at 10 generations/month; enforced via HTTP 403 from edge functions.
- **shadcn calendar:** wrap with `pointer-events-auto` to fix Radix focus traps.
- **Scrollable dialogs:** use native `<div overflow-y-auto>`, not Radix scroll area, especially on mobile.
- **Mobile:** strip non-essential header items; offset toasts 24 px from bottom to clear the FAB.
- **Roles:** stored in a separate `user_roles` table — never on profiles.
- **RLS + GRANTs:** every new public table needs both, in the same migration.
- **Auto-gen files:** `src/integrations/supabase/{client,types}.ts`, `.env*` Supabase keys, and `supabase/config.toml` are not to be edited.

---

## 27. Glossary (Cornerman terminology)

| Term | What it maps to |
| --- | --- |
| **Coach** | The AI assistant (chat / generation) |
| **Roast** | Ruthless CV review |
| **Tape** | The FAQ section / replayable interview transcripts |
| **Spar** | Mock interview session |
| **Capture** | Adding a job (URL, screenshot, extension, CSV) |
| **Tailor** | Per-job CV rewrite |
| **Cornerman** | The brand — the voice in your corner |

---

## 28. Where to start reading the code

If you have 30 minutes and want to understand the whole thing, read in this order:

1. `src/App.tsx` — see the route map and provider stack.
2. `src/types/job.ts` — internalise the domain model.
3. `src/stores/jobStore.ts` — see how data flows.
4. `src/pages/AppPage.tsx` — understand the workspace shell.
5. `src/components/AIStudioView.tsx` + `supabase/functions/ai-assist/index.ts` — see the AI surface end-to-end.
6. `src/pages/Landing.tsx` + `src/components/landing/*` — see the marketing surface.
7. `supabase/migrations/` (newest first) — see the schema as it stands today.

— end of document —