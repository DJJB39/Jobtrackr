

# Quick Fixes Before Networking

Four targeted changes across 3 files.

---

## 1. Loom Video Embed in Landing Hero

**File:** `src/pages/Landing.tsx`

Insert a Loom embed between the hero subtitle paragraph (line 136) and the CTA buttons (line 137). Use an `<iframe>` inside a glass-framed container with rounded corners.

```text
[Hero text]
[Subtitle]
+--glass frame, rounded-xl, max-w-lg, mx-auto, mt-8--+
|  <iframe src="https://www.loom.com/embed/LOOM_ID"    |
|    autoplay muted, aspect-video, rounded-lg />        |
+------------------------------------------------------+
[CTA buttons]
```

- Container: `mx-auto mt-8 max-w-lg rounded-xl border border-border glass overflow-hidden shadow-glow`
- iframe: `w-full aspect-video` with `?autoplay=1&mute=1&hide_owner=true&hide_share=true&hide_title=true` params
- Export a `LOOM_DEMO_URL` constant from `src/lib/constants.ts` with a placeholder Loom embed ID for easy replacement later

## 2. Fix OAuth Redirect

**File:** `src/pages/Auth.tsx`

The current OAuth flow redirects to `window.location.origin` (root `/`), relying on Landing.tsx to detect the session and navigate to `/app`. This can cause a visible flash of the landing page.

Fix: Change the `redirect_uri` for both Google and Apple OAuth from `window.location.origin` to `window.location.origin + "/app"`. However, since `/app` is a protected route behind `ProtectedRoute`, this should work -- the auth state change listener on the Auth page and the ProtectedRoute component both handle session detection.

Actually, the better fix: the `redirect_uri` in Lovable Cloud OAuth is where the OAuth callback returns to *before* the session is set. The `lovable.auth.signInWithOAuth` function handles the token exchange and then `supabase.auth.setSession` is called. So the redirect lands on the origin, and then the `onAuthStateChange` listener on whichever page the user is on picks it up.

The real issue is: after OAuth, the browser returns to `/` (Landing page), and the Landing page's `useEffect` runs `navigate("/app")` -- but there may be a timing gap where `loading` is true. The fix is to ensure the Landing page's redirect effect fires reliably:

- In `Auth.tsx`: Keep `redirect_uri` as `window.location.origin` (this is correct for Lovable Cloud OAuth)
- The existing flow already works: Landing.tsx line 70-74 redirects authenticated users to `/app`
- If the user reports a specific issue, we'd debug further, but the current code is correct per the Lovable Cloud OAuth docs

**Decision:** No code change needed for OAuth -- the current implementation follows the documented pattern correctly. The `onAuthStateChange` listeners on both Auth.tsx and Landing.tsx handle the redirect to `/app`.

## 3. "View Original Posting" Button on JobCard

**File:** `src/components/JobCard.tsx`

Add a small `ExternalLink` icon button inline with the company name (Row 1) that links to `job.links[0]` if it exists.

Change line 140 from a simple `<h4>` to a flex row:

```tsx
<div className="flex items-center gap-1.5 pr-16">
  <h4 className="font-bold text-base text-card-foreground truncate">{job.company}</h4>
  {job.links?.[0] && (
    <a
      href={job.links[0]}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="shrink-0 text-muted-foreground/50 hover:text-primary transition-colors"
      title="View original posting"
    >
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  )}
</div>
```

**Detail panel:** Already has "View Original Posting" (JobDetailPanel.tsx lines 205-214) -- no change needed.

## 4. Contacts Preview on Cards

**File:** `src/components/JobCard.tsx`

Already implemented! The current JobCard shows:
- **Non-compact mode** (Row 7, lines 209-218): Shows first contact name or "X contacts" with Users icon
- **Compact mode** (lines 231-236): Shows contact count badge with Users icon

No changes needed -- this was implemented in the previous redesign.

---

## Summary

| # | Task | File | Action |
|---|------|------|--------|
| 1 | Loom video embed | `Landing.tsx`, `constants.ts` | Add iframe in glass frame + constant |
| 2 | OAuth redirect | -- | No change needed (already correct) |
| 3 | View Original Posting on card | `JobCard.tsx` | Add ExternalLink icon next to company name |
| 4 | Contacts preview | -- | Already implemented |

**Net changes:** 2 files edited, 1 constant added. No new dependencies.

