import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { TourStep } from "@/hooks/useOnboardingTour";

interface OnboardingTourProps {
  active: boolean;
  step: number;
  currentStep: TourStep;
  totalSteps: number;
  onAdvance: () => void;
  onSkip: (neverShow: boolean) => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const OnboardingTour = ({ active, step, currentStep, totalSteps, onAdvance, onSkip }: OnboardingTourProps) => {
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [neverShow, setNeverShow] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updateRect = useCallback(() => {
    if (!currentStep) return;
    const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    } else {
      setRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!active) return;
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [active, updateRect, step]);

  if (!active || !rect) return null;

  const padding = 8;
  const isLastStep = step === totalSteps - 1;

  // Position tooltip below or above the target
  const tooltipTop = rect.top + rect.height + padding + 12;
  const tooltipLeft = Math.max(16, Math.min(rect.left, window.innerWidth - 340));

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="tour-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100]"
        >
          {/* Backdrop with spotlight cutout using CSS clip-path */}
          <div
            className="absolute inset-0 bg-black/60"
            style={{
              clipPath: `polygon(
                0% 0%, 100% 0%, 100% 100%, 0% 100%,
                0% ${rect.top - padding}px,
                ${rect.left - padding}px ${rect.top - padding}px,
                ${rect.left - padding}px ${rect.top + rect.height + padding}px,
                ${rect.left + rect.width + padding}px ${rect.top + rect.height + padding}px,
                ${rect.left + rect.width + padding}px ${rect.top - padding}px,
                0% ${rect.top - padding}px
              )`,
            }}
          />

          {/* Spotlight border glow */}
          <div
            className="absolute rounded-xl border-2 border-primary/60 pointer-events-none"
            style={{
              top: rect.top - padding,
              left: rect.left - padding,
              width: rect.width + padding * 2,
              height: rect.height + padding * 2,
              boxShadow: "0 0 20px hsl(var(--primary) / 0.3)",
            }}
          />

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute w-80 rounded-xl border border-border bg-card p-4 shadow-xl"
            style={{ top: tooltipTop, left: tooltipLeft }}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-foreground">{currentStep.title}</h3>
              <span className="text-[10px] font-mono text-muted-foreground">
                {step + 1} / {totalSteps}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{currentStep.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSkip(neverShow)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip tour
                </button>
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id="never-show"
                    checked={neverShow}
                    onCheckedChange={(v) => setNeverShow(!!v)}
                    className="h-3 w-3"
                  />
                  <label htmlFor="never-show" className="text-[10px] text-muted-foreground cursor-pointer">
                    Don't show again
                  </label>
                </div>
              </div>
              <Button size="sm" onClick={onAdvance} className="h-7 text-xs px-4">
                {isLastStep ? "Got it!" : "Next"}
              </Button>
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour;
