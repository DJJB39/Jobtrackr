import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Sparkles, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import BeforeAfterDiff from "./BeforeAfterDiff";
import type { CVAssessment, CVCleanupDiff, CVCleanupSection } from "@/hooks/useUserCV";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;

type SectionWithAccept = CVCleanupSection & { accepted: boolean };

interface Props {
  originalText: string;
  assessment: CVAssessment | null;
  onApply: (cleanedText: string, diff: CVCleanupDiff) => Promise<void> | void;
  onSkip: () => void;
}

/**
 * Builds the final cleaned CV by replacing each accepted "before" with its "after"
 * inside the AI's cleaned_text — falls back to original text if before is missing.
 */
function applyAccepted(cleanedBaseline: string, sections: SectionWithAccept[], original: string): string {
  let out = cleanedBaseline || original;
  for (const s of sections) {
    if (s.accepted) continue; // keep the AI version (already in cleaned_text)
    // Rejected → revert this section's "after" back to "before" in the cleaned text
    if (s.before && out.includes(s.after)) {
      out = out.replace(s.after, s.before);
    }
  }
  return out;
}

const CVCleanupStep = ({ originalText, assessment, onApply, onSkip }: Props) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [diff, setDiff] = useState<CVCleanupDiff | null>(null);
  const [sections, setSections] = useState<SectionWithAccept[]>([]);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!session?.access_token) return;
      setLoading(true);
      try {
        const resp = await fetch(AI_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "cv_cleanup", originalText, assessment }),
        });
        const data = await resp.json();
        if (cancelled) return;
        if (!resp.ok) {
          toast({ title: "Cleanup failed", description: data.error ?? "Try again", variant: "destructive" });
          return;
        }
        const newDiff: CVCleanupDiff = {
          cleaned_text: data.cleaned_text,
          sections: data.sections ?? [],
          risk_notes: data.risk_notes ?? [],
        };
        setDiff(newDiff);
        setSections(newDiff.sections.map((s) => ({ ...s, accepted: true })));
      } catch (e: any) {
        toast({ title: "Cleanup failed", description: e.message, variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [originalText, assessment, session, toast]);

  const acceptedCount = sections.filter((s) => s.accepted).length;

  const handleApply = async () => {
    if (!diff) return;
    setApplying(true);
    try {
      const finalText = applyAccepted(diff.cleaned_text, sections, originalText);
      const finalDiff: CVCleanupDiff = { ...diff, cleaned_text: finalText, sections };
      await onApply(finalText, finalDiff);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="text-center">
          <p className="font-display text-lg text-foreground">Strengthening your CV…</p>
          <p className="mt-1 text-sm text-muted-foreground">Sharpening every bullet without inventing anything new.</p>
        </div>
      </div>
    );
  }

  if (!diff || sections.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border/50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
          <p className="mt-3 font-display text-lg text-foreground">Nothing meaningful to rewrite</p>
          <p className="mt-1 text-sm text-muted-foreground">Your CV is already tight at the line level. The score gains from here come from adding evidence, not rephrasing.</p>
        </div>
        <div className="flex justify-end">
          <Button onClick={onSkip} size="lg" className="gap-2">Continue <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h2 className="text-2xl font-display text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Clean & Strengthen
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {sections.length} sections rewritten. Accept, reject, or edit each one. We never invent new facts.
        </p>
      </div>

      {diff.risk_notes.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" /> Honesty notes
          </p>
          <ul className="mt-2 space-y-1 text-xs text-foreground/90">
            {diff.risk_notes.map((n, i) => (<li key={i}>• {n}</li>))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {sections.map((s, i) => (
          <BeforeAfterDiff key={i} section={s} onChange={(next) => setSections((prev) => prev.map((p, j) => j === i ? next : p))} />
        ))}
      </div>

      <div className="sticky bottom-0 flex flex-col gap-2 rounded-2xl border border-border/50 bg-background/80 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{acceptedCount} of {sections.length} changes accepted</p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onSkip} disabled={applying}>Skip cleanup</Button>
          <Button onClick={handleApply} disabled={applying} className="gap-2">
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Apply & re-score
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default CVCleanupStep;
