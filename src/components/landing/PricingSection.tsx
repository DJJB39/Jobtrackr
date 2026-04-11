import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Check,
  Infinity,
  Brain,
  FileUp,
  Bell,
  CalendarDays,
  Download,
  Shield,
  Flame,
  Camera,
  Sparkles,
  Zap,
} from "lucide-react";

const freeFeatures = [
  { icon: Infinity, label: "Unlimited applications" },
  { icon: Flame, label: "AI Interview Coach" },
  { icon: FileUp, label: "CV Roast & suitability" },
  { icon: Camera, label: "Screenshot job capture" },
  { icon: Brain, label: "AI-powered assist" },
  { icon: Bell, label: "Email reminders" },
  { icon: CalendarDays, label: "Calendar & ICS export" },
  { icon: Shield, label: "Private & encrypted" },
];

const proFeatures = [
  { label: "Everything in Free" },
  { label: "Priority AI (faster models)" },
  { label: "Unlimited AI usage" },
  { label: "Advanced analytics" },
  { label: "Priority support" },
];

const PricingSection = () => (
  <motion.section
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.5 }}
    className="mx-auto max-w-4xl px-6 pb-28"
  >
    <h2 className="text-center text-2xl font-display font-bold text-foreground mb-2">
      Pricing
    </h2>
    <p className="text-center text-muted-foreground mb-10 text-sm">
      Every feature you need — free. Upgrade only if you want more speed and power.
    </p>

    <div className="grid gap-6 sm:grid-cols-2">
      {/* Free Card */}
      <div className="rounded-2xl border border-border glass p-8 relative overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">
            Free Forever
          </p>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-5xl font-display font-bold text-foreground">$0</span>
            <span className="text-muted-foreground text-sm">/month</span>
          </div>
          <p className="text-muted-foreground text-sm mb-8">No credit card required</p>

          <ul className="space-y-3 text-left mb-8">
            {freeFeatures.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm text-foreground">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                {item.label}
              </li>
            ))}
          </ul>

          <Button size="lg" className="w-full text-base" asChild>
            <Link to="/auth?tab=signup">Get Started Free</Link>
          </Button>
        </div>
      </div>

      {/* Pro Card */}
      <div className="rounded-2xl border border-primary/30 glass p-8 relative overflow-hidden">
        <div className="absolute -top-20 right-0 w-60 h-60 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute top-4 right-4 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-primary/15 text-primary rounded-full border border-primary/20">
          Coming Soon
        </div>
        <div className="relative z-10">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Pro
          </p>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-5xl font-display font-bold text-foreground">TBD</span>
          </div>
          <p className="text-muted-foreground text-sm mb-8">For power users who want more</p>

          <ul className="space-y-3 text-left mb-8">
            {proFeatures.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm text-foreground">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                {item.label}
              </li>
            ))}
          </ul>

          <Button size="lg" variant="outline" className="w-full text-base" disabled>
            <Zap className="h-4 w-4 mr-1" />
            Notify Me
          </Button>
        </div>
      </div>
    </div>
  </motion.section>
);

export default PricingSection;
