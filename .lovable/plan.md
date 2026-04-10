

# Day Before Interview Bootcamp

## Overview

A focused prep feature triggered from jobs with upcoming interviews. Generates a structured 1-day plan (company snapshot, logistics, schedule, tailored questions) via AI, then lets the user jump straight into a ruthless voice coach session with bootcamp context injected.

## Technical Changes

### 1. Edge Function — new `day_before_bootcamp` mode

**File**: `supabase/functions/ai-assist/index.ts`

Add a new tool-call mode `day_before_bootcamp` (non-streaming, structured JSON output) alongside the existing `csv_import_analyze` block. Uses a new tool schema:

```text
day_before_bootcamp_result:
  company_snapshot: { why_join, location_details, recent_news, product_context }
  logistics: { commute_estimate, cost_estimate, time_advice }
  schedule: [{ time, activity, duration_min, focus_area }]  (8-12 items)
  questions: [{ question, type, context_note }]  (4-6 items)
  summary_markdown: string  (printable overview)
```

System prompt instructs the AI to research the company based on the job description, incorporate recent context (layoffs/funding/expansion), and produce realistic logistics if user location is provided. Ruthless tone baked in where appropriate.

Input: `{ mode: "day_before_bootcamp", job, cvText, userLocation? }`

No DB migration needed — bootcamp sessions will be stored as `interview_sessions` with `mode: "bootcamp"` (column already supports any text value).

### 2. Hook — extend `useInterviewCoach.ts`

Add a `startBootcampSession` method that:
- Calls the `day_before_bootcamp` edge function mode first to get the structured prep data.
- Stores the bootcamp result in state (`bootcampData`).
- When user clicks "Roast Me Now", calls `startSession()` but injects the bootcamp questions (instead of generating new ones) and passes bootcamp context to the feedback prompts.

New exports: `bootcampData`, `bootcampLoading`, `startBootcampSession`, `startBootcampRoast`.

### 3. New Component — `src/components/DayBeforeBootcamp.tsx`

A `Dialog` component with glassmorphism styling:

**States**: `idle` → `loading` → `ready` → `roasting` (delegates to InterviewCoach)

**Layout when ready**:
- **Company Snapshot** — card with why_join, recent news badges, product context
- **Logistics** — commute/cost/time advice in a compact row
- **Schedule Timeline** — vertical timeline of the day's activities with times and focus areas
- **Questions Preview** — numbered list with type badges
- **Big "Roast Me Now" button** — starts ruthless coach with bootcamp questions
- **Print/Export** — `window.print()` with print-friendly CSS

### 4. Integration Points

**JobDetailPanel** (`src/components/JobDetailPanel.tsx`):
- Add "Day Before Bootcamp" button next to Coach button in the header.
- Only visible when job has an upcoming interview event (within 3 days).
- Pass `onOpenBootcamp` prop.

**AppPage** (`src/pages/AppPage.tsx`):
- Add `bootcampOpen` state + `DayBeforeBootcamp` component alongside existing `InterviewCoach`.
- Wire `onOpenBootcamp` through `JobDetailPanel`.

**JobCard** (`src/components/JobCard.tsx`):
- Add a small calendar-check icon on hover for jobs with upcoming interviews (within 3 days).
- On click, opens the detail panel and triggers bootcamp.

### 5. Edge Function Feedback Enhancement

Add a new system prompt key `interview_feedback_bootcamp_ruthless` that extends the existing ruthless feedback prompt with bootcamp-specific instructions: reference company news, call out missed opportunities to mention specific company context, etc.

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/ai-assist/index.ts` | Add `day_before_bootcamp` mode + tool schema + `interview_feedback_bootcamp_ruthless` prompt |
| `src/hooks/useInterviewCoach.ts` | Add bootcamp state, `startBootcampSession`, `startBootcampRoast` |
| `src/components/DayBeforeBootcamp.tsx` | **New** — full bootcamp modal |
| `src/components/JobDetailPanel.tsx` | Add bootcamp button (conditional on upcoming interview) |
| `src/pages/AppPage.tsx` | Add bootcamp state + component wiring |
| `src/components/JobCard.tsx` | Add bootcamp icon on hover for jobs with upcoming interviews |

## What's NOT included

- **No new DB table or migration** — reuses `interview_sessions` with `mode: "bootcamp"`
- **No real commute API** — AI estimates based on location text (good enough, no external API key needed)
- **No separate usage bucket** — counts against existing 10/month AI limit

## Test Scenarios

1. **Happy path**: Job with interview tomorrow → click "Day Before Bootcamp" → see company snapshot, schedule, questions → click "Roast Me Now" → answer with bootcamp context feedback
2. **Company news injection**: Job at a company with known recent events → verify AI references them in snapshot and feedback
3. **No interview scheduled**: Verify bootcamp button is hidden or shows "Schedule an interview first" tooltip

