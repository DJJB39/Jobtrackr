

# Move CV Upload to Top-Level View

## The Problem
CV upload is currently hidden inside the job detail panel's 4th tab. The user wants it as a main navigation tab so the CV is a first-class, always-accessible feature -- upload once, then review against any job.

## Changes

### 1. New file: `src/components/CVView.tsx`
A full-page CV management view that includes:
- The existing `CVUploadSection` component at the top (drag-and-drop upload, status, download/delete)
- A "Review Against Jobs" section below showing all tracked jobs as selectable cards
- Click any job card to run a suitability review (CV text vs. that job's description)
- Results display inline below the selected job: score ring, strengths, gaps, suggestions
- Reuses the existing AI suitability logic from `DetailCVTab`

### 2. Edit: `src/pages/AppPage.tsx`
- Add "CV" as a 5th view option: `type View = "board" | "dashboard" | "calendar" | "list" | "cv"`
- Add to `VIEW_ITEMS` array with `FileUp` icon and "CV" label
- Render `CVView` when `view === "cv"`, passing `jobs` and `onSelectJob`

### 3. Edit: `src/components/JobDetailPanel.tsx`
- Keep the CV tab in the detail panel but simplify it -- show CV status (uploaded/not) and a quick "Review Suitability" button that uses the already-uploaded master CV
- The upload itself is now managed from the top-level CV view

### 4. Edit: `src/components/JobCard.tsx` (optional enhancement)
- If a CV is uploaded and suitability has been reviewed for a job, show a small score badge on the Kanban card (e.g., a tiny colored dot or number)
- This gives at-a-glance suitability info right on the board

## Architecture

The flow becomes:
1. User goes to CV tab (top-level) and uploads their master CV once
2. CV text is extracted and cached in localStorage (existing logic)
3. From the CV view, user picks any job to review suitability against
4. From the Kanban board, opening a job's detail panel still shows suitability review (using the already-uploaded CV)

## Technical Notes
- `CVUploadSection` component is reused as-is in the new view
- Suitability review logic is extracted from `DetailCVTab` into a shared helper or kept inline
- No new dependencies or database changes needed
- The `CVView` component receives `jobs` array to render the job selection grid
