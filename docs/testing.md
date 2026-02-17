# JobTrackr End-to-End Testing Suite

This file tracks manual end-to-end test cases for JobTrackr.  
Run these before major networking pushes or releases.

Status legend:  
- [ ] Not tested  
- [x] Passed  
- [ ] Failed (see comment)  
- [~] Partial / needs retest

Last full run: [DATE - e.g. 2026-02-17]

## 1. Landing Page (Public, No Auth)

- [ ] LP-01 Positive: Hero loads correctly (headline, subtext, CTAs, trust strip visible, no errors, load <2s)  
- [ ] LP-02 Positive: Features grid displays (6 cards, icons/text, glassmorphism, responsive)  
- [ ] LP-03 Positive: Comparison table shows (grid, checks/Xs, responsive scroll on mobile)  
- [ ] LP-04 Positive: Pricing section ("Free Forever" card, feature list)  
- [ ] LP-05 Positive: FAQ accordion (5 items expand/collapse smoothly)  
- [ ] LP-06 Positive: Feedback link in footer (opens form in new tab)  
- [ ] LP-07 Negative: Slow connection (throttle Slow 3G — progressive load, no infinite spinners)  
- [ ] LP-08 Edge: Dark/light mode (respects OS preference, no contrast issues)  
- [ ] LP-09 Edge: Mobile view (CTAs stack, screenshots full-width, no clipping)

## 2. Auth Flow (/auth, Signup, Login)

- [ ] AF-01 Positive: Email signup (confirmation email, verify link → /app)  
- [ ] AF-02 Positive: Magic link login (email arrives, link logs in)  
- [ ] AF-03 Positive: Google OAuth (spinner, redirects to /app)  
- [ ] AF-04 Positive: Apple OAuth (same as above)  
- [ ] AF-05 Negative: Invalid email/pass (error toast, no lockout)  
- [ ] AF-06 Negative: Unverified email login (error "Verify email first")  
- [ ] AF-07 Negative: Password reset (email arrives, reset works)  
- [ ] AF-08 Edge: Social login cancel (consent denied → error toast, no loop)

## 3. Onboarding (First Login)

- [ ] OB-01 Positive: Sample data seed (banner, 3 jobs seeded)  
- [ ] OB-02 Positive: Guided tour (5-step spotlight, skippable, "Never show again")  
- [ ] OB-03 Negative: Skip tour (ends, doesn't reappear)  
- [ ] OB-04 Edge: Delete samples ("Delete All Samples" button removes them)

(Continue with the rest of the sections from the full list: Kanban Board, Job Detail Panel, Dashboard/Calendar/List/CV View, Reminders, Extension, Edge Cases)

## Summary of Failures & Known Issues

(Add notes here as you test — e.g. "AF-03: OAuth Google loops on consent denial — see issue #5")

## Next Full Run Target

[DATE - e.g. After next Lovable push]
