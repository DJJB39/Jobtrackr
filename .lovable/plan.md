
# AI-First Onboarding — Implementation Plan

Make AI the protagonist from minute one. Every new user lands on `/onboarding` immediately after sign-up: upload CV → ruthless assessment → clean & strengthen → re-score → enter the board. Master CV moves from `localStorage` to Supabase so it's durable, queryable, and ready to power instant job scoring.

Scope: **onboarding flow + CV persistence only**. No board rework, no new flagship features.

---

## 1. Database (one migration)

**New table `user_cvs`** — one row per user, owner-only RLS.

```text
user_cvs
  user_id              uuid PK FK auth.users on delete cascade
  original_text        text         -- raw upload / pasted CV
  cleaned_text         text null    -- AI-strengthened version (null until user accepts)
  original_score       int  null    -- 0-100, from first assessment
  cleaned_score        int  null    -- 0-100, after re-assessment
  assessment_jsonb     jsonb null   -- { intensity, feedback_md, strengths[], gaps[], quick_wins[] }
  cleanup_diff_jsonb   jsonb null   -- { sections: [{type, before, after, reason, accepted}], summary, skills }
  onboarding_completed boolean default false  -- set true when user clicks "take me to my jobs"
  created_at, updated_at
```

RLS: `user_id = auth.uid()` for SELECT/INSERT/UPDATE. No DELETE policy (we never delete).
Trigger: reuse `update_updated_at_column()`.

**Alter `job_applications`:**
```text
+ ai_score          int null
+ ai_score_reasons  jsonb null   -- { strengths[], gaps[], one_liner }
+ ai_score_at       timestamptz null
```

Backfill = null. Existing `ats_score` column stays untouched (different feature, free-text resumes).

---

## 2. Edge function changes (`ai-assist`)

Add **two new modes** to the existing function (no new function file, no config.toml changes):

- **`cv_assessment`** — input: `{ cvText, intensity }`. Returns via tool calling:
  ```text
  { score: int 0-100, feedback_md: string, strengths: string[], gaps: string[], quick_wins: string[] }
  ```
  Reuses the existing intensity prompt table (Soft / Medium / Hard / Nuclear). Same closing rule: "End with Immediate Action Checklist of 3–6 verb-led fixes."

- **`cv_cleanup`** — input: `{ originalText, assessment }`. Returns via tool calling:
  ```text
  {
    cleaned_text: string,
    sections: [{ type: "summary"|"bullet"|"skill", before: string, after: string, reason: string }],
    risk_notes: string[]   // any rephrasings that flirt with embellishment
  }
  ```
  Strict honesty system prompt: rephrase only, no fabrication, preserve facts/dates/numbers, flag anything close to a stretch.

Both modes are JWT-validated and counted against the free-tier limit, like the others.

---

## 3. New frontend pieces

**Hook — `src/hooks/useUserCV.ts`**
- `loadCV()` — fetches the row for current user (returns null if none)
- `saveOriginal(text)` — upsert original_text + reset cleaned fields
- `saveAssessment(score, jsonb)` — patch original_score + assessment_jsonb
- `saveCleanup(cleanedText, diff, newScore)` — patch cleaned_text + cleanup_diff_jsonb + cleaned_score
- `completeOnboarding()` — set onboarding_completed = true
- Exposes `{ cv, loading, ...actions }`. React Query for caching.

**Page — `src/pages/Onboarding.tsx`**
- Multi-step orchestrator with progress indicator (4 dots: Upload → Assess → Clean → Done).
- Uses `useUserCV` to determine entry step (e.g., user refreshes mid-flow → resume where they left off).
- Glassmorphism shell consistent with existing aesthetic; mesh gradient background; Satoshi for headings.
- Final step CTA: "Take me to my jobs" → calls `completeOnboarding()` → `navigate("/app")`.

**Components (under `src/components/onboarding/`):**

- **`CVUploadStep.tsx`** — wraps the existing PDF parse + paste flow (reuse logic from `CVUploadSection`). On success → `saveOriginal(text)` → advance.
- **`CVAssessmentStep.tsx`**
  - Intensity picker (4 cards: Soft / Medium / Hard / Nuclear, with Nuclear disclaimer).
  - "Roast my CV" button → calls `cv_assessment` via SSE through `useSSEStream` (or non-streaming `invoke` for the structured part + a separate streamed `ruthless_review` for prose if we want both — see decision Q1).
  - Score ring (reuse the `ScoreRing` pattern from `CVView`/`InterviewCoach`).
  - Streaming markdown feedback panel below.
  - "Clean & Strengthen my CV" CTA appears once assessment completes.
- **`CVCleanupStep.tsx`**
  - Calls `cv_cleanup`, shows full-page loader while running.
  - **`BeforeAfterDiff` sub-component** — rendered per section (summary, bullets, skills), side-by-side on desktop / stacked on mobile. Each section has Accept / Reject toggle and inline edit on the "after" pane.
  - Risk notes shown as amber callouts.
  - Footer: "Apply changes" → assembles final cleaned_text from accepted sections → `saveCleanup(...)` → triggers re-assessment → advances to "Done" panel.
- **`OnboardingDone.tsx`** (small) — shows old score, new score, delta badge, "Re-assess" + "Take me to my jobs" buttons.

---

## 4. Routing & guard

**`App.tsx`:**
- Add `<Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />`.

**New `<RequireOnboarding>` wrapper** around `/app`:
- Reads `user_cvs.onboarding_completed`. If row missing or flag false → `<Navigate to="/onboarding" replace />`.
- Loading state reuses `RouteLoader`.

**Auth.tsx:** after sign-in/up success, navigate to `/onboarding` (the guard handles the "already done" case by allowing the page to short-circuit to `/app` if `onboarding_completed === true` and no `?force=1` query param).

**CV view escape hatch:** add a small "Re-run onboarding" link at the top of the existing `CVView` so users can intentionally redo the flow.

---

## 5. Migration of existing users

Three categories on first load after deploy:

| User state | Behavior |
|---|---|
| New sign-up | Forced through `/onboarding` |
| Returning, no `user_cvs` row, has jobs | Soft banner on `/app`: "Unlock instant AI scoring — finish your 2-min CV setup" → CTA to `/onboarding`. **Do not block the board.** |
| Returning, no `user_cvs` row, no jobs | Same as new sign-up — forced through onboarding |
| Returning, has `user_cvs` row | Straight to `/app` |

For the soft-banner case we add a one-line check in `AppPage` reading the same `useUserCV` hook. Banner is dismissable per session via `sessionStorage`.

We also opportunistically migrate the `localStorage` master CV (`cv-text-${user.id}`) into `user_cvs.original_text` once during onboarding upload step, pre-filling the textarea.

---

## 6. Tone consistency

All ruthless prompts (assessment + cleanup risk notes + existing per-job suitability) end with the Immediate Action Checklist contract. Nuclear intensity keeps its profanity disclaimer. Helpful path is unchanged.

---

## File inventory

**New:**
- `supabase/migrations/<ts>_user_cvs_and_ai_score.sql`
- `src/pages/Onboarding.tsx`
- `src/components/onboarding/CVUploadStep.tsx`
- `src/components/onboarding/CVAssessmentStep.tsx`
- `src/components/onboarding/CVCleanupStep.tsx`
- `src/components/onboarding/BeforeAfterDiff.tsx`
- `src/components/onboarding/OnboardingDone.tsx`
- `src/components/RequireOnboarding.tsx`
- `src/hooks/useUserCV.ts`

**Edited:**
- `src/App.tsx` — new route + guard around `/app`
- `src/pages/Auth.tsx` — redirect to `/onboarding`
- `supabase/functions/ai-assist/index.ts` — add `cv_assessment` + `cv_cleanup` modes
- `src/components/CVView.tsx` — small "Re-run onboarding" link
- `src/pages/AppPage.tsx` — soft banner for legacy users without CV record

No changes to: jobStore, Kanban, JobDetailPanel, InterviewCoach, CVTailorModal, DayBeforeBootcamp, payments, stages.

---

## Build order

1. Migration (`user_cvs` + `job_applications` columns) — types regenerate after this.
2. `useUserCV` hook + `RequireOnboarding` guard (still routes to a stub page).
3. Edge function: `cv_assessment` + `cv_cleanup` modes; verify with curl.
4. `Onboarding.tsx` shell + `CVUploadStep` (reuses existing upload logic).
5. `CVAssessmentStep` with streaming + score ring.
6. `CVCleanupStep` + `BeforeAfterDiff` + `OnboardingDone`.
7. Auth redirect + AppPage soft-banner + CVView link.
8. QA pass: new user, returning user with CV, returning user without CV.

---

## Three small decisions before I start

1. **Streaming vs structured for assessment:** Two clean options.
   (a) Single `cv_assessment` tool-call → returns score + markdown as one object (simpler, no SSE).
   (b) Streamed prose via existing `useRuthlessReview` + a second non-streamed call to extract just the score/structured fields (richer UX, two AI calls).
   My recommendation: **(a)** — one call, faster, cheaper, and the markdown still streams fine through the model's tool output if we render progressively. Pick (b) if you want the dramatic "watch the roast appear word by word" moment.
2. **Cleanup granularity:** Per-section accept/reject (summary, each bullet, each skill group) vs. all-or-nothing. Per-section is more work but matches your "edit inline" requirement. I'm planning per-section unless you say otherwise.
3. **Force vs. nudge for legacy users with jobs:** I'm proposing soft banner (don't block the board). Confirm or switch to hard gate.

Approve and pick (1) / (2) / (3) and I'll start with the migration.
