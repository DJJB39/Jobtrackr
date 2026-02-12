
## Revamp Landing Page -- Final Implementation Plan

Complete rewrite of `src/pages/Landing.tsx` with sharper copy, app mockups, social proof, and a final CTA.

---

### Section Order

1. Nav (unchanged)
2. Hero (rewritten copy)
3. App Screenshots (NEW -- 3 browser mockup frames)
4. Features (rewritten 2x2 grid)
5. Social Proof (NEW -- 3 quote cards with avatars)
6. Final CTA (NEW -- centered block)
7. Footer (unchanged)

---

### Final Copy Blocks

**Hero badge:** "Free to use . No credit card required" (keep as-is)

**Headline:**
```
Stop Losing Track of Applications
```

**Accent line:**
```
Your entire job search, one board.
```

**Subheadline:**
```
Paste a job link and auto-fill the details. Drag applications through stages.
Set reminders so nothing slips. Private by default -- only you see your data.
```

**Features array:**

| Icon | Title | Description |
|------|-------|-------------|
| Columns3 | Kanban Board | Drag and drop applications across 8 stages, from Found to Accepted. Filter by role, type, or stage. |
| Link (lucide) | URL Auto-Fill | Paste a job posting link and auto-fill company, role, salary, and deadline -- no manual entry. |
| CalendarDays | Events and Reminders | Schedule interviews, deadlines, and follow-ups. Export to Google Calendar or download ICS files. |
| Shield | Private and Secure | Your data is encrypted and accessible only to you. No sharing, no selling, no ads. |

**Testimonials array:**

| Quote | Attribution | Initials |
|-------|------------|----------|
| "I applied to 80+ jobs and never lost track of a single one." | Recent grad, software engineering | SG |
| "The URL auto-fill alone saves me 5 minutes per application." | Career switcher | KM |
| "Finally a tracker that isn't a bloated Notion template." | Product designer | JL |

**Final CTA:**
```
Ready to take control of your job search?
[Sign Up Free]
It's free. No credit card required.
```

---

### Technical Details

**Single file modified:** `src/pages/Landing.tsx`

**Icon imports** -- replace `Search, StickyNote, BarChart3` with `Link2, CalendarDays, Shield` from lucide-react. Keep `Columns3, Briefcase, CheckCircle2`.

**Screenshots section** (between hero and features):
- `section` with `mx-auto max-w-6xl px-6 pb-24`
- `grid grid-cols-1 md:grid-cols-3 gap-6` containing 3 mockup cards
- Each card structure:
  ```
  <div className="group rounded-xl border bg-card overflow-hidden shadow-lg
                  transition-transform hover:scale-[1.02]">
    <!-- Browser chrome bar -->
    <div className="bg-muted/50 h-7 flex items-center gap-1.5 px-3 border-b">
      <div className="h-2 w-2 rounded-full bg-red-400/40" />
      <div className="h-2 w-2 rounded-full bg-yellow-400/40" />
      <div className="h-2 w-2 rounded-full bg-green-400/40" />
    </div>
    <!-- Placeholder body -->
    <div className="aspect-video flex items-center justify-center
                    bg-gradient-to-br from-secondary to-muted/30 p-6">
      <Icon className="h-10 w-10 text-muted-foreground/40" />
    </div>
  </div>
  <!-- Caption below -->
  <p className="mt-2 text-center text-xs text-muted-foreground font-medium">
    Caption text
  </p>
  ```
- Captions: "Kanban Board", "Application Details", "Stats Dashboard"
- Icons inside mockups: `Columns3`, `StickyNote`, `BarChart3` (purely decorative)

**Social proof section** (after features):
- `section` with `mx-auto max-w-4xl px-6 py-20`
- Section heading: `text-center text-lg font-semibold mb-10` -- "Why users love JobTrackr"
- `grid grid-cols-1 md:grid-cols-3 gap-6`
- Each card:
  ```
  <div className="rounded-xl border bg-card p-6 text-center">
    <!-- Avatar circle -->
    <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center
                    rounded-full bg-primary/10 text-sm font-bold text-primary">
      {initials}
    </div>
    <p className="text-sm text-foreground italic leading-relaxed">"{quote}"</p>
    <p className="mt-3 text-xs text-muted-foreground">{attribution}</p>
  </div>
  ```

**Final CTA section** (before footer):
- `section` with `mx-auto max-w-3xl px-6 py-20 text-center`
- Heading: `text-2xl sm:text-3xl font-bold text-foreground`
- Large primary button: `Button size="lg" className="text-base px-10 mt-6"`
- Reassurance line: `text-xs text-muted-foreground mt-3`

---

### Quick Wins via Visual Edits

These can be done for free using the Visual Edits tool after implementation:

- Tweak button text (e.g., "Get Started Free" instead of "Sign Up Free")
- Adjust headline wording or line breaks
- Change the badge text
- Edit testimonial quotes or attributions
- Modify footer text
