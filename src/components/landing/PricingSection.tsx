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
} from "lucide-react";

const included = [
  { icon: Infinity, label: "Unlimited applications" },
  { icon: Brain, label: "AI-powered assist" },
  { icon: FileUp, label: "CV upload & suitability" },
  { icon: Bell, label: "Email reminders" },
  { icon: CalendarDays, label: "Calendar & events" },
  { icon: Download, label: "ICS export" },
  { icon: Shield, label: "Private & encrypted" },
];

const PricingSection = () => (
  <motion.section
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.5 }}
    className="mx-auto max-w-lg px-6 pb-28"
  >
    <h2 className="text-center text-2xl font-display font-bold text-foreground mb-2">
      Pricing
    </h2>
    <p className="text-center text-muted-foreground mb-10 text-sm">
      No tricks. No tiers. Everything's included.
    </p>

    <div className="rounded-2xl border border-border glass p-8 text-center relative overflow-hidden">
      {/* Glow accent */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">
          Forever
        </p>
        <div className="flex items-baseline justify-center gap-1 mb-1">
          <span className="text-5xl font-display font-bold text-foreground">$0</span>
          <span className="text-muted-foreground text-sm">/month</span>
        </div>
        <p className="text-muted-foreground text-sm mb-8">No credit card required</p>

        <ul className="space-y-3 text-left max-w-xs mx-auto mb-8">
          {included.map((item) => (
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
  </motion.section>
);

export default PricingSection;
