import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Columns3,
  Link2,
  CheckCircle2,
  CalendarDays,
  Shield,
  Play,
  ArrowRight,
} from "lucide-react";
import screenshotKanban from "@/assets/screenshot-kanban.png";
import screenshotDetail from "@/assets/screenshot-detail.png";
import screenshotDashboard from "@/assets/screenshot-dashboard.png";

const features = [
  { icon: Columns3, title: "Kanban Board", desc: "Drag and drop applications across 8 stages, from Found to Accepted. Filter by role, type, or stage." },
  { icon: Link2, title: "URL Auto-Fill", desc: "Paste a job posting link and auto-fill company, role, salary, and deadline — no manual entry." },
  { icon: CalendarDays, title: "Events & Reminders", desc: "Schedule interviews, deadlines, and follow-ups. Export to Google Calendar or download ICS files." },
  { icon: Shield, title: "Private & Secure", desc: "Your data is encrypted and accessible only to you. No sharing, no selling, no ads." },
];

const screenshots = [
  { src: screenshotKanban, caption: "Kanban Board" },
  { src: screenshotDetail, caption: "Application Details" },
  { src: screenshotDashboard, caption: "Stats Dashboard" },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Paste a Job URL", desc: "Drop a link from any job board and we auto-fill company, role, salary, and deadline." },
  { step: "2", title: "Drag to Track", desc: "Move applications across stages — from Found to Offer — with a simple drag and drop." },
  { step: "3", title: "Stay on Top", desc: "Schedule interviews, set follow-up reminders, and never miss a deadline again." },
];

const Landing = () => (
  <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-secondary to-background">
    {/* Nav */}
    <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Briefcase className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">JobTrackr</span>
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

    <main className="flex-1">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-status-accepted" />
          Free to use · No credit card required
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Stop Losing Track of Applications
        </h1>
        <p className="mt-4 text-xl font-medium text-accent sm:text-2xl">
          Your entire job search, one board.
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Paste a job link and auto-fill the details. Drag applications through stages.
          Set reminders so nothing slips. Private by default — only you see your data.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="text-base px-8" asChild>
            <Link to="/auth?tab=signup">Sign Up Free</Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base px-8 gap-2" asChild>
            <Link to="/demo">
              <Play className="h-4 w-4" />
              Try Interactive Demo
            </Link>
          </Button>
        </div>
      </section>

      {/* Screenshots */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {screenshots.map((s) => (
            <div key={s.caption}>
              <div className="group rounded-xl border border-border bg-card overflow-hidden shadow-lg transition-transform hover:scale-[1.02]">
                <div className="bg-muted/50 h-7 flex items-center gap-1.5 px-3 border-b border-border">
                  <div className="h-2 w-2 rounded-full bg-destructive/40" />
                  <div className="h-2 w-2 rounded-full bg-accent/40" />
                  <div className="h-2 w-2 rounded-full bg-primary/40" />
                </div>
                <div className="aspect-video overflow-hidden">
                  <img src={s.src} alt={s.caption} className="w-full h-full object-cover object-top" />
                </div>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground font-medium">{s.caption}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="text-center text-lg font-semibold text-foreground mb-10">How It Works</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {HOW_IT_WORKS.map((item, i) => (
            <div key={item.step} className="relative rounded-xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {item.step}
              </div>
              <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              {i < HOW_IT_WORKS.length - 1 && (
                <ArrowRight className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 z-10" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <f.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Ready to take control of your job search?</h2>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="text-base px-10" asChild>
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
      </section>
    </main>

    {/* Footer */}
    <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} JobTrackr. Built with Lovable.
    </footer>
  </div>
);

export default Landing;
