## Phase 2: Salary, Deadline, Auto-Fetch, Undo Auto-Fill — COMPLETED

All changes implemented:

| File | Change |
|------|--------|
| DB migration | Added `salary` text, `close_date` date columns |
| `src/types/job.ts` | Added `salary?`, `closeDate?` to JobApplication |
| `src/hooks/useJobs.tsx` | Map new fields, expanded addJob/updateJob |
| `supabase/functions/scrape-job-url/index.ts` | Added close_date extraction (JSON-LD + HTML regex), source-specific hints |
| `src/components/AddJobDialog.tsx` | Salary + deadline fields, auto-fetch on paste/blur (600ms debounce), undo auto-fill button |
| `src/components/JobDetailPanel.tsx` | Salary + deadline fields, "View Original Posting" link |
| `src/components/JobCard.tsx` | Salary pill, deadline with urgency color (<7 days = red), external link icon |
| `src/pages/AppPage.tsx` | CSV columns for salary + deadline |
