# My Journey Building JobTrackr: A Hobby Project Born from LinkedIn Pain

Hey everyone, BRS here from the UK 🇬🇧 with roots in Nigeria 🇳🇬 and Poland 🇵🇱 (@BRSAD39 on X).  

I'm not a professional developer or startup founder — I'm a business analyst by trade and a hobbyist coder. Last year I got made redundant and, like many, started scrolling LinkedIn for inspiration (and commiseration). One day an old work colleague posted yet another blurry Excel screenshot of his job hunt tracker. It looked painful. He was also marking "3 months without a role".  

I thought: "He can't seriously be using that... can he?"  
That moment gave me the push: there had to be a better way. So I started looking for tools to build something useful — and discovered Lovable (an AI-assisted app builder) + Supabase for backend. That something became JobTrackr.

This post is an honest recap of the journey so far: what actually happened, the dumb mistakes I made, the real learnings, and where I'm trying to take it. If you're thinking about building your own side project or just curious about AI-assisted development as a hobbyist, hopefully this helps (and saves you some pain).

## The Spark: Why JobTrackr?

Job hunting is chaotic — applications disappear into spreadsheets, emails, notes, browser tabs. I wanted one place to track everything: stages, reminders, some AI help for cover letters and prep.  

With zero real dev experience, I used Lovable to generate the frontend (React/Vite/Tailwind/shadcn) and Supabase for auth, storage, and edge functions.  

Early vision: Kanban board + URL auto-fill + events/reminders + CV suitability scores + AI generations.  
No grand plan — just "make something I'd actually use, maybe help a few others, and learn AI along the way".

## The Build Process: What Actually Happened

I didn't grind 4+ hours a day for months — that would be a lie.  
I had intense bursts: a week here, a few late nights there, maybe 4 hours a day for short stretches when I was really into it. Most weeks were 1–2 hours max, sometimes nothing.  

Phases (in rough order):

- **Phase 1: Basics & Cleanup** — Kanban board, search, onboarding tour, density toggle, salary parsing. Fixed fake stats on landing (big mistake — killed trust early).
- **Phase 2: AI & CV** — Added ruthless CV roast (inspired by my own terrible CV feedback). AI assist for cover letters/prep/summaries, integrated CV text.
- **Phase 3: Power Features** — Chrome extension (one-click job capture), email/push reminders, automated testing suite (28 green tests!).
- **Ongoing: Connecting the Dots** — Linking scattered AI tools into "Career Boost" flow (upload CV → roast → fixes → match jobs → generate materials).

Tech stack: React/Vite/Tailwind/shadcn/ui + Supabase + Lovable for AI prompts.  
Total Lovable credits spent: ~50–60 (mostly on iteration, not magic one-shot builds).

## Mistakes & Learnings: The Honest Roast on Myself

I made plenty of dumb moves. Here's the real list — no exaggeration.

- **Mistake #1: Perfectionism before MVP**  
  Spent way too long tweaking glassmorphism and layout before core flows worked. Learning: Ship ugly but functional first. Polish only after real feedback.

- **Mistake #2: Fake stats on landing**  
  Put "10,000+ applications tracked" when it was zero. Got called out hard. Learning: Honesty builds trust — switched to "Unlimited · Free · No Ads · Private by Default".

- **Mistake #3: Scattered AI features**  
  Roast in CV tab, scores on cards, generations in detail panel. Users had to hunt. Learning: Connect tools into journeys — now testing guided "Career Boost" flow.

- **Mistake #4: Ignoring testing early**  
  Pushed buggy versions (OAuth loops, scraping blocks). Learning: Built Vitest/RTL suite + GitHub issues board. Now 28 tests green before any major push.

- **Mistake #5: Underestimating marketing/distribution**  
  Thought "build it and they come". Reality: zero users without outbound posts. Learning: 80% of success is distribution — now using Claude bots to help draft Reddit/X content.

Biggest overall learning: **Feedback is gold, even when it hurts**. Got roasted in critiques (scattered AI, generic landing, no extension) — fixed most. App went from "meh prototype" to something I actually use daily. Use GitHub for issues/docs to track everything professionally.

## Where I'm Headed

Short-term: Get the Chrome extension live in the store + start consistent outbound (Reddit/X/LinkedIn posts) to reach 100–200 real users.  
If 10% convert to Pro (unlimited AI, custom stages, advanced analytics), that's £100–200/mo — realistic first milestone.

Long-term: Turn JobTrackr into a full career accelerator — AI that roasts CVs, matches jobs, generates tailored applications, and maybe evolves into broader self-development tools (ClawBots for automation).  
Self-development goal: Get proficient in building Claude bots in 3 months. Using my new laptop (bought specifically for AI/vibe coding/live coding) to practice daily.

If you're job hunting or tinkering with side projects, try JobTrackr free:  
→ [Demo](https://brs39.lovable.app/demo)  
→ [Feedback (be brutal)](https://forms.gle/YOUR_FEEDBACK_FORM_LINK)

Chrome extension beta soon — follow @BRSAD39 for updates.

Repo (tests/docs tracked there): https://github.com/DJJB39/brs39

What do you think? Mistakes I missed? Tools I should try? Let's chat in replies.

Thanks for reading.
