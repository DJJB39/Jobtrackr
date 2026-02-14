

# Phase 3 Refined: Chrome Extension + Real Reminders + Fixes

Three workstreams executed in parallel. No new npm dependencies. Estimated 6-8 credits.

---

## A. Chrome Extension (Standalone `chrome-extension/` directory)

Lovable cannot bundle a Chrome extension into the Vite build. All extension files live in `chrome-extension/` at the project root as a standalone deliverable. Users load it as an unpacked extension or publish to the Chrome Web Store.

### Files to create

**`chrome-extension/manifest.json`** -- Manifest V3
- permissions: `activeTab`, `storage`
- host_permissions: `*://*.linkedin.com/*`, `*://*.indeed.com/*`, `*://*.indeed.co.uk/*`, `*://*.reed.co.uk/*`, `*://*.greenhouse.io/*`
- content_scripts: matches for job pages on all four sites
- action: popup.html
- background: service_worker background.js
- icons: 16, 48, 128 placeholders

**`chrome-extension/content.js`** -- Content script
- URL-based site detection (LinkedIn, Indeed, Reed, Greenhouse)
- Per-site scraper functions using DOM selectors:
  - LinkedIn: `.top-card-layout__title`, `.topcard__org-name-link`, `.description__text`, location from `.topcard__flavor--bullet`, salary from `.salary` or `.compensation__salary`
  - Indeed: `h1.jobsearch-JobInfoHeader-title`, `[data-company-name]`, `#jobDescriptionText`, salary from `#salaryInfoAndJobType`
  - Reed: `h1[itemprop="title"]`, `[itemprop="hiringOrganization"]`, `.description`, salary from `.salary`
  - Greenhouse: `h1.app-title`, `.company-name`, `#content .body`
- Injects a floating "Save to JobTrackr" button (fixed, bottom-right, 48px, branded blue with the app icon)
- On click: scrapes page, sends data via `chrome.runtime.sendMessage` to background
- Shows inline feedback: green checkmark on success, red X with error text on failure
- Debounced to prevent double-saves

**`chrome-extension/background.js`** -- Service worker
- Listens for `SAVE_JOB` messages from content script
- Reads JWT + refresh token from `chrome.storage.local`
- POSTs to `extension-save-job` edge function with `Authorization: Bearer <jwt>`
- Handles token refresh if expired (re-authenticates using stored refresh token)
- Returns `{ success, jobId }` or `{ error }` to content script

**`chrome-extension/popup.html`** + **`chrome-extension/popup.js`** -- Login popup
- Clean login form: email + password + "Sign in" button
- Uses Supabase REST auth endpoint directly (no SDK -- keeps extension lightweight):
  - POST to `SUPABASE_URL/auth/v1/token?grant_type=password`
  - Stores `access_token` and `refresh_token` in `chrome.storage.local`
- After login: shows logged-in state with user email, "Ready to save jobs" status, "Log out" button
- Logout clears `chrome.storage.local`
- Error states: invalid credentials, network error, rate limit

**`chrome-extension/popup.css`** -- Minimal dark-themed styling matching the app's design language

**`chrome-extension/icons/`** -- Create `icon16.png`, `icon48.png`, `icon128.png` placeholder references (simple colored squares with "JT" text -- actual branded icons to be designed later)

**`chrome-extension/README.md`** -- Install instructions:
1. Clone/download the `chrome-extension` folder
2. Open `chrome://extensions`, enable Developer mode
3. Click "Load unpacked", select the `chrome-extension` folder
4. Navigate to a supported job page and click "Save to JobTrackr"
5. For Chrome Web Store publishing: zip the folder, upload at https://chrome.google.com/webstore/devconsole

### Backend: New edge function

**`supabase/functions/extension-save-job/index.ts`**
- CORS headers (standard)
- Validates JWT via `getClaims()` -- extracts `userId` from `claims.sub`
- Accepts POST body: `{ company, role, location?, description?, salary?, closeDate?, sourceUrl }`
- Validates required fields (company + role must be non-empty strings)
- Inserts into `job_applications`:
  - `column_id: 'found'`
  - `user_id` from JWT
  - `links: [{ url: sourceUrl, label: "Source" }]` as JSONB
  - All other fields mapped directly
- Returns `{ success: true, jobId: <uuid> }` or `{ error: <message> }`
- Add to `supabase/config.toml` with `verify_jwt = false`

### Landing page update

**`src/components/landing/ChromeExtensionCTA.tsx`**
- Change heading from "Coming Soon" to "Now in Beta"
- Enable the button (remove `disabled`), change text to "Install Extension"
- Button links to `/chrome-extension` readme or opens instructions modal
- Update ETA text from "Q2 2026" to "Beta -- Load as unpacked extension"
- Add supported sites list: LinkedIn, Indeed, Reed, Greenhouse

---

## B. Real Reminders (Email Upgrade + Browser Push + Cron)

### B1: Upgrade email templates

**`supabase/functions/send-reminders/index.ts`** -- Full rewrite of HTML template:
- Branded header with "JobTrackr" title and colored accent bar
- Event cards with colored left-border matching event type
- "Actions needed" section: stale applications (14+ days no update, not in accepted/rejected)
- Deep links back to the app: each job mention links to `APP_URL/?job=<jobId>` (the app can parse this to open the detail panel)
- One-click unsubscribe footer link: `SUPABASE_URL/functions/v1/unsubscribe?user_id=<id>&type=reminders&token=<hmac>`
- Inline CSS for email client compatibility (no external stylesheets)

**`supabase/functions/weekly-digest/index.ts`** -- Same branding upgrade:
- Branded HTML template matching send-reminders
- Add stale applications section (already partially there -- enhance styling)
- Add unsubscribe link
- Deep links for each mentioned job

**New: `supabase/functions/unsubscribe/index.ts`**
- Accepts GET with query params: `user_id`, `type` (reminders|digest), `token`
- Validates HMAC token: `HMAC-SHA256(user_id + type, SUPABASE_SERVICE_ROLE_KEY)` -- prevents unauthorized unsubscription
- Updates `user_preferences` to set `email_reminders = false` or `weekly_digest = false`
- Returns a simple, styled HTML confirmation page: "You've been unsubscribed from [type]. You can re-enable this in your JobTrackr settings."
- Add to `supabase/config.toml` with `verify_jwt = false`

### B2: Browser push notifications

**Database migration**: Add two columns to `user_preferences`:
- `push_subscription` JSONB, nullable, default null
- `push_notifications` boolean, not null, default false

**New: `src/hooks/usePushNotifications.tsx`**
- Checks `'serviceWorker' in navigator && 'PushManager' in window` for support
- `supported` boolean, `enabled` boolean (from `user_preferences.push_notifications`)
- `requestPermission()`:
  1. Calls `Notification.requestPermission()`
  2. On 'granted': registers service worker at `/sw.js`
  3. Calls `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`
  4. Saves subscription JSON to `user_preferences.push_subscription` via Supabase client
  5. Sets `push_notifications = true`
- `disable()`: sets `push_notifications = false`, clears `push_subscription`
- `toggle()`: calls requestPermission or disable based on current state
- Loads initial state from `user_preferences` on mount

**New: `public/sw.js`** -- Push service worker
- `self.addEventListener('push', ...)`: parses notification data `{ title, body, url, icon }`
- Shows notification via `self.registration.showNotification(title, { body, icon, data: { url } })`
- `self.addEventListener('notificationclick', ...)`: opens `event.notification.data.url` via `clients.openWindow()`

**New: `supabase/functions/send-push/index.ts`**
- Called internally by `send-reminders` when a user has `push_notifications = true` and a valid `push_subscription`
- Implements raw web-push protocol: constructs VAPID JWT, encrypts payload, POSTs to the subscription endpoint
- Requires `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` secrets (need to be generated and added)
- Payload: `{ title: "Upcoming: Interview at Google", body: "Tomorrow at 2pm", url: "/app?job=<id>" }`

**Modified: `supabase/functions/send-reminders/index.ts`** -- After sending email, also check if user has push enabled. If so, call `send-push` function for each upcoming event (via `fetch` to the function URL internally).

**Modified: `src/components/UserMenu.tsx`**
- Import `usePushNotifications`
- Add third toggle row under Notifications section:
  - `BellRing` icon + "Push notifications" label + Switch
  - On first enable: triggers browser permission prompt via `requestPermission()`
  - If browser doesn't support Push API: show disabled switch with tooltip "Not supported in this browser"
  - If permission denied: show disabled switch with tooltip "Permission denied -- enable in browser settings"

### B3: In-app browser notifications

**Modified: `src/hooks/useLoginReminders.tsx`**
- After the existing toast logic, also fire `new Notification(title, { body })` for events within 2 hours (more urgent than email's 24h)
- Only if `Notification.permission === 'granted'`
- Add "stale apps" reminder: if any application hasn't been updated in 14+ days and is not in accepted/rejected, show a single toast: "X applications need attention"

### B4: Schedule cron jobs

Run via SQL (not migration -- contains project-specific URLs and keys):

```text
-- Daily reminders at 8am UTC
cron.schedule('daily-reminders', '0 8 * * *', ...)

-- Weekly digest every Monday at 9am UTC
cron.schedule('weekly-digest', '0 9 * * 1', ...)
```

Both call their respective edge functions via `net.http_post` with the anon key in the Authorization header.

---

## C. CV Auth Fix + UK Salary Brackets

### C1: Fix CV auth (critical bug)

Both `CVView.tsx` and `DetailCVTab.tsx` currently send:
```
Authorization: Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}
```
This sends the **anon key**, not the user's JWT. The `ai-assist` edge function calls `getUser()` to validate -- this will fail or return the wrong identity.

**Fix in `src/components/CVView.tsx`** (line 89):
- Import `useAuth` (already imported)
- Get `session` from `useAuth()`: `const { user, session } = useAuth();`
- Replace the Authorization header: `Authorization: Bearer ${session?.access_token}`
- Add guard: if no session, show toast "Please log in" and return

**Fix in `src/components/detail/DetailCVTab.tsx`** (line 83):
- Same fix: get `session` from `useAuth()`, use `session?.access_token` in Authorization header
- The hook is already imported; just destructure `session` alongside `user`

### C2: UK-friendly salary brackets

**Modified: `src/components/KanbanBoard.tsx`** -- Update `SALARY_BRACKETS` array:
```ts
const SALARY_BRACKETS = [
  { value: "all", label: "All Salaries" },
  { value: "0-30", label: "Under 30k" },
  { value: "30-60", label: "30k-60k" },
  { value: "60-90", label: "60k-90k" },
  { value: "90-120", label: "90k-120k" },
  { value: "120+", label: "120k+" },
];
```
Currency-agnostic labels (no $ or GBP symbol) since salary strings could be in any currency. Adjusted brackets to be useful for both US and UK markets.

**Modified: `src/components/KanbanBoard.tsx`** -- Update the salary filter logic in `filteredJobs` to match the new bracket values (0-30, 30-60, 60-90, 90-120, 120+).

**Modified: `src/lib/salary.ts`** -- Ensure `parseSalary` handles GBP symbol: add `£` to the regex cleanup alongside `$` and `EUR`. Currently the regex strips `$` but not `£`.

### C3: Bulk actions -- skip

Already implemented (multi-select, Shift+click, Ctrl+A, bulk move/delete/export). No changes unless tags feature is requested later.

---

## Secrets Required

- `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` -- Required for web push. Will need to be generated and added as project secrets before push notifications work.
- `RESEND_API_KEY` -- Already configured.

---

## File Change Summary

| File | Action |
|---|---|
| `chrome-extension/manifest.json` | **New** -- Manifest V3 |
| `chrome-extension/content.js` | **New** -- Site scrapers + inject button |
| `chrome-extension/background.js` | **New** -- Service worker, API relay |
| `chrome-extension/popup.html` | **New** -- Login UI |
| `chrome-extension/popup.js` | **New** -- Auth logic |
| `chrome-extension/popup.css` | **New** -- Popup styling |
| `chrome-extension/README.md` | **New** -- Install + publish instructions |
| `supabase/functions/extension-save-job/index.ts` | **New** -- Authenticated job creation |
| `supabase/config.toml` | Add extension-save-job, unsubscribe, send-push |
| `supabase/functions/send-reminders/index.ts` | Branded template, deep links, push integration, unsubscribe |
| `supabase/functions/weekly-digest/index.ts` | Branded template, deep links, unsubscribe |
| `supabase/functions/unsubscribe/index.ts` | **New** -- One-click email unsubscribe with HMAC |
| `supabase/functions/send-push/index.ts` | **New** -- Web push sender |
| `src/hooks/usePushNotifications.tsx` | **New** -- Push subscription management |
| `public/sw.js` | **New** -- Push notification service worker |
| `src/components/UserMenu.tsx` | Add push notification toggle |
| `src/hooks/useLoginReminders.tsx` | Add browser Notification API + stale app reminders |
| `src/components/landing/ChromeExtensionCTA.tsx` | Update to "Beta" with install link |
| `src/components/CVView.tsx` | Fix auth: use session.access_token |
| `src/components/detail/DetailCVTab.tsx` | Fix auth: use session.access_token |
| `src/components/KanbanBoard.tsx` | UK-friendly salary brackets |
| `src/lib/salary.ts` | Handle GBP symbol in parser |
| DB migration | Add push_subscription + push_notifications to user_preferences |
| SQL (non-migration) | Schedule cron jobs for daily reminders + weekly digest |

### Testing checklist (per team request)
1. Extension scraping: Load unpacked, navigate to LinkedIn job page, click "Save to JobTrackr", verify job appears in "Found" column
2. Extension scraping: Repeat on Reed job page -- verify title, company, salary extracted
3. Push permission flow: Enable push in UserMenu, verify browser prompt appears, verify subscription saved to DB
4. Push permission denied: Deny prompt, verify toggle shows "Permission denied" state
5. Email unsubscribe: Click unsubscribe link in reminder email, verify confirmation page renders, verify preference updated in DB
6. CV auth: Open CV view, click "Review Suitability" on a job, verify AI response returns (not 401)
7. Salary filter: Add jobs with GBP salaries ("GBP45k"), verify they appear in correct bracket

