

# Phase 3: Power Features + CV Upload

Phases 1 and 2 are complete. This phase covers the remaining plan items: CV Upload with Suitability Review, enhanced AI integration, salary filtering, and bulk actions.

---

## 3a. CV Upload, Storage, and Suitability Review

### New file: `src/components/CVUploadSection.tsx`
- Drag-and-drop PDF upload area (max 5MB, client-side validation)
- Uploads to `{user_id}/cv-latest.pdf` in the existing private `resumes` bucket (RLS already configured)
- Shows current CV status: filename, upload date, download button, delete button
- Uses `pdfjs-dist` on the client to extract text from the PDF after upload
- Stores extracted text in localStorage cache keyed by user ID (avoids re-parsing)

### New file: `src/components/detail/DetailCVTab.tsx`
- 4th tab in `JobDetailPanel` labeled "CV"
- Shows `CVUploadSection` at the top
- Below it: "Review Suitability" button that sends CV text + job description to the AI
- Displays suitability results inline: score (0-100 with color-coded ring), strengths, gaps, and suggestions
- Uses the existing streaming pattern from `AIAssistPanel` but with structured tool-calling output

### Edit: `src/components/JobDetailPanel.tsx`
- Add 4th tab "CV" with `FileUp` icon to the TabsList (change grid-cols-3 to grid-cols-4)
- Import and render `DetailCVTab`

### Edit: `supabase/functions/ai-assist/index.ts`
- Add `cv_suitability` mode with system prompt: "Compare this CV against the job description. Return a suitability score (0-100), key strengths, gaps, and suggestions."
- For this mode, use tool calling (structured output) instead of streaming, similar to `analyze-resume`
- Accept `cvText` field in the request body
- For existing modes (cover_letter, interview_prep, summarize): if `cvText` is provided, append it to the job context so AI can reference the candidate's actual experience

### Edit: `src/components/AIAssistPanel.tsx`
- Before generating, check if user has a CV uploaded (fetch from storage)
- If CV exists, extract text and include it in the request body as `cvText`
- This enriches cover letters and interview prep with real candidate background

---

## 3b. Salary Filtering and Sorting

### Edit: `src/components/ListView.tsx`
- Salary column already exists and is sortable (string sort)
- Enhance: parse numeric salary values for proper numeric sorting (extract numbers from salary strings like "$80k-$100k")

### Edit: `src/pages/AppPage.tsx`
- Add a salary filter dropdown in the header (optional: "Any", "$0-50k", "$50-100k", "$100-150k", "$150k+")
- Filter applies to all views

---

## 3c. Bulk Actions Enhancement

### Edit: `src/components/KanbanBoard.tsx`
- Already has multi-select and `BulkActionBar` integration
- Add keyboard shortcut: Ctrl/Cmd+A to select all visible cards
- Add "Select All" checkbox in column headers

### Edit: `src/components/BulkActionBar.tsx`
- Already has Move Stage and Delete bulk actions
- Confirm these work correctly with the updated visual overhaul

---

## Technical Details

**Dependencies to add:**
- `pdfjs-dist` -- for client-side PDF text extraction

**Storage:** The `resumes` bucket already exists with full RLS policies (SELECT, INSERT, UPDATE, DELETE) scoped to `auth.uid()`. No migration needed.

**Edge function deployment:** The `ai-assist` function will be redeployed after adding the `cv_suitability` mode.

**File changes summary:**
| File | Action |
|------|--------|
| `src/components/CVUploadSection.tsx` | Create |
| `src/components/detail/DetailCVTab.tsx` | Create |
| `src/components/JobDetailPanel.tsx` | Edit (add 4th tab) |
| `supabase/functions/ai-assist/index.ts` | Edit (add cv_suitability mode + cvText context) |
| `src/components/AIAssistPanel.tsx` | Edit (auto-include CV text) |
| `src/components/ListView.tsx` | Edit (numeric salary sort) |
| `src/pages/AppPage.tsx` | Edit (salary filter) |
| `package.json` | Edit (add pdfjs-dist) |

**Estimated credits:** 3-5

