

# Add Feedback / Feature Request Link

Three small changes -- one new file, two edits. No dependencies, no backend.

---

## 1. Create `src/lib/constants.ts`

Export a single constant:

```ts
export const FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform";
```

Replace `YOUR_FORM_ID` with the real Google Form ID after creating the form.

---

## 2. Edit `src/components/UserMenu.tsx`

- Import `MessageSquarePlus` from `lucide-react`
- Import `FEEDBACK_FORM_URL` from `@/lib/constants`
- Insert between the existing theme toggle item and the log-out item:

```
Theme toggle item
DropdownMenuSeparator        (existing)
Feedback item (new)          -- MessageSquarePlus icon + "Feedback" label
DropdownMenuSeparator        (existing, before log out)
Log out item
```

The Feedback item uses `onClick={() => window.open(FEEDBACK_FORM_URL, "_blank")}` -- no navigation, just opens a new tab.

---

## 3. Edit `src/pages/Landing.tsx`

- Import `FEEDBACK_FORM_URL` from `@/lib/constants`
- Change the footer from a single line to a flex row:
  - Left: existing copyright text
  - Right: "Feedback" link styled `text-muted-foreground hover:text-foreground underline underline-offset-2`
  - Opens in new tab via `window.open`

---

## Summary

| File | Action |
|------|--------|
| `src/lib/constants.ts` | Create -- single URL export |
| `src/components/UserMenu.tsx` | Edit -- add Feedback menu item with icon |
| `src/pages/Landing.tsx` | Edit -- add Feedback link in footer |

Zero new dependencies. Zero backend changes. Three files touched.

