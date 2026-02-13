

# Updated Master Plan: JobTrackr Supreme Overhaul

This is the full revised plan with the **CV Upload and Suitability Review** feature integrated into Phase 3. All five phases are listed with updated credit estimates.

---

## Phase 1: Bug Fixes and Code Quality (3-4 credits)

- Debounce all save operations (already partially done in JobDetailPanel, extend to other areas)
- Fix drag-and-drop dead zones and reliability issues on KanbanBoard
- Refactor `useJobs` hook to reduce complexity
- Break up any remaining monolithic components
- Remove type hacks (`as any`, etc.)

**Files**: `src/hooks/useJobs.tsx`, `src/components/KanbanBoard.tsx`, `src/components/KanbanColumn.tsx`, `src/components/JobCard.tsx`

---

## Phase 2: Visual Overhaul and Premium Aesthetic (6-8 credits)

- Install `framer-motion` for micro-animations (card transitions, panel slides, hover effects)
- Add Satoshi + JetBrains Mono fonts for a modern premium feel
- Glassmorphism cards with subtle blur, border glow, gradient accents
- Density toggle on Kanban board (compact / comfortable / spacious)
- Dashboard 2.0: conversion funnel chart, time-in-stage metrics, ghost detection alerts, stale application warnings
- Interactive calendar with drag-to-reschedule events
- Polished loading states, skeleton screens, empty states with illustrations
- Landing page overhaul: interactive demo, competitor comparison table, pricing/FAQ section

**Files**: `src/index.css`, `tailwind.config.ts`, `src/components/Dashboard.tsx`, `src/components/KanbanBoard.tsx`, `src/components/KanbanColumn.tsx`, `src/components/JobCard.tsx`, `src/components/CalendarView.tsx`, `src/pages/Landing.tsx`, plus new animation wrapper components

---

## Phase 3: Power Features + CV Upload (8-10 credits)

### 3a. AI Resume Tailor with Side-by-Side Diff (2-3 credits)
- Enhance the existing `ResumeAnalysis` component with before/after comparison view
- Show keyword insertion suggestions inline

### 3b. CV Upload, Storage, and Suitability Review (3-5 credits) -- NEW

**Goal**: Users upload a master CV once. It becomes available across all AI features and enables per-job suitability reviews.

**Storage**:
- Use the existing `resumes` storage bucket (already created, private)
- Add RLS policies so users can only access their own uploads
- Store files at path `{user_id}/cv-latest.pdf` (overwrite on re-upload, simple versioning)
- 5MB file size limit enforced client-side and via storage policy

**New Components**:
- `src/components/CVUploadSection.tsx` -- Drag-and-drop PDF upload area with progress indicator, shows current CV filename + upload date + download button. Placed in a new "CV" tab in the Detail Panel (4th tab) or as a dedicated section in the app sidebar/user menu.
- Integrate into `DetailLinksTab.tsx` or create a new 4th tab `DetailCVTab.tsx` in the job detail panel

**PDF Text Extraction**:
- Use the existing `analyze-resume` edge function pattern
- Upload PDF to storage, then in the edge function: fetch the PDF from storage and extract text using a lightweight approach (send raw text to AI, or use pdf-parse library in Deno)
- Alternatively, prompt users to paste text (current pattern) but auto-fill from uploaded CV

**Suitability Review (new AI mode)**:
- Add `cv_suitability` mode to `supabase/functions/ai-assist/index.ts`
- System prompt: "Compare this CV against the job description. Return a suitability score (0-100), key strengths that match, gaps/missing qualifications, and 3-5 specific suggestions to improve fit."
- Use tool calling (structured output) like the existing `analyze-resume` function
- Add a "Review Suitability" button in the job detail panel header (next to the AI button) that fetches the user's CV from storage, sends it with the job description to the edge function, and displays results in a modal or inline panel

**Integration with existing AI features**:
- When generating cover letters or interview prep via `ai-assist`, auto-include CV text in the context if a CV is uploaded
- The `AIAssistPanel` component will check for uploaded CV and append it to job context

**File changes**:
- New: `src/components/CVUploadSection.tsx`
- Edit: `src/components/JobDetailPanel.tsx` (add CV tab or suitability button)
- Edit: `supabase/functions/ai-assist/index.ts` (add `cv_suitability` mode, include CV text in other modes)
- New migration: RLS policies for resumes bucket
- Edit: `src/components/AIAssistPanel.tsx` (auto-include CV context)

**Gotchas**:
- PDF parsing in Deno edge functions is limited; best approach is to extract text client-side using `pdfjs-dist` before sending to edge function, or store extracted text alongside the PDF
- File size validation must happen both client-side (before upload) and via storage policies
- The resumes bucket already exists and is private, which is correct

### 3c. Salary Filtering and Sorting (1 credit)
- Add salary range filter to list view and board
- Sort by salary in list view columns

### 3d. Bulk Actions Enhancement (1-2 credits)
- Multi-select with floating action bar
- Keyboard shortcuts for power users

---

## Phase 4: Landing Page and Growth (4-5 credits)

- Interactive product demo tour (guided walkthrough with sample data)
- Competitor comparison table (vs Huntr, Teal, Simplify)
- Real testimonial placeholders with proper attribution structure
- Pricing/FAQ section with free tier details
- SEO meta tags and Open Graph images

**Files**: `src/pages/Landing.tsx`, new `src/components/landing/*` components

---

## Phase 5: Nice-to-Haves for Market Superiority (3-5 credits)

- Gamification: application streaks, milestone badges, weekly goals
- Read-only sharing links for career coaches
- Web Push notifications (in addition to email reminders)
- Chrome extension manifest stub for one-click job capture
- Job market data integration placeholders (Glassdoor-style)

---

## Implementation Order

| Order | Phase | Credits | Priority |
|-------|-------|---------|----------|
| 1 | Phase 1: Bug fixes | 3-4 | Critical |
| 2 | Phase 2: Visual overhaul | 6-8 | High |
| 3 | Phase 3a: AI resume tailor | 2-3 | High |
| 4 | Phase 3b: CV upload + suitability | 3-5 | High |
| 5 | Phase 3c-d: Salary + bulk actions | 2-3 | Medium |
| 6 | Phase 4: Landing + growth | 4-5 | Medium |
| 7 | Phase 5: Nice-to-haves | 3-5 | Lower |

**Total estimated: 24-33 credits** (up to 40 if we push hard on aesthetics and animations in Phase 2)

---

## Technical Notes

- The `resumes` storage bucket already exists and is private -- we just need RLS policies
- PDF text extraction will use `pdfjs-dist` on the client side to extract text before sending to edge functions, avoiding Deno PDF parsing complexity
- The `ai-assist` edge function already supports multiple modes via the `mode` parameter -- adding `cv_suitability` is a clean extension
- CV text will be cached in component state after first extraction to avoid re-parsing on every AI call
- All new components follow existing patterns: shadcn/ui primitives, Tailwind styling, Supabase client for data

