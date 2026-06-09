import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FEEDBACK_FORM_URL } from "@/lib/constants";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ComparisonTable from "@/components/landing/ComparisonTable";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import ChromeExtensionCTA from "@/components/landing/ChromeExtensionCTA";

/**
 * Cornerman — editorial landing page.
 *
 * Routes are unchanged: /auth (log in), /auth?tab=signup (sign up),
 * /demo (interactive demo), /privacy. Logged-in users are redirected
 * to /app exactly like before.
 *
 * All visual styles are scoped to the `.cornerman` wrapper in index.css
 * so the rest of the app keeps its existing Satoshi + glassmorphism look.
 */
const Landing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/app", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="cornerman cm-grain min-h-screen flex flex-col relative overflow-hidden">
      {/* Halo behind the hero */}
      <div className="cm-halo pointer-events-none absolute top-0 left-0 right-0 h-[600px] z-0" />

      {/* ── Nav ── */}
      <header className="relative z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-baseline gap-2">
            <span className="cm-serif text-xl font-medium">Cornerman</span>
            <span className="cm-mono cm-text-dim text-[10px] uppercase tracking-[0.18em]">/ AI</span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2 text-sm">
            <Link
              to="/demo"
              className="px-3 py-1.5 cm-text-dim hover:text-[color:var(--cm-text)] transition-colors"
            >
              Demo
            </Link>
            <Link
              to="/auth"
              className="px-3 py-1.5 cm-text-dim hover:text-[color:var(--cm-text)] transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/auth?tab=signup"
              className="cm-cta-ghost ml-1 rounded-full px-4 py-1.5 text-sm"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {/* ── 01 / Briefing — Hero ── */}
        <section className="mx-auto max-w-3xl px-6 pt-16 pb-24 sm:pt-24">
          <div className="cm-reveal cm-d1 mb-6 flex items-center gap-3">
            <span className="cm-mono cm-text-amber text-[10px] uppercase tracking-[0.22em]">
              01 / Briefing
            </span>
            <span className="cm-meta-rule flex-1" />
          </div>

          <h1 className="cm-serif cm-reveal cm-d2 text-[40px] sm:text-[56px] lg:text-[72px] leading-[1.02] font-light">
            Walk in having already
            <br />
            <span className="italic">done the interview.</span>
          </h1>

          <p className="cm-reveal cm-d3 mt-8 max-w-xl text-[17px] leading-[1.65] cm-text-dim">
            Cornerman puts you through a ruthless AI mock interview and a brutally
            honest CV roast — so when the real one comes, it feels like a formality.
            Every application tracked underneath, automatically.
          </p>
          <p className="cm-reveal cm-d3 mt-4 max-w-xl text-[14px] leading-[1.65] cm-text-dim italic">
            The Tailor never invents experience. It sharpens what's true.
          </p>

          <div className="cm-reveal cm-d4 mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/demo"
              className="cm-cta-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm"
            >
              <span className="cm-blink h-1.5 w-1.5 rounded-full bg-[color:#1a1107]" />
              Try the interactive demo
            </Link>
            <Link
              to="/auth?tab=signup"
              className="cm-cta-ghost inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm"
            >
              Sign up free
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              to="/roast"
              className="cm-cta-ghost inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm"
            >
              Get roasted free
              <span aria-hidden="true">🔥</span>
            </Link>
          </div>

          <p className="cm-reveal cm-d5 cm-mono cm-text-dim mt-6 text-[11px] uppercase tracking-[0.18em]">
            No card · Skip the demo if you want
          </p>
        </section>

        {/* ── 02 / Sample output — CV roast card ── */}
        <section className="mx-auto max-w-3xl px-6 pb-28">
          <div className="cm-reveal cm-d6 mb-6 flex items-center gap-3">
            <span className="cm-mono cm-text-dim text-[10px] uppercase tracking-[0.22em]">02</span>
            <span className="cm-meta-rule flex-1" />
            <span className="cm-mono cm-text-dim text-[10px] uppercase tracking-[0.22em]">
              Sample output · CV roast
            </span>
          </div>

          <article className="cm-roast-card cm-reveal cm-d7 rounded-2xl p-6 sm:p-8">
            {/* Header */}
            <header className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="cm-serif flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--cm-amber-soft)] cm-text-amber text-lg">
                  C
                </div>
                <div>
                  <p className="cm-mono cm-text-dim text-[10px] uppercase tracking-[0.18em]">
                    Cornerman · CV Roast
                  </p>
                  <p className="text-sm mt-1">
                    Frontend Engineer <span className="cm-text-dim">· Linear</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="cm-mono cm-text-dim text-[10px] uppercase tracking-[0.18em]">Score</p>
                <p className="cm-serif text-[40px] leading-none mt-1">
                  6.2
                  <span className="cm-text-dim text-base"> / 10</span>
                </p>
              </div>
            </header>

            {/* Notes */}
            <div className="mt-8 space-y-5">
              {[
                'Your "led a team of 4" line is doing nothing here. Linear hires people who shipped specific things, not people who managed others. Lead with the ship.',
                "Three bullets reference React. They want to know what you built, at what scale, with what measurable outcome. None of yours have all three.",
                'Cut "passionate about clean code." Everyone says it. Linear will assume it. Use the line for something only you can claim.',
              ].map((note, i) => (
                <p key={i} className="flex gap-3 text-[15px] leading-[1.6]">
                  <span className="cm-text-amber shrink-0 select-none">›</span>
                  <span>{note}</span>
                </p>
              ))}
            </div>

            {/* Footer */}
            <footer className="mt-8 flex items-center justify-between border-t cm-border pt-5">
              <p className="cm-mono cm-text-dim text-[11px] uppercase tracking-[0.18em]">
                12 more notes · 4 line edits · 2 reframes
              </p>
              <Link to="/auth?tab=signup" className="text-sm cm-text-amber hover:underline">
                Open full roast →
              </Link>
            </footer>
          </article>
        </section>

        {/* ── Three pillars — Spar / Roast / Track ── */}
        <section className="mx-auto max-w-5xl px-6 pb-32">
          <div className="grid gap-12 sm:gap-10 sm:grid-cols-3">
            {[
              {
                label: "/ Spar",
                title: "Ruthless mock interviews",
                desc: "Live AI interviewer trained on the role, the company, and the cracks in your CV. It pushes. You answer. You watch the replay.",
              },
              {
                label: "/ Roast",
                title: "Brutally honest CV scoring",
                desc: "Line-by-line critique with a score, the cuts, and the rewrites. The kind of feedback hiring managers think but never send.",
              },
              {
                label: "/ Track",
                title: "Quietly tracked",
                desc: "Every application captured, sorted, and surfaced when it matters. Kanban's there if you want it. It just isn't the point.",
              },
            ].map((pillar) => (
              <div key={pillar.label}>
                <p className="cm-mono cm-text-amber text-[10px] uppercase tracking-[0.22em] mb-4">
                  {pillar.label}
                </p>
                <h3 className="cm-serif text-[22px] leading-[1.2] mb-3">{pillar.title}</h3>
                <p className="text-[15px] leading-[1.65] cm-text-dim">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 02b / Arsenal — full feature grid ── */}
        <FeaturesSection />

        {/* ── 03 / Field — comparison ── */}
        <ComparisonTable />

        {/* ── 04 / Pricing ── */}
        <PricingSection />

        {/* ── 05 / Tape — FAQ ── */}
        <FAQSection />

        {/* ── Chrome extension ── */}
        <ChromeExtensionCTA />

        {/* ── Closing CTA strip ── */}
        <section className="mx-auto max-w-3xl px-6 pb-28 text-center">
          <span className="cm-meta-rule mx-auto mb-10 block w-full max-w-xs" />
          <h2 className="cm-serif text-[28px] sm:text-[36px] leading-[1.15] font-light">
            Stop guessing.
            <br />
            <span className="italic cm-text-amber">Start preparing.</span>
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth?tab=signup"
              className="cm-cta-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm"
            >
              Sign up free
            </Link>
            <Link
              to="/demo"
              className="cm-cta-ghost inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm"
            >
              Or try the demo first
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t cm-border">
        <div className="mx-auto max-w-5xl px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="cm-mono cm-text-dim text-[11px] uppercase tracking-[0.18em]">
            © Cornerman · {new Date().getFullYear()}
          </div>
          <p className="cm-text-dim text-sm cm-serif italic">
            Built for the day the recruiter calls back.
          </p>
          <div className="flex items-center gap-5 text-[11px] cm-mono uppercase tracking-[0.18em]">
            <Link to="/privacy" className="cm-text-dim hover:text-[color:var(--cm-text)] transition-colors">
              Privacy
            </Link>
            {FEEDBACK_FORM_URL && (
              <button
                onClick={() => window.open(FEEDBACK_FORM_URL, "_blank")}
                className="cm-text-dim hover:text-[color:var(--cm-text)] transition-colors"
              >
                Feedback
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
