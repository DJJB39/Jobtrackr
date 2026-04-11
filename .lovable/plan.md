

# Update Demo Page to Match Product Features

## Overview
The demo page is significantly behind the real app. It's missing the refined header, AI features (Coach, Bootcamp, CV Tailor), Screenshot Capture, CSV Import, and the polished animations. This plan brings it to parity while keeping everything in guest/demo mode (no auth, no persistence, demo toasts on actions).

## Changes

### 1. Replace inline header with AppHeader (adapted for demo)
- Create `src/components/layout/DemoAppHeader.tsx` — a variant of `AppHeader` that replaces `UserMenu` with a "Sign Up" button and "Back to Home" link, removes `ShareStats`, but keeps Import/Screenshot/Export buttons and the animated view switcher with `motion.div layoutId`.
- Alternatively, make `AppHeader` accept an optional `isDemo` prop to swap out auth-dependent elements. This is cleaner.

### 2. Wire missing modals and panels in DemoPage
- Add state for: `aiPanelOpen`, `coachOpen`, `bootcampOpen`, `tailorOpen`, `importOpen`, `screenshotOpen`
- Import and render: `AIAssistPanel`, `InterviewCoach`, `DayBeforeBootcamp`, `CVTailorModal`, `CSVImportModal`, `ScreenshotCaptureModal`
- Pass `onOpenAI`, `onOpenCoach`, `onOpenBootcamp`, `onOpenTailor` to `JobDetailPanel` so the buttons appear in the detail panel
- These will work partially in demo mode — AI calls will fail (no auth) but the UI will be visible. Show demo toast on failure.

### 3. Add CSV Import support in demo mode
- Wire `CSVImportModal` — on import complete, merge imported jobs into guest mode state via `setJobs`
- The modal's existing logic calls Supabase which won't work without auth. Instead, create a lightweight `onImportComplete` that adds jobs to local state, or show a demo toast explaining sign-up is needed.

### 4. Add Screenshot Capture in demo mode
- Wire `ScreenshotCaptureModal` — same approach: show the UI, but on save attempt show demo toast.

### 5. Add Export CSV in demo mode
- Add export functionality (reuse the same CSV generation logic from AppPage) that actually works — it's client-side only.

### 6. Add empty state + animations
- Add `framer-motion` AnimatePresence and the polished empty state from AppPage
- Add search pulse hint on first visit

### 7. Keep demo banner
- Retain the existing demo banner at top, but style it to match the onboarding banner pattern.

### 8. Update DemoCVView or replace with CVView
- Keep `DemoCVView` as-is since it has the demo roast showcase which is purpose-built for conversion.

## Files Changed

| File | Action |
|------|--------|
| `src/components/layout/AppHeader.tsx` | Add optional `isDemo` prop — swaps UserMenu/ShareStats for Back+SignUp buttons |
| `src/pages/DemoPage.tsx` | Major rewrite — use AppHeader, add all modals/panels, export, animations, empty state |
| `src/hooks/useGuestMode.tsx` | Add `importJobs` method to merge external jobs into local state |

## What stays the same
- `DemoCVView` — unchanged, it's purpose-built for demo conversion
- All AI modals render but gracefully handle missing auth with demo toasts
- No new edge function or DB changes
- Glassmorphism styling preserved

