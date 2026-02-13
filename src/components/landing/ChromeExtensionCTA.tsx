import { motion } from "framer-motion";
import { Chrome, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChromeExtensionCTA = () => (
  <motion.section
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.5 }}
    className="mx-auto max-w-3xl px-6 pb-28"
  >
    <div className="rounded-2xl border border-border glass p-8 sm:p-10 relative overflow-hidden text-center">
      {/* Glow */}
      <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-status-found/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary border border-border">
          <Chrome className="h-7 w-7 text-foreground" />
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">
          Chrome Extension — Coming Soon
        </h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
          Save jobs directly from LinkedIn, Indeed, and Glassdoor with one click.
          Auto-fill details and add to your board instantly — no tab switching.
        </p>
        <Button variant="outline" size="lg" className="text-base gap-2" disabled>
          <Chrome className="h-4 w-4" />
          Notify Me When It's Ready
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-[10px] text-muted-foreground mt-3 font-mono">
          ETA: Q2 2026
        </p>
      </div>
    </div>
  </motion.section>
);

export default ChromeExtensionCTA;
