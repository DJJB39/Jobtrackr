import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Link } from "react-router-dom";

const FREE_FEATURES = [
  "Kanban board with drag & drop",
  "Up to 10 active applications",
  "Basic CV upload",
  "CSV import/export",
  "Calendar view",
  "Chrome extension",
];

const PRO_FEATURES = [
  "Everything in Free, plus:",
  "Unlimited applications",
  "AI interview coaching (all roast levels)",
  "AI CV roast & tailoring",
  "Screenshot-to-job extraction",
  "Day-before bootcamp prep",
  "Advanced analytics & insights",
  "Priority support",
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const { user } = useAuth();
  const { openCheckout, loading } = usePaddleCheckout();
  const { isPro, isCanceling, periodEnd } = useSubscription();

  const handleUpgrade = () => {
    const priceId = billing === "monthly" ? "pro_monthly" : "pro_yearly";
    openCheckout({
      priceId,
      customerEmail: user?.email ?? undefined,
      customData: { userId: user?.id ?? "" },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--gradient-start))] via-background to-[hsl(var(--gradient-end))]">
      <PaymentTestModeBanner />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Badge variant="outline" className="mb-4 border-primary/40 text-primary">
            <Sparkles className="h-3 w-3 mr-1" /> Pricing
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-3">
            Supercharge your job search
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Free forever for basics. Upgrade for unlimited AI coaching,
            CV roasts, and interview prep.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billing === "monthly"
                ? "bg-card text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              billing === "yearly"
                ? "bg-card text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Yearly
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
              Save 25%
            </Badge>
          </button>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass-card h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Free</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">£0</span>
                  <span className="text-sm text-muted-foreground">/forever</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Everything you need to start tracking
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {!user && (
                  <Button variant="outline" className="w-full mt-6" asChild>
                    <Link to="/auth?tab=signup">Get Started</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pro */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card h-full border-primary/30 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-amber-400" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Pro</h3>
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                    Most Popular
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">
                    £{billing === "monthly" ? "8" : "6"}
                  </span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                {billing === "yearly" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    £72 billed yearly · Save £24
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isPro ? (
                  <div className="mt-6 text-center">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      Current Plan
                    </Badge>
                    {isCanceling && periodEnd && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Access until {new Date(periodEnd).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <Button
                    className="w-full mt-6 gap-2 shadow-glow"
                    onClick={handleUpgrade}
                    disabled={loading}
                  >
                    {loading ? "Loading…" : (
                      <>
                        Upgrade to Pro <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to={user ? "/app" : "/"}>
              ← Back to {user ? "app" : "home"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
