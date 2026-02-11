

## Improve scrape-job-url for LinkedIn

Two files to change.

---

### 1. Edge Function (`supabase/functions/scrape-job-url/index.ts`)

**Headers update (lines 111-121):**
- Timeout: 5000 -> 8000
- User-Agent: `"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"`
- Accept: `"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"`
- Add Accept-Language: `"en-GB,en;q=0.9"`

**Aggressive title parsing -- enhance `splitTitle` (lines 83-94):**
- Add "hiring" as a separator (LinkedIn titles often use "hiring" pattern like "Company is hiring a Role in Location")
- Extract location from title when pattern matches (e.g., "... in London, UK")
- Return `{ role, company, location }` instead of just `{ role, company }`

```typescript
const splitTitle = (title: string): { role: string; company: string | null; location: string | null } => {
  // LinkedIn "hiring" pattern: "Company is hiring a Role in Location"
  const hiringMatch = title.match(/^(.+?)\s+is\s+hiring\s+(?:a\s+|an\s+)?(.+?)(?:\s+in\s+(.+?))?(?:\s*[|\-—]|$)/i);
  if (hiringMatch) {
    return {
      role: hiringMatch[2].trim(),
      company: hiringMatch[1].trim(),
      location: hiringMatch[3]?.trim() || null,
    };
  }
  // Standard separators
  for (const sep of [" at ", " @ ", " - ", " | ", " — "]) {
    const idx = title.indexOf(sep);
    if (idx > 0) {
      const afterSep = title.slice(idx + sep.length);
      const parts = afterSep.split(/[|\-—]/);
      return {
        role: title.slice(0, idx).trim(),
        company: parts[0]?.trim() || null,
        location: null,
      };
    }
  }
  return { role: title, company: null, location: null };
};
```

**Add `hint` field to response when `partial: true`:**
- Detect if URL contains "linkedin.com"
- If partial and LinkedIn, add `hint: "LinkedIn may require login -- partial data from title only"`
- Otherwise generic hint or null

**Response shape becomes:**
```json
{ "success": true, "data": { ... }, "partial": true, "hint": "LinkedIn may require login..." }
```

---

### 2. Frontend (`src/components/AddJobDialog.tsx`)

**Update partial toast (line 73-74):**
- Use the `hint` from the response if present
- Show: `"Partial data loaded (LinkedIn restriction) -- review and complete manually"` when hint is present, otherwise the existing generic message

```typescript
if (data.partial) {
  toast({
    title: "Partial data loaded",
    description: data.hint || "Review and complete manually",
  });
}
```

---

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/scrape-job-url/index.ts` | Updated headers, 8s timeout, aggressive LinkedIn title parsing, `hint` field |
| `src/components/AddJobDialog.tsx` | Use `hint` in partial toast message |

