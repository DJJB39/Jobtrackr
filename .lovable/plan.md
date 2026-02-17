

# Automated Test Suite Implementation

Create 7 test files and a shared utility, delete the placeholder, and update docs. Priority order: foundation first, then high-value components.

---

## Prerequisites

The testing infrastructure is already in place:
- `vitest.config.ts` configured with jsdom, globals, and setup file
- `src/test/setup.ts` has jest-dom and matchMedia mock
- `tsconfig.app.json` includes `vitest/globals`
- Dependencies installed (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`)

The existing build error (`npm:openai@^4.52.5`) is an edge function type resolution issue unrelated to frontend tests -- no action needed.

---

## Files to Create

### 1. `src/test/test-utils.tsx` -- Shared render wrapper and mock factories

- Custom `renderWithProviders` wrapping components in `MemoryRouter`, `QueryClientProvider`, `ThemeProvider`, `TooltipProvider`
- `createMockJob()` factory returning a fully populated `JobApplication` object
- `createMockColumn()` factory returning a `Column` object
- Shared Supabase auth mock setup helper

### 2. `src/test/Landing.test.tsx` -- 6 tests

| Test | Maps to |
|------|---------|
| Hero headline "Stop Losing Track of Applications" renders | LP-01 |
| Trust strip "Free to use" badge visible | LP-01 |
| CTA buttons "Sign Up Free" and "Try Interactive Demo" present | LP-01 |
| Features grid renders 6 cards (Kanban Board, URL Auto-Fill, etc.) | LP-02 |
| Pricing section text "Free Forever" present | LP-04 |
| Loom embed iframe rendered with correct src | Custom |

Mocks: `useAuth` returns `{ user: null, loading: false }`, `useNavigate` returns `vi.fn()`.

### 3. `src/test/Auth.test.tsx` -- 5 tests

| Test | Maps to |
|------|---------|
| Login form renders with email, password, "Sign In" button | AF-05 |
| OAuth buttons "Continue with Google" and "Continue with Apple" visible | AF-03/04 |
| Clicking "Sign up" switches to signup mode with "Sign Up" button | AF-01 |
| Clicking "Forgot password?" shows reset mode with "Send Reset Link" | AF-07 |
| "Back to sign in" returns to login mode | AF-07 |

Mocks: `supabase.auth.onAuthStateChange` returns stub subscription, `supabase.auth.getSession` resolves with null session.

### 4. `src/test/JobCard.test.tsx` -- 10 tests

| Test | Maps to |
|------|---------|
| Renders company name as bold text | KB core |
| Renders role subtitle | KB core |
| Renders salary pill when salary exists | KB core |
| Hides salary pill when no salary | KB edge |
| Renders "View Original Posting" link when links[0] exists | New feature |
| Hides posting link when no links | Edge |
| Renders location with MapPin icon | KB core |
| Renders contacts count badge | New feature |
| Progress bar width matches stage (e.g. "applied" = 25%) | New feature |
| Compact mode hides notes but shows event/contact count badges | KB compact |

Mocks: `useSortable` from `@dnd-kit/sortable` returns no-op refs/transforms, `useAuth` returns test user, `localStorage.getItem` for CV score.

### 5. `src/test/KanbanColumn.test.tsx` -- 3 tests

| Test | Maps to |
|------|---------|
| Renders column title and job count badge | KB layout |
| Empty column shows "Drop here" empty state | KB edge |
| Renders correct number of JobCard components | KB layout |

Mocks: `useDroppable` from `@dnd-kit/core`, `useSortable`, `useAuth`.

### 6. `src/test/ResetPassword.test.tsx` -- 2 tests

| Test | Maps to |
|------|---------|
| Shows "Verifying your reset link" initially (spinner, no form) | AF-07 |
| Renders password form fields when ready | AF-07 |

Mocks: `supabase.auth.onAuthStateChange`, `useNavigate`.

### 7. `src/test/constants.test.ts` -- 2 tests

- `FEEDBACK_FORM_URL` is a non-empty string
- `LOOM_DEMO_URL` is a non-empty string

---

## Files to Delete

- `src/test/example.test.ts` -- replaced by real tests

---

## Files to Update

### `docs/testing.md`

Add sections for:
- Kanban Board tests (KB-01 to KB-06)
- Job Detail Panel tests (JD-01 to JD-05)
- Dashboard/Calendar/List/CV View tests (DV-01 to DV-04)
- Reminders & Notifications (RN-01 to RN-03)
- Chrome Extension (CE-01 to CE-02)
- Edge Cases & Performance (EC-01 to EC-04)
- New "Automated Tests" section referencing test file locations and `npx vitest` command

---

## Mocking Strategy

| Dependency | Mock approach |
|------------|--------------|
| `@/integrations/supabase/client` | `vi.mock` -- stub `auth.onAuthStateChange`, `auth.getSession`, `auth.signInWithPassword` |
| `@/integrations/lovable/index` | `vi.mock` -- stub `lovable.auth.signInWithOAuth` |
| `@/hooks/useAuth` | `vi.mock` -- return `{ user: null/testUser, loading: false, signOut: vi.fn() }` |
| `@dnd-kit/sortable` | `vi.mock` -- `useSortable` returns `{ attributes: {}, listeners: {}, setNodeRef: vi.fn(), transform: null, transition: null, isDragging: false }` |
| `@dnd-kit/core` | `vi.mock` -- `useDroppable` returns `{ setNodeRef: vi.fn(), isOver: false }` |
| `localStorage` | `vi.spyOn(Storage.prototype, "getItem")` for CV score |
| `react-router-dom` | Wrapped with `MemoryRouter`; `useNavigate` mocked where needed |

---

## Expected Output

- ~28 test cases across 7 files
- All automatable checks from `docs/testing.md` covered
- Run with `npx vitest` or the run-tests tool
- No new dependencies required

