

# Acquire.com Cleanup — Production Polish

## Overview
Eight cleanup tasks to make the codebase handover-ready. No visual or functional changes.

## Changes

### 1. Environment Variables & Git Hygiene
- **`.gitignore`** — Add `.env`, `.env.*`, and `bun.lockb` entries to the existing file
- **Delete** the stray `gitignore` file (no dot prefix)
- **Delete** `bun.lockb` (binary lockfile, redundant with `package-lock.json`)
- **Create** `.env.example` with placeholder keys:
  ```
  VITE_SUPABASE_PROJECT_ID="your-project-id"
  VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
  VITE_SUPABASE_URL="https://your-project-id.supabase.co"
  ```

### 2. Placeholder URLs → Conditional Rendering
- **`src/lib/constants.ts`** — Set both `FEEDBACK_FORM_URL` and `LOOM_DEMO_URL` to `""`
- **`src/pages/Landing.tsx`** — Wrap the Loom iframe block (lines 169-177) in `{LOOM_DEMO_URL && ...}`. Also conditionally render the footer Feedback button only if `FEEDBACK_FORM_URL` is non-empty.
- **`src/components/UserMenu.tsx`** — Wrap the Feedback `DropdownMenuItem` (line 184-187) in `{FEEDBACK_FORM_URL && ...}`

### 3. Hardcoded Domain in Edge Functions
- **`supabase/functions/weekly-digest/index.ts`** and **`supabase/functions/send-reminders/index.ts`** — Replace the hardcoded `const APP_URL = "https://brs39.lovable.app"` with:
  ```typescript
  const APP_URL = Deno.env.get("APP_URL") || "https://brs39.lovable.app";
  ```

### 4. index.html Cleanup
- Remove the TODO comment on line 5
- Add comments next to hardcoded `brs39.lovable.app` URLs noting they should be updated for production (can't use env vars in static HTML without a build plugin, so comments are the right approach)

### 5. OG Image Placeholder
- Create a minimal 1200×630 placeholder PNG at `public/og-image.png` using a script (solid brand-colored rectangle with "JobTrackr" text)

### 6. Broaden APPLICATION_TYPES
- **`src/types/job.ts`** — Replace the current 6-item array with:
  ```typescript
  export const APPLICATION_TYPES = [
    "Engineering", "Design", "Product", "Marketing", "Sales",
    "Finance", "Operations", "HR & People", "Legal", "Healthcare",
    "Education", "Creative", "Data & Analytics", "Consulting", "Other",
  ] as const;
  ```

### 7. AppPage Refactor — Extract AppHeader
- **Create** `src/components/layout/AppHeader.tsx` — Extract lines 197-323 (the entire `<header>` block) into a new component accepting props: `jobs`, `searchQuery`, `setSearchQuery`, `view`, `setView`, `searchPulse`, `isMac`, `onImport`, `onScreenshot`, `onExport`, `onAddJob`, `dialogOpen`, `onDialogOpenChange`
- **Simplify** `AppPage.tsx` to import and use `<AppHeader />`, targeting under 250 lines

### 8. Lockfile Cleanup
- Delete `bun.lockb` and `bun.lock` (keep only `package-lock.json`)

## Files Changed Summary

| File | Action |
|------|--------|
| `.gitignore` | Edit — add `.env` entries |
| `gitignore` (no dot) | Delete |
| `bun.lockb` | Delete |
| `bun.lock` | Delete |
| `.env.example` | Create |
| `src/lib/constants.ts` | Edit — empty strings |
| `src/pages/Landing.tsx` | Edit — conditional rendering |
| `src/components/UserMenu.tsx` | Edit — conditional feedback item |
| `supabase/functions/weekly-digest/index.ts` | Edit — env-based APP_URL |
| `supabase/functions/send-reminders/index.ts` | Edit — env-based APP_URL |
| `index.html` | Edit — remove TODO, add comments |
| `public/og-image.png` | Create — placeholder |
| `src/types/job.ts` | Edit — expanded types |
| `src/components/layout/AppHeader.tsx` | Create |
| `src/pages/AppPage.tsx` | Edit — use AppHeader |

