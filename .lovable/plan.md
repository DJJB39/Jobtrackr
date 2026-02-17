

# Polish Ruthless Review: Intensity Levels, Disclaimer, Update Button, Checklist Styling, Copy Checklist

## Overview

Four changes across two files to add intensity selection, nuclear disclaimer, better checklist visibility, and a "Copy Checklist Only" button.

---

## 1. Edge Function -- Intensity-aware prompts

**File:** `supabase/functions/ai-assist/index.ts`

Replace the single `ruthless_review` string with a map of 4 intensity levels. Each shares the same markdown structure and ends with the Immediate Action Checklist instruction. Tone varies:

- **soft**: Direct and constructive, balanced feedback, includes encouragement
- **medium**: Honest and critical, some sarcasm, no insults
- **hard**: Current savage prompt (unchanged behavior)
- **nuclear**: Full assassin -- mean, rude, insulting, tears it apart

Update request parsing (~line 81) to read `intensity` from the body, defaulting to `"hard"`. Resolve the prompt via `RUTHLESS_PROMPTS[intensity]` when mode is `ruthless_review`.

## 2. Frontend -- Intensity selector + Nuclear disclaimer + Update button

**File:** `src/components/CVView.tsx`

Add state: `ruthlessIntensity` (`"soft" | "medium" | "hard" | "nuclear"`, default `"hard"`).

Below the "Ruthless Review" button (lines 253-268), add:
- A row of 4 small toggle buttons: Soft (green), Medium (amber), Hard (red), Nuclear (purple)
- When Nuclear is selected, show a small warning: "Nuclear mode contains harsh language -- proceed at your own risk"
- An "Update Roast" button (outline, sm) that calls `startRuthlessReview`, disabled when loading

Pass `intensity` in the fetch body of `startRuthlessReview` (line 190-194).

## 3. Frontend -- Wider Sheet + Disclaimer in header

**File:** `src/components/CVView.tsx`

- Change `SheetContent` class from `sm:max-w-lg` to `sm:max-w-2xl` (line 429)
- When intensity is `"nuclear"`, add a small muted disclaimer below the SheetTitle

## 4. Frontend -- Enhanced checklist styling + Copy Checklist Only

**File:** `src/components/CVView.tsx`

- Add a `components` prop to `ReactMarkdown` (line 438) that:
  - Renders `h2` elements containing "Checklist" with `bg-destructive/10 border-l-4 border-destructive px-3 py-2 rounded font-bold text-destructive`
  - Renders `li` elements with `font-semibold mb-3`

- Add a "Copy Checklist Only" button in SheetFooter (after existing Copy button) that extracts text after `## Immediate Action Checklist` and copies just that portion

## Technical Summary

| File | Changes |
|------|---------|
| `supabase/functions/ai-assist/index.ts` | Replace single prompt with 4 intensity prompts; read `intensity` from request body |
| `src/components/CVView.tsx` | Add intensity state + 4-button selector; nuclear disclaimer; "Update Roast" button; widen Sheet to `sm:max-w-2xl`; styled `ReactMarkdown` components for checklist; "Copy Checklist Only" button |

No new dependencies required.

