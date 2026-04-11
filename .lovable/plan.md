

# Remaining Cleanup — Final Polish

## Status of Original 7 Items

| # | Task | Status |
|---|------|--------|
| 1 | .env not tracked, .env.example exists | `.env.example` exists and is correct. `.gitignore` is **missing `.env` entry** — needs fix |
| 2 | Constants empty, conditional UI | Already done — both are `""`, Landing and UserMenu already guard with `&&` |
| 3 | Edge Functions use `Deno.env.get("APP_URL")` | Already done in both functions |
| 4 | index.html TODO comments + OG tags | **Still has 3 TODO-style comments** — needs cleanup |
| 5 | APPLICATION_TYPES broadened | Already done (15 categories) |
| 6 | AppHeader extracted | Already done (193-line component) |
| 7 | Privacy page | **Missing** — needs creation |

## Remaining Work (3 items)

### A. Fix `.gitignore` — add `.env` exclusions
Current file is missing `.env` and `.env.*` entries. Add them so secrets are never committed.

### B. Clean `index.html` comments
Remove the 3 `<!-- Update ... -->` comment lines (9, 15, 22). Replace with a single clean comment at the top noting the buyer should update the domain. No functional change.

### C. Create Privacy Policy page
- Create `src/pages/Privacy.tsx` — a simple static page with standard SaaS privacy content (data collection, cookies, third parties, contact)
- Add route `/privacy` in `App.tsx`
- Add footer link in `Landing.tsx`

## Files Changed

| File | Action |
|------|--------|
| `.gitignore` | Add `.env` and `.env.*` entries |
| `index.html` | Remove TODO comments, add single note |
| `src/pages/Privacy.tsx` | Create — static privacy policy page |
| `src/App.tsx` | Add `/privacy` route |
| `src/pages/Landing.tsx` | Add Privacy link in footer |

