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
  Shield,
  Flame,
  Camera,
  Crown,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  { label: "Unlimited AI usage" },
  { label: "All roast levels unlocked" },
  { label: "AI CV tailoring per job" },
  { label: "Day-before bootcamp prep" },
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
      Every feature you need — free. Upgrade for unlimited AI power.
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
            <span className="text-5xl font-display font-bold text-foreground">£0</span>
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
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-4 w-4 text-primary" />
            <p className="text-xs font-mono uppercase tracking-widest text-primary">
              Pro
            </p>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] ml-auto">
              Popular
            </Badge>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-5xl font-display font-bold text-foreground">£6</span>
            <span className="text-muted-foreground text-sm">/month</span>
          </div>
          <p className="text-muted-foreground text-sm mb-8">
            £72/yr · Save 25% vs monthly
          </p>

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

          <Button size="lg" className="w-full text-base gap-2" asChild>
            <Link to="/pricing">
              Upgrade to Pro <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  </motion.section>
);

export default PricingSection;
