

# Phase 4: Landing Page and Growth

Phases 1-3 are complete. This phase transforms the landing page from a basic marketing page into a conversion-optimized, premium experience with interactive demo, competitor comparison, pricing/FAQ, and proper SEO.

---

## 4a. Landing Page Visual Overhaul

**File: `src/pages/Landing.tsx`** -- Full rewrite

- Apply the same glassmorphism/premium aesthetic from Phase 2 (glass nav, gradient backgrounds, glow effects)
- Use `framer-motion` for scroll-triggered section animations (fade-up on enter)
- Hero section: bigger headline with gradient text accent, animated background grid/dots pattern
- Screenshot section: larger hero screenshot with floating UI element highlights instead of 3 equal cards
- Update font usage to Satoshi (display) and JetBrains Mono (mono accents) matching the app
- Animated stats counter ("10,000+ applications tracked" style social proof placeholder)

## 4b. Interactive Demo Tour

**File: `src/pages/Landing.tsx`** (inline section) or link to existing `/demo`

- Add an embedded preview section showing the Kanban board with fake data and a guided tooltip overlay
- Or: enhance the existing "Try Demo" CTA with a more prominent, animated call-to-action
- The `/demo` page already exists and works well -- focus on driving traffic to it from the landing page with a more compelling visual preview

## 4c. Competitor Comparison Table

**New file: `src/components/landing/ComparisonTable.tsx`**

- Feature comparison grid: JobTrackr vs Huntr vs Teal vs Simplify
- Categories: Kanban Board, URL Auto-Fill, AI Resume Tailor, CV Suitability, Calendar, Email Reminders, Free Tier, Privacy
- Checkmarks, X marks, and "Limited" labels
- Responsive: horizontal scroll on mobile, or accordion-style collapse
- Subtle styling that highlights JobTrackr's advantages

## 4d. Pricing / FAQ Section

**New file: `src/components/landing/PricingSection.tsx`**

- Single "Free Forever" plan card (since JobTrackr is free)
- List all features included: unlimited applications, AI assist, CV upload, email reminders, calendar, export
- Optional: "Pro" placeholder for future monetization
- Clean card design with glassmorphism styling

**New file: `src/components/landing/FAQSection.tsx`**

- Accordion-based FAQ using shadcn Accordion component
- Questions: "Is it really free?", "Is my data private?", "Can I import from other tools?", "How does the AI work?", "What job boards are supported?"

## 4e. SEO Meta Tags

**File: `index.html`**

- Update title to "JobTrackr -- Track Your Job Applications"
- Update meta description, og:title, og:description, og:image
- Add canonical URL, twitter card meta
- Add structured data (JSON-LD) for SoftwareApplication schema

---

## Technical Details

**New files:**
| File | Purpose |
|------|---------|
| `src/components/landing/ComparisonTable.tsx` | Competitor feature grid |
| `src/components/landing/PricingSection.tsx` | Free tier pricing card |
| `src/components/landing/FAQSection.tsx` | Accordion FAQ |

**Edited files:**
| File | Changes |
|------|---------|
| `src/pages/Landing.tsx` | Full visual overhaul with framer-motion, new sections, glass aesthetic |
| `index.html` | SEO meta tags, title, OG image, JSON-LD |

**Dependencies:** None new -- `framer-motion` and all shadcn components already installed.

**Estimated credits:** 4-5

After this phase, we move to Phase 5 (Nice-to-Haves: gamification, sharing, Chrome extension stub) and then do full end-to-end testing.

