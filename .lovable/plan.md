# Plan: End-to-End Cornerman Documentation

Produce a single comprehensive Markdown document, `docs/cornerman-overview.md`, that explains the entire site and codebase in depth. No app code will change — only a new docs file.

## Exploration pass (read-only, before writing)
I'll read these to ensure accuracy:
- Routing/shell: `src/App.tsx`, `src/pages/*` (Landing, Auth, AppPage, DemoPage, Onboarding, Pricing, Privacy, ResetPassword, NotFound)
- Layout & nav: `src/components/layout/AppHeader.tsx`, `UserMenu`, `NavLink`, `CommandPalette`
- Core features: `KanbanBoard`, `KanbanColumn`, `JobCard`, `JobDetailPanel`, `Dashboard`, `CalendarView`, `ListView`, `CVView`, `AIStudioView`, `AIAssistPanel`, `InterviewCoach`, `CVTailorModal`, `ScreenshotCaptureModal`, `CSVImportModal`, `DayBeforeBootcamp`, `BulkActionBar`, `StageManager`, `Achievements`, `ActivityTimeline`, `ShareStats`
- Onboarding flow: `src/components/onboarding/*`, `useOnboarding`, `useOnboardingTour`, `RequireOnboarding`
- State & hooks: `src/stores/jobStore.ts`, `useAuth`, `useJobs`, `useUserCV`, `useStages`, `useSubscription`, `usePaddleCheckout`, `useAIGeneration`, `useAIPreferences`, `useRuthlessReview`, `useCVTailor`, `useInterviewCoach`, `useScreenshotCapture`, `useSSEStream`, `useBootcamp`, `useGuestMode`, `useLoginReminders`, `usePushNotifications`, `useCSVImport`
- Types & libs: `src/types/job.ts`, `src/lib/*` (constants, salary, paddle, ics, demo-cv-data, utils), `src/integrations/lovable`
- Backend: every `supabase/functions/*/index.ts`, plus migrations summary (list only — migrations are read-only)
- Chrome extension: `chrome-extension/*`
- Landing components: `src/components/landing/*`
- Design system: `src/index.css`, `tailwind.config.ts`, `index.html`
- Config: `package.json`, `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, `components.json`, `public/sw.js`, `public/robots.txt`
- Tests: `src/test/*` (summarize coverage)

## Document structure

1. **Product overview** — what Cornerman is, target user, positioning ("ruthless AI coach").
2. **Design system** — palette tokens, fonts (Fraunces / IBM Plex Sans / JetBrains Mono), grain texture, component classes.
3. **Tech stack & build** — React 18, Vite, Tailwind, shadcn, Zustand, React Router, Lovable Cloud (Supabase), Lovable AI Gateway, Paddle.
4. **Routing & app shell** — every route, guards (`ProtectedRoute`, `RequireOnboarding`), lazy loading, error boundary, theme provider.
5. **Authentication** — `useAuth`, Auth page (email/password, magic link, Google, Apple), reset password flow, session handling.
6. **Onboarding** — CV upload → assessment → cleanup → done; gating logic; legacy-user bypass.
7. **In-app views** (AppPage) — view switcher: Kanban, List, Calendar, Dashboard, CV, AI Studio. For each: data flow, key interactions, mobile behaviors.
8. **Job data model** — `JobApplication`, columns/stages (default + custom via `useStages`), events, contacts, links, activity log.
9. **Job store (Zustand)** — paginated fetch, optimistic updates, soft-delete with undo, activity diffing.
10. **Job ingestion** — Add Job dialog, URL scraping (`scrape-job-url`), screenshot capture (vision model), CSV import (Huntr/Teal), Chrome extension (`extension-save-job`).
11. **AI Studio & generation** — model routing (`useAIPreferences`), `ai-assist` edge function, SSE streaming (`useSSEStream`), usage limits (10/mo free, 403 enforcement).
12. **AI tools breakdown** — Ruthless CV Review (4 intensities), CV Tailor (diff, honesty guardrails), Cover Letter, Interview Coach (Ruthless/Helpful + speech), Day-Before Bootcamp, Career Boost.
13. **Analytics & dashboards** — Dashboard cards, charts, funnel, achievements, stale/ghost detection, ShareStats.
14. **Calendar & events** — month grid, schedule dialog, `.ics` export, outcome prompts.
15. **Reminders & notifications** — `send-reminders`, `weekly-digest`, push (`send-push`, VAPID, service worker), login reminders, pg_cron schedules.
16. **Payments** — Paddle integration (`usePaddleCheckout`, `paddle.ts`), `payments-webhook`, `get-paddle-price`, `useSubscription` sync, test-mode banner, £9/mo £69/yr.
17. **Demo / guest mode** — `DemoPage` lands on AI Studio hub, `useGuestMode` local state, AI simulation, disabled persistence, thin grey demo strip.
18. **Chrome extension** — manifest V3, popup, background, content script, authenticated save flow.
19. **Backend (Lovable Cloud)** — table summary (jobs, events, activity log, user_cv, user_roles, user_stages, subscriptions, push subs, ai usage), RLS pattern, `has_role` security-definer, GRANTs.
20. **Edge functions catalog** — purpose, auth, request/response shape for each function in `supabase/functions/`.
21. **Landing page sections** — Hero, Features (6 tools), Comparison Table, Pricing, FAQ, Chrome CTA, Footer; SEO & JSON-LD.
22. **SEO & metadata** — `index.html` tags, robots, sitemap considerations, JSON-LD.
23. **Testing** — Vitest suites and what each covers.
24. **File map** — annotated tree of `src/` and `supabase/functions/` grouped by domain.
25. **Known constraints & memory rules** — pulled from project memory (timezone format, shadcn pointer events, AI honesty, free-tier 10-gen cap, etc.).
26. **Glossary** — Spar, Roast, Tape, Coach, Cornerman terminology mapped to features.

## Deliverable
- One new file: `docs/cornerman-overview.md` (long-form, sectioned, with code path references like `src/components/AIStudioView.tsx`).
- No changes to source code, config, or migrations.

## Notes
- This will be a long doc (estimated 2,000–4,000 lines). If you'd prefer it split into multiple files (e.g., `docs/architecture.md`, `docs/features.md`, `docs/backend.md`), say so and I'll restructure before building.
- I'll cite real file paths and function names from the codebase, not invented ones.
