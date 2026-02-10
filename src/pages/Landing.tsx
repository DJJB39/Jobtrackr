import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Columns3,
  BarChart3,
  Search,
  StickyNote,
  CheckCircle2,
} from "lucide-react";

const features = [
  { icon: Columns3, title: "Kanban Board", desc: "Drag-and-drop cards across 8 stages from Found to Accepted." },
  { icon: StickyNote, title: "Detailed Views", desc: "Notes, contacts, next steps, and links for every application." },
  { icon: BarChart3, title: "Stats Dashboard", desc: "Response rates, weekly volume, and stage breakdowns at a glance." },
  { icon: Search, title: "Organized & Private", desc: "Your data is secure and accessible only to you." },
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
          <Button variant="ghost" asChild>
            <Link to="/auth">Log In</Link>
          </Button>
          <Button asChild>
            <Link to="/auth?tab=signup">Sign Up Free</Link>
          </Button>
        </div>
      </div>
    </header>

    {/* Hero */}
    <main className="flex-1">
      <section className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-status-accepted" />
          Free to use · No credit card required
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          JobTrackr – Organize
          <br />
          <span className="text-accent">Your Job Hunt</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Track applications, notes, contacts, and progress in one place.
          Move fast, stay organized, land the job.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button size="lg" className="text-base px-8" asChild>
            <Link to="/auth?tab=signup">Sign Up Free</Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base px-8" asChild>
            <Link to="/auth">Log In</Link>
          </Button>
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
    </main>

    {/* Footer */}
    <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} JobTrackr. Built with Lovable.
    </footer>
  </div>
);

export default Landing;
