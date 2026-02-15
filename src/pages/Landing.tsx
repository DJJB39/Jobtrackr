import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Briefcase,
  Columns3,
  Link2,
  CheckCircle2,
  CalendarDays,
  Shield,
  Play,
  ArrowRight,
  Sparkles,
  FileUp,
  Brain,
} from "lucide-react";
import screenshotKanban from "@/assets/screenshot-kanban.png";
import screenshotDetail from "@/assets/screenshot-detail.png";
import screenshotDashboard from "@/assets/screenshot-dashboard.png";
import ComparisonTable from "@/components/landing/ComparisonTable";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import ChromeExtensionCTA from "@/components/landing/ChromeExtensionCTA";
import { FEEDBACK_FORM_URL, LOOM_DEMO_URL } from "@/lib/constants";

/* ── Helpers ── */
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 as const },
  transition: { duration: 0.5 },
};

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

/* ── Data ── */
const features = [
  { icon: Columns3, title: "Kanban Board", desc: "Drag and drop applications across 8 stages. Filter by role, type, or stage." },
  { icon: Link2, title: "URL Auto-Fill", desc: "Paste a job posting link and auto-fill company, role, salary, and deadline." },
  { icon: CalendarDays, title: "Events & Reminders", desc: "Schedule interviews, deadlines, and follow-ups. Export to Google Calendar." },
  { icon: FileUp, title: "CV Upload", desc: "Upload your CV and get an AI suitability score against any job description." },
  { icon: Brain, title: "AI Assist", desc: "Generate cover letters, interview prep, and job summaries with one click." },
  { icon: Shield, title: "Private & Secure", desc: "Your data is encrypted and accessible only to you. No sharing, no ads." },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Paste a Job URL", desc: "Drop a link from any job board and we auto-fill company, role, salary, and deadline." },
  { step: "2", title: "Drag to Track", desc: "Move applications across stages — from Found to Offer — with a simple drag and drop." },
  { step: "3", title: "Stay on Top", desc: "Schedule interviews, set follow-up reminders, and never miss a deadline again." },
];

const stats = [
  { value: "Unlimited", label: "Applications" },
  { value: "100%", label: "Free Forever" },
  { value: "Zero", label: "Ads, Ever" },
  { value: "Private", label: "By Default" },
];

/* ── Component ── */
const Landing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/app", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
  <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
    {/* Background grid pattern */}
    <div
      className="fixed inset-0 pointer-events-none opacity-[0.03]"
      style={{
        backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.15) 1px, transparent 1px),
                          linear-gradient(90deg, hsl(var(--foreground) / 0.15) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }}
    />
    {/* Top glow */}
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />

    {/* Nav */}
    <header className="glass sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-glow">
            <Briefcase className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-display tracking-tight text-foreground">JobTrackr</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/demo" className="gap-1.5">
              <Play className="h-3.5 w-3.5" />
              Try Demo
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/auth">Log In</Link>
          </Button>
          <Button asChild>
            <Link to="/auth?tab=signup">Sign Up Free</Link>
          </Button>
        </div>
      </div>
    </header>

    <main className="flex-1 relative z-10">
      {/* ── Hero ── */}
      <motion.section
        {...fadeUp}
        className="mx-auto max-w-4xl px-6 pt-24 pb-16 text-center sm:pt-32"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border glass px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-status-accepted" />
          Free to use · No credit card required
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Stop Losing Track of{" "}
          <span className="text-gradient">Applications</span>
        </h1>
        <p className="mt-4 text-xl font-medium text-primary sm:text-2xl font-display">
          Your entire job search, one board.
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Paste a job link and auto-fill the details. Drag applications through stages.
          Set reminders so nothing slips. Private by default — only you see your data.
        </p>
        <div className="mx-auto mt-8 max-w-lg rounded-xl border border-border glass overflow-hidden shadow-glow">
          <iframe
            src={`${LOOM_DEMO_URL}?autoplay=1&mute=1&hide_owner=true&hide_share=true&hide_title=true`}
            className="w-full aspect-video"
            allowFullScreen
            allow="autoplay"
            title="JobTrackr demo video"
          />
        </div>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="text-base px-8 shadow-glow" asChild>
            <Link to="/auth?tab=signup">
              <Sparkles className="h-4 w-4 mr-1" />
              Sign Up Free
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base px-8 gap-2" asChild>
            <Link to="/demo">
              <Play className="h-4 w-4" />
              Try Interactive Demo
            </Link>
          </Button>
        </div>
      </motion.section>

      {/* ── Stats ── */}
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mx-auto max-w-3xl px-6 pb-20"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-display font-bold text-gradient">
                {s.value}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Hero Screenshot ── */}
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="mx-auto max-w-5xl px-6 pb-28"
      >
        <div className="rounded-xl border border-border glass overflow-hidden shadow-glow-lg">
          <div className="bg-secondary/50 h-8 flex items-center gap-1.5 px-4 border-b border-border">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-primary/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-status-accepted/50" />
            <span className="ml-3 text-[10px] font-mono text-muted-foreground">jobtrackr.app</span>
          </div>
          <img
            src={screenshotKanban}
            alt="JobTrackr Kanban board showing job applications organized by stage"
            className="w-full"
            loading="lazy"
          />
        </div>

        {/* Smaller previews */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {[
            { src: screenshotDetail, alt: "Application detail panel with notes and events" },
            { src: screenshotDashboard, alt: "Dashboard with application statistics and charts" },
          ].map((s) => (
            <div
              key={s.alt}
              className="rounded-lg border border-border glass overflow-hidden transition-transform hover:scale-[1.02]"
            >
              <div className="bg-secondary/50 h-6 flex items-center gap-1.5 px-3 border-b border-border">
                <div className="h-2 w-2 rounded-full bg-destructive/40" />
                <div className="h-2 w-2 rounded-full bg-primary/40" />
                <div className="h-2 w-2 rounded-full bg-status-accepted/40" />
              </div>
              <img src={s.src} alt={s.alt} className="w-full" loading="lazy" />
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── How It Works ── */}
      <motion.section {...fadeUp} className="mx-auto max-w-5xl px-6 pb-28">
        <h2 className="text-center text-2xl font-display font-bold text-foreground mb-2">
          How It Works
        </h2>
        <p className="text-center text-muted-foreground mb-10 text-sm">
          Three steps. Zero friction.
        </p>
        <div className="grid gap-6 sm:grid-cols-3">
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div
              key={item.step}
              {...stagger}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative rounded-xl border border-border glass p-6 text-center glow-hover"
            >
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-display font-bold text-primary-foreground shadow-glow">
                {item.step}
              </div>
              <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              {i < HOW_IT_WORKS.length - 1 && (
                <ArrowRight className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 z-10" />
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Features ── */}
      <motion.section {...fadeUp} className="mx-auto max-w-5xl px-6 pb-28">
        <h2 className="text-center text-2xl font-display font-bold text-foreground mb-2">
          Everything You Need
        </h2>
        <p className="text-center text-muted-foreground mb-10 text-sm">
          Built for job seekers who mean business.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              {...stagger}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-xl border border-border glass p-6 glow-hover"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Demo CTA ── */}
      <motion.section
        {...fadeUp}
        className="mx-auto max-w-3xl px-6 pb-28 text-center"
      >
        <div className="rounded-2xl border border-border glass p-10 relative overflow-hidden">
          <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <Play className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">
              See it in action
            </h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Try the full interactive demo with sample data — no signup required.
            </p>
            <Button size="lg" variant="outline" className="text-base px-8 gap-2" asChild>
              <Link to="/demo">
                <Play className="h-4 w-4" />
                Launch Demo
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* ── Comparison ── */}
      <ComparisonTable />

      {/* ── Pricing ── */}
      <PricingSection />

      {/* ── FAQ ── */}
      <FAQSection />

      {/* ── Chrome Extension ── */}
      <ChromeExtensionCTA />

      {/* ── Final CTA ── */}
      <motion.section
        {...fadeUp}
        className="mx-auto max-w-3xl px-6 py-20 text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          Ready to take control of your job search?
        </h2>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="text-base px-10 shadow-glow" asChild>
            <Link to="/auth?tab=signup">Sign Up Free</Link>
          </Button>
          <Button size="lg" variant="ghost" className="text-base gap-2" asChild>
            <Link to="/demo">
              <Play className="h-4 w-4" />
              Or try the demo first
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">It's free. No credit card required.</p>
      </motion.section>
    </main>

    {/* Footer */}
    <footer className="border-t border-border py-6 px-6">
      <div className="mx-auto max-w-6xl flex items-center justify-between text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} JobTrackr. Built with Lovable.</span>
        <button
          onClick={() => window.open(FEEDBACK_FORM_URL, "_blank")}
          className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 text-xs"
        >
          Feedback
        </button>
      </div>
    </footer>
  </div>
  );
};

export default Landing;
