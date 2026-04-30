# Pre-Sale Cleanup — Verification & One Fix

I audited all six items. Five are already done from prior turns. Only one real change is needed.

## Audit Results

| # | Item | Status |
|---|------|--------|
| 1 | `.env` ignored by git | **NEEDS FIX** — current `.gitignore` does not list `.env` |
| 2 | Edge Functions use `APP_URL` env | ✅ All 8 functions already use `Deno.env.get("APP_URL") \|\| "https://brs39.lovable.app"`. The remaining literal URLs are intentional entries inside the `ALLOWED_ORIGINS` allowlist arrays (same pattern across every function — kept as a safety fallback so production CORS keeps working even if the env var is unset). |
| 3 | `index.html` og:image → `/og-image.png` | ✅ Already set to `https://brs39.lovable.app/og-image.png` with buyer-replace comment. `public/og-image.png` exists. |
| 4 | Comparison table cells populated | ✅ `ComparisonTable.tsx` already renders explicit "Yes" / "No" / "Limited" via `CellLabel` for every row, with April 2026 footnote. |
| 5 | ChromeExtensionCTA "Coming Soon" removed | ✅ Already reads "Chrome extension available — install via repo". |
| 6 | Two-card pricing (Free + Pro £9/mo · £69/yr) | ✅ `PricingSection.tsx` already shows both cards with Pro highlighted and "Most Popular" badge. |

## The One Fix

The actual `.gitignore` at the repo root currently contains only Vite/editor defaults — it does **not** ignore `.env`. (The file labelled `gitignore` in earlier context that included `.env` rules was a different/proposed file, not the real `.gitignore`.) `.env.example` exists with placeholders ✅.

### Change

Append the standard env-ignore block to `.gitignore`:

```text
# Environment variables (never commit secrets)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.*.local
```

This guarantees `.env` (and any `.env.*.local` variants) are excluded from version control going forward, while `.env.example` stays tracked as the placeholder template for buyers.

## Out of Scope / Notes for Buyer

- `.env` may already be tracked in git history from earlier commits. Adding it to `.gitignore` only stops future tracking. If the buyer wants the file scrubbed from history, that requires a `git filter-repo` / BFG run which Lovable cannot perform from the agent (git history is managed). Recommend the buyer rotate the Supabase anon key after handover regardless — it's already a public key by design, but rotation is hygienic.
- The `ALLOWED_ORIGINS` arrays in Edge Functions intentionally keep `https://brs39.lovable.app` as a literal fallback alongside the env-driven `APP_URL`. This is the safe pattern: if the new owner forgets to set `APP_URL`, the production domain still passes CORS until they reconfigure. Buyers should add their custom domain to those arrays once known.

## Deliverable After Approval

- Edited file: `.gitignore` (one append, ~7 lines)
- Confirmation that items 2–6 verified clean, with the audit table above echoed back.
