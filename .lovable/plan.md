

# Career Boost Journey: Light Version

## Overview

Three interconnected changes creating a guided "Career Boost" flow:
1. Auto-trigger ruthless review on fresh CV upload
2. "Boost match" CTA banner on job cards linking to CV tab
3. AI generation collapsible section directly in CV view

---

## 1. CVUploadSection.tsx -- Signal fresh upload vs cache

**Change callback signature:**
- `onCVTextReady?: (text: string | null, isNewUpload?: boolean) => void`
- In `handleFile` (line ~77): call `onCVTextReady?.(text, true)`
- In cached `useEffect` (line ~58): call `onCVTextReady?.(cached || null, false)`

---

## 2. CVView.tsx -- Auto-trigger ruthless review + AI generation section

### Auto-roast on upload
- Add state: `autoRoast` initialized from `localStorage.getItem("auto_roast_new_uploads") !== "false"` (default true)
- Update `handleCVText` to accept `(text, isNewUpload?)`:
  - If `isNewUpload && text && autoRoast && !ruthlessText`: set intensity to "hard", skip cooldown, call `startRuthlessReview`
- Modify `startRuthlessReview` to accept optional `skipCooldown?: boolean` parameter -- when true, skip the cooldown set/check logic
- Add auto-roast toggle UI near the intensity selector:
  - `Switch` + label "Auto-roast new uploads"
  - Tooltip text explaining the feature
  - Persists to `localStorage` key `auto_roast_new_uploads`

### AI generation collapsible section (after Section 3, before empty states ~line 466)
- New state: `genMode` (cover_letter | interview_prep | summarize | null), `genJobId`, `genContent`, `genLoading`
- Uses Radix `Collapsible` component (already installed)
- Title: "Career Boost: Generate Materials for Selected Job" with Sparkles icon
- Only rendered when `cvText` is non-null
- Inside:
  - Job selector dropdown using `Select` component, populated from `activeJobs` (company + role), pre-selects most recently added job (sorted by `createdAt` desc)
  - Three buttons in a row: Cover Letter, Interview Prep, Summary
  - On click: POST to `AI_URL` with selected job data + `cvText`, stream SSE response (reuse exact same streaming pattern from `startRuthlessReview`)
  - Inline `ReactMarkdown` rendering of streamed content
  - Copy button for generated content

---

## 3. JobCard.tsx -- "Boost match" CTA banner

- Add new props: `onNavigateToCV?: () => void`, `cardIndex?: number`
- After the progress bar (around line 213), add conditional banner:
  - Show if: `cvScore === null` AND `localStorage` has `cv-text-{userId}` (checked via existing `useEffect`)
  - Content: Flame icon + "Boost match -- Get CV Review"
  - Styling: subtle amber/orange pill, small text, `opacity` fades after `cardIndex > 5` (e.g., `opacity: cardIndex > 5 ? 0.5 : 1`)
  - On click: `e.stopPropagation(); onNavigateToCV?.()`
- Add state `hasStoredCV` derived from localStorage check in the existing `useEffect`

---

## 4. Threading onSwitchView prop

### KanbanBoard.tsx
- Add `onSwitchView?: (view: string) => void` to `KanbanBoardProps`
- Pass to each `JobCard` (both mobile and desktop renders):
  - `onNavigateToCV={() => onSwitchView?.("cv")}`
  - `cardIndex={index}` (from `.map` callback)

### AppPage.tsx
- Line 312: Pass `onSwitchView={setView}` to `KanbanBoard`:
```
<KanbanBoard jobs={...} setJobs={setJobs} onUpdateJob={updateJob} onDeleteJob={deleteJob} onSwitchView={setView} />
```

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/CVUploadSection.tsx` | Add `isNewUpload` boolean to callback |
| `src/components/CVView.tsx` | Auto-trigger ruthless review on upload; auto-roast toggle; collapsible AI generation section with job selector, 3 gen buttons, streaming markdown, copy |
| `src/components/JobCard.tsx` | Add amber "Boost match" CTA pill with Flame icon; `onNavigateToCV` + `cardIndex` props; opacity fade after index 5 |
| `src/components/KanbanBoard.tsx` | Accept `onSwitchView` prop; pass `onNavigateToCV` and `cardIndex` to each JobCard |
| `src/pages/AppPage.tsx` | Pass `setView` as `onSwitchView` to KanbanBoard |

