

# Enhanced Demo Mode: CV Roast Showcase

## Overview

Create the demo CV experience with simulated uploads, pre-written roasts at 4 intensity levels, fake suitability scores with before/after jumps, and sign-up teasers. No API calls or persistence.

---

## New Files

### 1. `src/lib/demo-cv-data.ts`

All hardcoded demo constants:

- **DEMO_CV_TEXT**: ~500-word generic software engineer CV (plain text)
- **DEMO_ROASTS**: Object keyed by intensity (`soft`, `medium`, `hard`, `nuclear`):
  - `nuclear`: Extra savage 3/10 roast with full markdown (Score, Strengths (if any), Fatal Flaws, How to Fix It, ## Immediate Action Checklist with 6-8 items). Condescending, insulting, mean language.
  - `hard`: 4/10, savage but less personal insults
  - `medium`: 5/10, critical with sarcasm, no insults
  - `soft`: 6/10, constructive and balanced, includes encouragement
- **DEMO_SUITABILITY**: Pre-computed scores keyed by demo job ID (e.g., `demo-1: 72`, `demo-4: 32`, etc.)
- **DEMO_PROJECTED_SCORES**: Post-roast projected scores (e.g., `demo-1: 89`, `demo-4: 78`)

### 2. `src/components/DemoCVView.tsx`

Self-contained demo CV view -- no API calls, no Supabase imports.

**Structure:**

- **Banner at top**: "In real mode, upload your CV and get a personalised savage roast" with sign-up CTA
- **Simulated upload zone**: Styled like CVUploadSection but clicking it instantly loads `DEMO_CV_TEXT` into state with a brief animation. Shows green checkmark + "sample-cv.pdf" after "upload"
- **Intensity selector**: Same 4-button row (Soft/Medium/Hard/Nuclear) with nuclear disclaimer, identical styling to CVView
- **Ruthless Review button**: On click, sets loading state for 3-5s (`setTimeout`), then displays matching `DEMO_ROASTS[intensity]`
- **Update Roast button**: Swaps to different pre-written roast instantly (no loading after first)
- **Results Sheet**: Same layout as CVView (sm:max-w-2xl, SheetHeader, ScrollArea with ReactMarkdown using `markdownComponents`, SheetFooter with Copy + Copy Checklist Only). Copy buttons work on mock text
- **Banner after roast**: "Sign up to roast your real CV and track improvements" with CTA button
- **Banner hint after first roast**: "Want it harsher? Switch to Nuclear and hit Update Roast"
- **No cooldown** in demo mode

**Job Suitability Grid:**

- Shows demo jobs with fake scores from `DEMO_SUITABILITY`
- Initially shows "Current CV match: 32%" (or appropriate score)
- After mock roast completes, updates display to show both: "Current: 32%" and "Projected after fixes: 78%" with a green arrow up indicator
- Tooltip on projected score: "Sign up to see real improvements"

---

## Modified Files

### 3. `src/pages/DemoPage.tsx`

- Add `"cv"` to `View` type union
- Import `FileUp` icon from lucide-react and `DemoCVView` component
- Add `{ key: "cv", icon: FileUp, label: "CV" }` to both desktop and mobile view switcher arrays (with `data-tour="cv-tab"` attribute)
- Add `view === "cv"` render branch for `<DemoCVView jobs={jobs} />`
- Wrap `addJob`, `updateJob`, `deleteJob` to also fire toast: "Demo mode -- nothing saved. Sign up to keep your data."

### 4. `src/hooks/useOnboardingTour.tsx`

Update the existing tour step at index 3 (view-switcher) description to mention CV, and add a new 6th step:

```
{
  target: "cv-tab",
  title: "Get Your CV Brutally Roasted",
  description: "Upload CV, get savage roast + fix checklist (demo shows sample)."
}
```

---

## Technical Summary

| File | Action |
|------|--------|
| `src/lib/demo-cv-data.ts` | New -- hardcoded CV, 4 roasts, suitability + projected scores |
| `src/components/DemoCVView.tsx` | New -- full demo CV view with simulated upload, roast, suitability, before/after scores, banners |
| `src/pages/DemoPage.tsx` | Add CV to view switcher, render DemoCVView, demo save toasts |
| `src/hooks/useOnboardingTour.tsx` | Add 6th tour step for CV tab |

No API calls, no Supabase writes, no new dependencies.
