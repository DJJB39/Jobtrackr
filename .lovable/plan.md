

## Path to 9/10+: Seven High-Impact Improvements

### 1. Fix Light Mode Theming (2 credits)

**Problem:** Light mode is broken in 3 places -- brand identity lost (gold -> navy), dashboard tooltips invisible, AI panel markdown unreadable.

**Changes:**

**A. `src/index.css` -- Restore gold accent in light mode**
- Change `.light` `--primary` from `222 47% 11%` to `36 80% 40%` (darker gold that works on white)
- Change `.light` `--accent` to match
- Change `.light` `--ring` to match
- Adjust `--primary-foreground` to white for contrast

**B. `src/components/Dashboard.tsx` -- Use CSS variables for tooltip**
- Replace hardcoded `tooltipStyle.background` with `"hsl(var(--card))"` and `color` with `"hsl(var(--foreground))"`
- Replace hardcoded border color with `"hsl(var(--border))"`

**C. `src/components/AIAssistPanel.tsx` -- Fix prose class**
- Line 167: Change `prose-invert` to `dark:prose-invert` so markdown renders correctly in both themes

---

### 2. Deep Search in Command Palette (1 credit)

**Problem:** Cmd+K only searches the visible text of each CommandItem. Searching "React" won't find jobs where React appears only in description or notes.

**Changes in `src/components/CommandPalette.tsx`:**
- Add a `value` prop to each `CommandItem` that concatenates `company + role + notes + description + location + salary`
- This gives `cmdk`'s built-in filter access to all fields without changing the visual display
- Example: `<CommandItem value={[job.company, job.role, job.notes, job.description, job.location].filter(Boolean).join(" ")}>`

---

### 3. Fix Onboarding Sample Data Quality (1 credit)

**Problem:** All 3 seed jobs use `applicationType: "Other"`, making the type filter useless during first impression. Also no events seeded.

**Changes in `src/hooks/useOnboarding.tsx`:**
- Change Acme Corp to `applicationType: "Frontend"`
- Change TechCo to `applicationType: "Full Stack"`
- Change StartupXYZ to `applicationType: "Full Stack"`
- Add one sample event (interview) to the StartupXYZ job so the Calendar view isn't empty for new users -- this requires calling `updateJob` after creation to add the event

---

### 4. Undo Delete with Toast Action (2 credits)

**Problem:** Deleting a job is permanent and immediate. No recovery option.

**Changes:**

**A. `src/hooks/useJobs.tsx` -- Implement soft-delete with undo window**
- In `deleteJob`: instead of immediately deleting from Supabase, remove from local state and store the deleted job in a ref
- Show a toast with a `action` button ("Undo") that re-inserts the job
- Set a 5-second timeout; if no undo, execute the actual Supabase delete
- If undo clicked, restore the job to local state and cancel the timeout

**B. `src/components/ui/use-toast.ts`** -- Already supports `action` prop via shadcn, so no changes needed there

---

### 5. Google OAuth Sign-In (3 credits)

**Problem:** Email-only auth creates friction. Every competitor offers Google sign-in.

**Changes:**

**A. Enable Google OAuth provider** via Lovable Cloud auth settings

**B. `src/pages/Auth.tsx`:**
- Add a "Continue with Google" button above the email form
- Use `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/app' } })`
- Add a visual divider ("or") between OAuth and email form
- Style the Google button with the standard Google icon and white background

**C. `src/pages/Landing.tsx`:**
- Update hero CTA to mention "Sign up with Google or email"

---

### 6. Activity Timeline in Job Detail (4 credits)

**Problem:** No history of stage changes, edits, or event outcomes. Users can't reconstruct their application journey.

**Changes:**

**A. Database migration** -- Create `job_activity_log` table:
```sql
create table public.job_activity_log (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.job_applications(id) on delete cascade,
  user_id uuid not null,
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);
alter table public.job_activity_log enable row level security;
create policy "Users see own logs" on public.job_activity_log
  for select using (auth.uid() = user_id);
create policy "Users insert own logs" on public.job_activity_log
  for insert with check (auth.uid() = user_id);
```

**B. `src/hooks/useJobs.tsx`:**
- In `updateJob`, detect what changed (stage, notes, contacts, etc.) and insert a log entry
- Key events to log: stage change, notes edited, contact added/removed, event added, link added

**C. `src/components/JobDetailPanel.tsx`:**
- Add a new "Activity" section at the bottom of the left column
- Fetch activity log for the current job using a simple `supabase.from('job_activity_log').select('*').eq('job_id', job.id).order('created_at', { ascending: false }).limit(20)`
- Render as a vertical timeline with icons per action type, relative timestamps ("2 hours ago"), and brief descriptions

---

### 7. Resume Upload and ATS Match Score (7 credits)

**Problem:** Huntr/Teal's biggest differentiator is resume analysis. JobTrackr generates cover letters but can't analyze or tailor resumes.

**Changes:**

**A. Storage bucket** -- Create a `resumes` storage bucket with RLS allowing users to upload/read their own files

**B. Database migration:**
```sql
alter table public.job_applications
  add column resume_url text,
  add column ats_score integer;
```

**C. New edge function `supabase/functions/analyze-resume/index.ts`:**
- Accepts `resume_text` (extracted client-side from PDF) and `job_description`
- Uses Lovable AI (gemini-3-flash-preview) with tool calling to return structured output:
  - `ats_score` (0-100)
  - `matching_keywords` (array of strings found in both)
  - `missing_keywords` (array of strings in JD but not resume)
  - `suggestions` (array of actionable improvement tips)
- Uses tool_choice to force structured JSON output

**D. New component `src/components/ResumeAnalysis.tsx`:**
- Upload dropzone for PDF (max 5MB)
- Client-side PDF text extraction using a lightweight library or the File API
- Displays: circular ATS score gauge, keyword match list (green for matching, red for missing), suggestion cards
- "Re-analyze" button to run against updated resume

**E. Integration in `src/components/JobDetailPanel.tsx`:**
- Add a "Resume Match" tab or section in the right column, below Quick Info
- Show the ATS score as a colored badge (green >= 80, amber >= 60, red < 60)
- Button to open full ResumeAnalysis panel

**F. `src/pages/AppPage.tsx` or `src/components/AIAssistPanel.tsx`:**
- Add a "Tailor Resume" mode that takes the resume + JD and generates a tailored version with keyword suggestions highlighted

**Gotchas:**
- PDF parsing on the client can be tricky; consider using `pdf.js` worker or a simpler approach of letting users paste resume text
- Storage bucket RLS: `(bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])`
- ATS scoring is inherently approximate; add a disclaimer

---

### Credit Summary

| Improvement | Credits | Impact |
|---|---|---|
| Fix Light Mode Theming | 2 | Visual polish across themes |
| Deep Search in Command Palette | 1 | Power user productivity |
| Fix Onboarding Sample Data | 1 | First impression quality |
| Undo Delete with Toast Action | 2 | Data safety, UX trust |
| Google OAuth Sign-In | 3 | Signup conversion rate |
| Activity Timeline | 4 | Application journey tracking |
| Resume Upload and ATS Score | 7 | Competitive parity with Huntr/Teal |
| **Total** | **20** | |

### Priority Order

Implement in this order to maximize value at each step:
1. Fix Light Mode (immediate visual fix)
2. Onboarding Data Quality (quick win)
3. Deep Search (quick win)
4. Undo Delete (safety net)
5. Google OAuth (conversion)
6. Activity Timeline (stickiness)
7. Resume/ATS Analysis (differentiation)

