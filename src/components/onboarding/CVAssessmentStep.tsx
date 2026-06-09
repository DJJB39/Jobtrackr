import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Sparkles, Flame, ArrowRight, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { INTENSITY_OPTIONS, type Intensity } from "@/hooks/useRuthlessReview";
import type { CVAssessment } from "@/hooks/useUserCV";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;

interface Props {
  cvText: string;
  initialAssessment?: CVAssessment | null;
  initialScore?: number | null;
  /** "Original" → first pass; "Re-assessed" → after cleanup */
  label?: "Original" | "Re-assessed";
  onComplete: (score: number, assessment: CVAssessment) => Promise<void> | void;
  onCleanupRequest?: () => void;
  ctaLabel?: string;
}

const ScoreRing = ({ score }: { score: number }) => {
  const pct = Math.max(0, Math.min(100, score));
  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;
  const tone = pct >= 75 ? "stroke-emerald-500" : pct >= 50 ? "stroke-amber-500" : "stroke-red-500";
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} className="fill-none stroke-border/30" strokeWidth="8" />
        <circle cx="50" cy="50" r={radius} className={`fill-none ${tone} transition-all duration-700`} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-display tabular-nums text-foreground">{pct}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
};

const CVAssessmentStep = ({ cvText, initialAssessment, initialScore, label = "Original", onComplete, onCleanupRequest, ctaLabel }: Props) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [intensity, setIntensity] = useState<Intensity>(initialAssessment?.intensity ?? "hard");
  const [assessment, setAssessment] = useState<CVAssessment | null>(initialAssessment ?? null);
  const [score, setScore] = useState<number | null>(initialScore ?? null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setAssessment(null);
    setScore(null);
    try {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "cv_assessment", cvText, intensity }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        toast({ title: "Assessment failed", description: data.error ?? "Try again", variant: "destructive" });
        return;
      }
      const result: CVAssessment = {
        intensity,
        score: data.score,
        feedback_md: data.feedback_md,
        strengths: data.strengths ?? [],
        gaps: data.gaps ?? [],
        quick_wins: data.quick_wins ?? [],
      };
      setAssessment(result);
      setScore(result.score);
      await onComplete(result.score, result);
    } catch (e: any) {
      const isNetwork = e instanceof TypeError;
      toast({
        title: isNetwork ? "Couldn't reach the coach" : "Assessment failed",
        description: isNetwork ? "Check your connection and try again" : e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h2 className="text-2xl font-display text-foreground flex items-center gap-2">
          <Flame className="h-6 w-6 text-primary" />
          {label === "Re-assessed" ? "Let's see the new score" : "Time for the brutal truth"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {label === "Re-assessed" ? "Re-running the same assessment on your strengthened CV." : "Pick your intensity. The AI will roast and rate your CV in seconds."}
        </p>
      </div>

      {!assessment && (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Roast intensity</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {INTENSITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setIntensity(opt.value)}
                disabled={loading}
                className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${intensity === opt.value ? "border-primary bg-primary/10 text-foreground shadow-sm" : "border-border/50 text-muted-foreground hover:border-border"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {intensity === "nuclear" && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">⚠️ Nuclear uses harsh language and dark humor. No mercy.</p>
          )}
          <Button onClick={run} disabled={loading} size="lg" className="w-full sm:w-auto gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Assessing…" : "Roast my CV"}
          </Button>
        </div>
      )}

      <AnimatePresence>
        {assessment && score !== null && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-5 rounded-2xl glass p-5">
              <ScoreRing score={score} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label} score · {assessment.intensity}</p>
                <p className="mt-1 text-base font-medium text-foreground">
                  {score >= 75 ? "Solid foundation — there's still room to push." : score >= 50 ? "Mid-tier. Recruiters will scroll past unless we sharpen it." : "Brutal. We can fix this together — keep reading."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setAssessment(null); setScore(null); }} className="gap-1.5 h-8">
                    <RotateCcw className="h-3.5 w-3.5" /> Try a different intensity
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl glass p-5 prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-foreground prose-strong:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90">
              <ReactMarkdown>{assessment.feedback_md}</ReactMarkdown>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {onCleanupRequest && (
                <Button onClick={onCleanupRequest} size="lg" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  {ctaLabel ?? "Clean & Strengthen my CV"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CVAssessmentStep;
