
Direct answer: in the screenshot you shared, the screenshot-to-fill feature is nowhere visible. You are looking at the lower half of the Add Job dialog, and the screenshot entry point is off-screen.

What the code actually says:
- `src/components/AddJobDialog.tsx` does include the feature as a small ghost button: `Camera + "Or snap a screenshot"` directly under the Job Posting URL field.
- That button opens `ScreenshotCaptureModal` in pre-fill mode via `onExtracted`, which is the right behavior technically.
- But `AddJobDialog` is using a centered dialog with no mobile-specific height/scroll treatment, so on a 440px mobile viewport with the keyboard up, the top of the form gets pushed out of view. In practice, the feature exists in code but is not accessible in the actual mobile journey.

Correction to my earlier conclusion:
- I treated “present in code” as “available in UX”.
- Your screenshot proves that was wrong.

Why this is failing product-wise:
- Screenshot capture is an intake method, not just an AI extra.
- It was implemented as a secondary text button below the URL field instead of as a first-class add-job option.
- That means the app currently prioritizes secondary discovery surfaces (AI Studio / empty state) over the main “I want to add a job now” flow.

Feature placement review:
- Rational:
  - URL fetch inside Add Job
  - CV Roast in CV view + AI Studio
  - Coach / Tailor / Cover Letter / Bootcamp in Job Detail + AI Studio
  - CSV Import in header / empty state as a bulk-import flow
- Not rational:
  - Screenshot Capture being technically inside Add Job but visually buried/off-screen on mobile
  - A core acquisition path should never rely on the user scrolling a cramped modal to find it

Implementation plan:
1. Fix Add Job mobile layout first
- Update `src/components/AddJobDialog.tsx` so the dialog is mobile-safe: add max-height and internal scrolling.
- Ensure the top of the form remains reachable when the keyboard is open.

2. Promote screenshot capture to a first-class intake option
- Move the screenshot entry point into the visible top section of Add Job.
- Make it visually equal to URL/manual entry instead of a tiny ghost action.
- Keep it above the fold on mobile.

3. Keep the current pre-fill behavior
- Preserve `ScreenshotCaptureModal` → `onExtracted` flow.
- Continue pre-filling company, role, location, salary, description, URL, and matched application type.
- Tighten the copy so it clearly says this fills the form rather than saving immediately.

4. Rationalize feature surfaces
- Keep Screenshot Capture in AI Studio and empty state as secondary discovery.
- Treat Add Job as the primary surface for this feature.
- Do not move CSV import into Add Job; that remains a separate bulk-import journey.

5. Add regression protection
- Add/extend tests for:
  - Add Job dialog rendering on mobile
  - screenshot CTA visibility in the dialog
  - screenshot extraction pre-filling the form

Files to update:
- `src/components/AddJobDialog.tsx`
- `src/components/ScreenshotCaptureModal.tsx` (only for copy/interaction polish if needed)
- `src/test/AddJobDialog.test.tsx` or existing screenshot modal tests

Expected outcome:
- The screenshot feature will stop being “technically present but practically hidden”.
- Users adding a job will see screenshot capture immediately, where they expect it.
