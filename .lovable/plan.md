

# Pre-Ship Security & Quality Checklist — Audit Results

---

## SECURITY

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | No API keys or secrets in frontend code | **PASS** | Only public/anon keys (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) are in frontend — these are designed to be public. No private keys exposed. |
| 2 | Every route checks authentication | **PASS** | `/app` is wrapped in `ProtectedRoute`. Public routes (`/`, `/auth`, `/demo`, `/privacy`, `/reset-password`) are intentionally public. |
| 3 | HTTPS enforced everywhere | **PASS (managed)** | Lovable Cloud hosting enforces HTTPS automatically. No action needed. |
| 4 | CORS locked to your domain | **FAIL** | All 8 edge functions use `Access-Control-Allow-Origin: "*"`. Should be restricted to your domain (`https://brs39.lovable.app` and preview URL). |
| 5 | Input validated and sanitized server-side | **PARTIAL** | `scrape-job-url` validates URLs and sanitizes HTML. `extension-save-job` checks required fields. `ai-assist` validates mode/model. But `send-push` accepts arbitrary subscription endpoints and payloads with zero validation — an attacker could use it as an open HTTP proxy. |
| 6 | Rate limiting on auth and sensitive endpoints | **PARTIAL** | `ai-assist` has a free-tier usage limit (10/month) which acts as soft rate limiting. No rate limiting on `scrape-job-url`, `send-push`, `extension-save-job`, or auth endpoints. Supabase Auth has built-in rate limiting. |
| 7 | Passwords hashed with bcrypt or argon2 | **PASS (managed)** | Supabase Auth handles password hashing with bcrypt. |
| 8 | Auth tokens have expiry | **PASS (managed)** | Supabase JWTs have default 1-hour expiry with auto-refresh configured. |
| 9 | Sessions invalidated on logout | **PASS** | `signOut()` calls `supabase.auth.signOut()` which invalidates the server-side session. |
| 10 | Leaked password protection | **FAIL** | Security scan confirmed this is disabled. Must be enabled. |

---

## DATABASE

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Backups configured and tested | **PASS (managed)** | Lovable Cloud handles daily backups automatically. |
| 2 | Parameterized queries everywhere | **PASS** | All queries use the Supabase SDK (`.from().select().eq()`) which parameterizes automatically. No raw SQL string concatenation. |
| 3 | Separate dev and production databases | **N/A** | Lovable Cloud manages this. Single environment for now. |
| 4 | Connection pooling configured | **PASS (managed)** | Supabase includes PgBouncer connection pooling by default. |
| 5 | Migrations in version control | **PASS** | `supabase/migrations/` directory exists with migration files. |
| 6 | App uses a non-root DB user | **PASS (managed)** | Supabase enforces this — the app connects via `anon` role, not superuser. RLS is enabled on all tables. |

---

## DEPLOYMENT

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | All env vars set on production | **PASS** | Secrets confirmed: `RESEND_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `LOVABLE_API_KEY`, plus Supabase defaults. |
| 2 | SSL certificate valid | **PASS (managed)** | Lovable Cloud auto-provisions SSL. |
| 3 | Firewall configured | **PASS (managed)** | Managed by Lovable Cloud infrastructure. |
| 4 | Process manager running | **PASS (managed)** | Edge functions run on Deno Deploy; frontend is static hosting. No PM2 needed. |
| 5 | Rollback plan exists | **PASS** | Lovable has version history — you can restore any previous version. |
| 6 | Staging test passed | **YOU DECIDE** | Preview URL is your staging. Test there before publishing. |

---

## CODE

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | No console.logs in production build | **PARTIAL** | Frontend: zero `console.log` calls — clean. But `console.error` calls exist in `jobStore.ts`, `useCSVImport.ts`, `ErrorBoundary.tsx`, `NotFound.tsx`, `usePushNotifications.tsx`. These are acceptable for error tracking but could leak info. Edge functions have `console.error` for server-side logging (acceptable). |
| 2 | Error handling on all async operations | **PASS** | All async calls in hooks and stores are wrapped in try/catch with user-facing toast notifications. |
| 3 | Loading and error states in UI | **PASS** | Loading spinners on auth, job fetching, AI operations. Error toasts throughout. `ErrorBoundary` catches rendering crashes. |
| 4 | Pagination on all list endpoints | **FAIL** | `fetchJobs` in `jobStore.ts` loads ALL jobs with no `.limit()` or pagination. If a user has 1000+ jobs, this will hit the Supabase default 1000-row limit silently, dropping data. `ActivityTimeline` has `.limit(20)` — that's the only paginated query. |
| 5 | npm audit run | **NEEDS ACTION** | Must be run manually before ship. |

---

## Summary: What Needs Fixing Before Ship

### Critical (must fix)

1. **CORS wildcard on all edge functions** — Lock `Access-Control-Allow-Origin` to `https://brs39.lovable.app` (and preview URL during dev). Affects all 8 functions.

2. **`send-push` has no authentication** — Anyone can call it with any push subscription endpoint and payload. It's an open relay. Add JWT auth validation.

3. **Enable leaked password protection** — Use `configure_auth` tool to enable HIBP check.

4. **Job list has no pagination** — `fetchJobs` loads everything. Add `.limit()` and pagination, or at minimum raise awareness that 1000+ jobs will silently truncate.

### Recommended (should fix)

5. **`send-push` input validation** — Validate subscription endpoint is a valid push service URL, not arbitrary HTTP targets.

6. **Run `npm audit`** — Check for known vulnerabilities in dependencies.

7. **Consider removing `console.error` from `jobStore.ts`** — These log Supabase error messages to the browser console which could contain table/column names.

### Acceptable as-is

- `console.error` in `ErrorBoundary`, `NotFound`, and edge functions — standard error logging
- `unsubscribe` function uses HMAC token verification instead of JWT — this is correct for email unsubscribe links
- `send-reminders` and `weekly-digest` are server-to-server (cron) — no user-facing auth needed

---

## Implementation Plan

**Files to modify:**

| File | Change |
|------|--------|
| All 8 edge functions | Replace `"*"` CORS origin with domain allowlist |
| `supabase/functions/send-push/index.ts` | Add JWT auth check + validate subscription endpoint |
| `src/stores/jobStore.ts` | Add pagination or at minimum `.limit(1000)` with a warning |
| Auth config | Enable leaked password protection via `configure_auth` |

Estimated: 4 files changed, ~50 lines total.

