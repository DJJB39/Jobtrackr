

# Add AI Studio View and Surface AI Features

## Overview
Create an "AI Studio" view as a new tab in the app, redesign the empty state with quick-start cards, add an AI sparkle button to Kanban card hover actions, and add a persistent AI Studio button in the header.

## Changes

### 1. Update View type and VIEW_ITEMS in AppHeader
**File: `src/components/layout/AppHeader.tsx`**
- Expand `View` type to include `"ai"`
- Add `{ key: "ai", icon: Sparkles, label: "AI Studio" }` to `VIEW_ITEMS`
- Import `Sparkles` from lucide-react
- Add an "AI Studio" button next to the Add Job button (before `data-tour="add-button"` div), visible in non-demo mode

### 2. Create AIStudioView component
**File: `src/components/AIStudioView.tsx`** (new)
- Full-width padded container matching Dashboard style
- Heading "AI Studio" + subtext "Your career toolkit — powered by AI"
- 6-card grid (2 cols mobile, 3 desktop) using existing glassmorphism classes (`rounded-xl border border-border glass p-6 glow-hover`)
- Cards: Interview Coach (Mic/red-500), CV Roast (Flame/amber-500), CV Tailor (FileText/emerald-500), Cover Letter (Sparkles/primary), Interview Bootcamp (CalendarCheck/blue-500), Screenshot Capture (Camera/purple-500)
- Cards 1, 3, 4, 5 include a job selector `<Select>` dropdown listing jobs as "Company — Role"
- Card actions: open respective modals via callback props, CV Roast navigates to CV view, Screenshot opens modal directly
- Below grid: usage indicator with Progress bar from `useAIPreferences` matching AISettings style

Props interface:
```typescript
interface AIStudioViewProps {
  jobs: JobApplication[];
  onOpenCoach: (job: JobApplication) => void;
  onOpenBootcamp: (job: JobApplication) => void;
  onOpenTailor: (job: JobApplication) => void;
  onOpenAI: (job: JobApplication) => void;
  onOpenScreenshot: () => void;
  onSwitchToCV: () => void;
}
```

### 3. Wire AI Studio view in AppPage
**File: `src/pages/AppPage.tsx`**
- Import `AIStudioView` and `Sparkles`
- Add `view === "ai"` branch in the view rendering section with the specified props
- The `else` fallback (CalendarView) needs adjusting since "ai" is now a possible view

### 4. Redesign empty state in AppPage
**File: `src/pages/AppPage.tsx`**
- Change heading to "Welcome to JobTrackr"
- Change subtext to "Start by adding a job, or explore what AI can do for your career"
- Below the main CTA button, add 3 compact glass cards in a flex row:
  - Camera + "Screenshot a job listing" → `setScreenshotOpen(true)`
  - Flame + "Roast your CV first" → `setView("cv")`
  - Upload + "Import from CSV" → `setImportOpen(true)`

### 5. Add AI sparkle to JobCard hover
**File: `src/components/JobCard.tsx`**
- Import `Sparkles` from lucide-react
- Add a Sparkles button in the hover actions bar (before the delete AlertDialog)
- onClick calls `onClick?.(job)` to open the detail panel (same as clicking the card)
- Tooltip text: "AI Tools" (use `title` attribute to keep it simple without adding Tooltip dependency)

### 6. Add persistent AI Studio button in header
**File: `src/components/layout/AppHeader.tsx`**
- Before the `data-tour="add-button"` div, add:
```tsx
<Button variant="outline" size="sm" className="gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50" onClick={() => setView("ai")}>
  <Sparkles className="h-4 w-4" />
  <span className="hidden sm:inline">AI Studio</span>
</Button>
```
- Only show in non-demo mode (or show in both — user didn't specify hiding it in demo)

## Files Changed

| File | Action |
|------|--------|
| `src/components/layout/AppHeader.tsx` | Edit — add "ai" to View type, VIEW_ITEMS, Sparkles import, AI Studio button |
| `src/components/AIStudioView.tsx` | Create — 6-card AI tool grid with job selectors and usage indicator |
| `src/pages/AppPage.tsx` | Edit — wire AI Studio view, redesign empty state with quick-start cards |
| `src/components/JobCard.tsx` | Edit — add Sparkles button to hover actions |

