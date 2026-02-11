

## Job URL Auto-Fill / Import -- Final Implementation Plan

Add a "Job Posting URL" field to AddJobDialog that calls a backend function to scrape metadata and pre-fill form fields. Falls back gracefully to manual entry.

---

### Step 1: Database Migration

Add two nullable text columns:

```sql
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS description text;
```

---

### Step 2: Backend Function -- `scrape-job-url`

Create `supabase/functions/scrape-job-url/index.ts`.

- Accepts `POST { url: string }`
- Validates URL (must start with `http://` or `https://`, max 2048 chars)
- Fetches HTML with 5-second `AbortController` timeout and browser-like `User-Agent`
- Extracts metadata via regex:
  - `og:title` --> role
  - `og:site_name` --> company
  - `og:description` or `meta[name="description"]` --> description (capped at 500 chars)
  - JSON-LD `application/ld+json` for `JobPosting` schema: title, hiringOrganization, jobLocation, baseSalary/salaryRange
  - `<title>` fallback with heuristic splitting ("Role at Company | Site")
- Returns `{ success: true, data: { title, company, description, location, salary, url }, partial: boolean }` or `{ success: false, error: string }`
- `partial: true` when only heuristic/fallback parsing was used (no OG tags or JSON-LD found)
- Full CORS headers for browser calls

Key code snippets:

```typescript
// URL validation
const isValidUrl = (url: string) => {
  if (url.length > 2048) return false;
  try { const u = new URL(url); return ['http:', 'https:'].includes(u.protocol); }
  catch { return false; }
};

// Regex helpers
const getMeta = (html: string, prop: string) => {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, 'i'
  );
  return html.match(re)?.[1]?.trim() || null;
};

// JSON-LD extraction
const getJsonLd = (html: string) => {
  const matches = [...html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )];
  for (const m of matches) {
    try {
      const obj = JSON.parse(m[1]);
      if (obj["@type"] === "JobPosting") return obj;
    } catch {}
  }
  return null;
};

// Salary from JSON-LD
const getSalary = (ld: any) => {
  const bs = ld.baseSalary;
  if (!bs?.value) return null;
  const v = bs.value;
  if (v.minValue && v.maxValue)
    return `${bs.currency ?? ''} ${v.minValue}-${v.maxValue}/${v.unitText ?? 'YEAR'}`.trim();
  return String(v);
};

// Title heuristic: "Software Engineer at Google | Careers"
const splitTitle = (title: string) => {
  for (const sep of [' at ', ' @ ', ' - ', ' | ', ' — ']) {
    const idx = title.indexOf(sep);
    if (idx > 0) return {
      role: title.slice(0, idx).trim(),
      company: title.slice(idx + sep.length).split(/[|\-—]/).at(0)?.trim() || null,
    };
  }
  return { role: title, company: null };
};
```

Add to `supabase/config.toml`:
```toml
[functions.scrape-job-url]
verify_jwt = false
```

---

### Step 3: Update Types -- `src/types/job.ts`

Add to `JobApplication` interface:
```typescript
location?: string;
description?: string;
```

---

### Step 4: Update Hook -- `src/hooks/useJobs.tsx`

- `rowToJob`: map `row.location` and `row.description`
- `addJob`: expand signature to accept optional extras `{ location?, description?, links? }`
- `updateJob`: include `location` and `description` in update payload

---

### Step 5: Update AddJobDialog -- `src/components/AddJobDialog.tsx`

Add at the top of the form (before Company):

- "Job Posting URL" input with adjacent "Fetch" button (Link icon, shows Loader2 spinner while loading)
- On Fetch click: call `supabase.functions.invoke('scrape-job-url', { body: { url } })`
- On success: pre-fill company, role, location, description in local state; show success toast ("Job details loaded!"); if response has `partial: true`, toast mentions "Partial data fetched -- review and complete manually"
- After auto-fill, focus the first empty required field (company or role) using refs
- Show subtle "Auto-filled" text badge (text-xs text-muted-foreground) next to fields that were filled; badge disappears when user edits
- On error: destructive toast "Couldn't fetch details -- enter manually"
- On submit: add URL to `links` array; pass location/description through `onAdd`
- Update `onAdd` prop type:
  ```typescript
  onAdd: (company: string, role: string, columnId: ColumnId, applicationType: string,
          extras?: { location?: string; description?: string; links?: string[] }) => void
  ```

---

### Step 6: Update JobDetailPanel -- `src/components/JobDetailPanel.tsx`

After "Application Type" section, add:

- **Location**: Input with MapPin icon, bound to `editedJob.location`
- **Description**: Textarea (max 500 chars, resize-none), bound to `editedJob.description`

Both use the existing `update()` helper and auto-save pattern.

---

### Step 7: Update JobCard -- `src/components/JobCard.tsx`

If `job.location` exists, show below the role line:
```tsx
{job.location && (
  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
    <MapPin className="h-2.5 w-2.5" />
    <span className="truncate">{job.location}</span>
  </div>
)}
```

---

### Step 8: Update CSV Export -- `src/pages/AppPage.tsx`

Add "Location" and "Description" columns to CSV headers and row mapping:
```typescript
const headers = ["Company", "Role", "Stage", "Type", "Created", "Location", "Notes", "Description", "Links"];
// ... add j.location ?? "", (j.description ?? "").slice(0, 100).replace(/"/g, '""')
```

---

### Files Changed Summary

| File | Change |
|------|--------|
| DB migration | Add `location`, `description` columns |
| `supabase/config.toml` | Add `scrape-job-url` config (verify_jwt = false) |
| `supabase/functions/scrape-job-url/index.ts` | New edge function |
| `src/types/job.ts` | Add `location?`, `description?` to JobApplication |
| `src/hooks/useJobs.tsx` | Map new fields, expand `addJob` signature |
| `src/components/AddJobDialog.tsx` | URL input + Fetch + auto-fill + auto-filled badges |
| `src/components/JobDetailPanel.tsx` | Location input + Description textarea |
| `src/components/JobCard.tsx` | Location pill |
| `src/pages/AppPage.tsx` | CSV export columns, pass-through for addJob |

### Gotchas Addressed

- **CORS**: Server-side fetch via edge function
- **Timeouts**: 5s AbortController; graceful error return
- **Site blocking**: Partial data returned; `partial: true` flag informs user
- **JSON-LD salary**: Extracted when `JobPosting` schema present (LinkedIn, Indeed, Greenhouse)
- **Backward compatibility**: All new fields optional/nullable; existing callers unaffected
- **Dark mode**: All new UI uses semantic Tailwind colors (text-foreground, text-muted-foreground, bg-background, border-border)

