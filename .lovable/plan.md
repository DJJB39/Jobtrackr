

## Mobile Header Declutter — 4 Targeted Changes

All changes are CSS-only responsive visibility toggles. No logic or layout restructuring. Desktop remains unchanged.

### 1. Hide logo icon on mobile (AppHeader.tsx, line 63)
Change `<div className="relative">` to `<div className="relative hidden sm:block">`.

### 2. Hide logo icon on mobile (Landing.tsx, line 142)
Change `<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-glow">` to `<div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-glow">`.

### 3. Hide duplicate AI Studio button on mobile (AppHeader.tsx, line 157)
Change `className="gap-2 border-primary/30 ..."` to `className="hidden sm:flex gap-2 border-primary/30 ..."`.

### 4. Hide "applications tracked" subtitle on mobile (AppHeader.tsx, line 70)
Add `hidden sm:block` to the `<p>` tag.

**Files modified:** `src/components/layout/AppHeader.tsx` (3 changes), `src/pages/Landing.tsx` (1 change).

