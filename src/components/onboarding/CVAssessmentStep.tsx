import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Sparkles, Flame, ArrowRight, RotateCcw, AlertTriangle, CheckSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { INTENSITY_OPTIONS, type Intensity } from "@/hooks/useRuthlessReview";
import type { CVAssessment } from "@/hooks/useUserCV";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;

const PROGRESS_LINES = [
  "Reading the new CV…",
  "Scoring…",
  "Writing the verdict…",
];

/** Strip "# Score: X/10", "Score: 7/10", "**Score**: 70/100" etc. — gauge is the single source of truth. */
const stripScoreLines = (md: string) =>
  md
    .replace(/^\s*#{1,6}\s*Score\s*[:：].*$/gim, "")
    .replace(/^\s*\**\s*Score\s*[:：]\s*\d+\s*\/?\s*\d*\s*\**\s*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/** Normalise any score to a 0-100 integer. */
const normaliseScore = (raw: unknown): number => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  const scaled = n > 0 && n <= 10 ? n * 10 : n;
  return Math.max(0, Math.min(100, Math.round(scaled)));
};

/** Split markdown by `## Heading`. Returns ordered sections. */
const splitSections = (md: string) => {
  const cleaned = stripScoreLines(md);
  const parts = cleaned.split(/^\s*##\s+/m).map((s) => s.trim()).filter(Boolean);
  // If the first segment has no heading marker, it's preamble — keep separately.
  const sections: { title: string; body: string }[] = [];
  let preamble = "";
  if (!/^##\s/m.test(cleaned) && parts.length === 1) {
    return { preamble: parts[0], sections };
  }
  // Re-split keeping the first chunk (before first ##) as preamble.
  const firstHeadingIdx = cleaned.search(/^\s*##\s+/m);
  if (firstHeadingIdx > 0) preamble = cleaned.slice(0, firstHeadingIdx).trim();
  const rest = firstHeadingIdx >= 0 ? cleaned.slice(firstHeadingIdx) : "";
  const matches = [...rest.matchAll(/^\s*##\s+(.+?)\s*$/gm)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const title = m[1].replace(/[#*]+/g, "").trim();
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? rest.length) : rest.length;
    const body = rest.slice(start, end).trim();
    sections.push({ title, body });
  }
  return { preamble, sections };
};

/** Parse a markdown ordered/unordered list into items (strips numbering and bullet markers). */
const parseChecklist = (md: string): string[] =>
  md
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, "").trim())
    .filter((l) => l.length > 0 && !/^#{1,6}\s/.test(l));

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
  const tone = pct >= 75 ? "stroke-emerald-500" : pct >= 50 ? "stroke-primary" : "stroke-red-500";
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} className="fill-none stroke-border/30" strokeWidth="8" />
        <circle cx="50" cy="50" r={radius} className={`fill-none ${tone} transition-all duration-700`} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl tabular-nums text-foreground" style={{ fontFamily: "Fraunces, serif" }}>{pct}</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono">/ 100</span>
      </div>
    </div>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[11px] uppercase tracking-[0.22em] font-mono text-primary mb-3">{children}</h3>
);

const proseClass =
  "prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-li:my-1 prose-strong:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90";
const bodyFont = { fontFamily: "'IBM Plex Sans', system-ui, sans-serif" } as const;

const isChecklistTitle = (t: string) =>
  /immediate\s+action|action\s+checklist|checklist/i.test(t);

const ChecklistCard = ({ items }: { items: string[] }) => (
  <div className="rounded-2xl border border-primary/40 bg-primary/[0.06] p-5 shadow-sm">
    <div className="flex items-center gap-2 mb-4">
      <CheckSquare className="h-4 w-4 text-primary" />
      <SectionLabel>Immediate Action Checklist</SectionLabel>
    </div>
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3" style={bodyFont}>
          <span className="mt-[3px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary/50 bg-background/40">
            <span className="block h-1.5 w-1.5 rounded-sm bg-primary/70" />
          </span>
          <span className="text-sm text-foreground/95 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const ProgressState = ({ elapsedLong }: { elapsedLong: boolean }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % PROGRESS_LINES.length), 1600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-2xl glass p-6 space-y-3">
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground"
          >
            {PROGRESS_LINES[idx]}
          </motion.span>
        </AnimatePresence>
      </div>
      {elapsedLong && (
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-amber-500/80">
          Taking longer than usual. Still working.
        </p>
      )}
    </div>
  );
};

const CVAssessmentStep = ({ cvText, initialAssessment, initialScore, label = "Original", onComplete, onCleanupRequest, ctaLabel }: Props) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [intensity, setIntensity] = useState<Intensity>(initialAssessment?.intensity ?? "hard");
  // On re-assessment, the parent passes the OLD assessment with a null score.
  // Treat that as "no current assessment" so we auto-run instead of showing stale feedback.
  const isReassessPending = label === "Re-assessed" && (initialScore == null);
  const [assessment, setAssessment] = useState<CVAssessment | null>(isReassessPending ? null : (initialAssessment ?? null));
  const [score, setScore] = useState<number | null>(initialScore != null ? normaliseScore(initialScore) : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedLong, setElapsedLong] = useState(false);
  const longTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-assessment auto-runs so the user is never stuck on a dead screen.
  const autoRunRef = useRef(false);
  useEffect(() => {
    if (isReassessPending && !autoRunRef.current && cvText && cvText.trim().length >= 50) {
      autoRunRef.current = true;
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReassessPending, cvText]);

  const run = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);
    setElapsedLong(false);
    setAssessment(null);
    setScore(null);
    if (longTimerRef.current) clearTimeout(longTimerRef.current);
    longTimerRef.current = setTimeout(() => setElapsedLong(true), 15000);
    try {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "cv_assessment", cvText, intensity }),
      });
      const data = await resp.json().catch(() => ({ error: `Server returned ${resp.status} with no body` }));
      if (!resp.ok) {
        const msg = data?.error || `Assessment failed (HTTP ${resp.status})`;
        console.error("cv_assessment failed", resp.status, data);
        setError(msg);
        toast({ title: "Assessment failed", description: msg, variant: "destructive" });
        return;
      }
      const normalised = normaliseScore(data.score);
      const cleanedFeedback = typeof data.feedback_md === "string" ? stripScoreLines(data.feedback_md) : "";
      const result: CVAssessment = {
        intensity,
        score: normalised,
        feedback_md: cleanedFeedback,
        strengths: data.strengths ?? [],
        gaps: data.gaps ?? [],
        quick_wins: data.quick_wins ?? [],
      };
      setAssessment(result);
      setScore(result.score);
      await onComplete(result.score, result);
    } catch (e: any) {
      const isNetwork = e instanceof TypeError;
      const msg = isNetwork ? "Couldn't reach the coach. Check your connection and try again." : (e?.message ?? "Unknown error");
      console.error("cv_assessment threw", e);
      setError(msg);
      toast({ title: isNetwork ? "Couldn't reach the coach" : "Assessment failed", description: msg, variant: "destructive" });
    } finally {
      if (longTimerRef.current) { clearTimeout(longTimerRef.current); longTimerRef.current = null; }
      setLoading(false);
    }
  };

  useEffect(() => () => {
    if (longTimerRef.current) clearTimeout(longTimerRef.current);
  }, []);

  const parsed = useMemo(() => (assessment?.feedback_md ? splitSections(assessment.feedback_md) : null), [assessment?.feedback_md]);
  const checklistSection = parsed?.sections.find((s) => isChecklistTitle(s.title));
  const otherSections = parsed?.sections.filter((s) => !isChecklistTitle(s.title)) ?? [];
  const checklistItems = checklistSection ? parseChecklist(checklistSection.body) : (assessment?.quick_wins ?? []);

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

      {loading && <ProgressState elapsedLong={elapsedLong} />}

      {!loading && error && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/[0.08] p-5 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-destructive mb-1">Assessment failed</p>
              <p className="text-sm text-foreground/90" style={bodyFont}>{error}</p>
            </div>
          </div>
          <Button onClick={run} size="sm" className="gap-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}

      {!assessment && !loading && !error && (
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
        {assessment && score !== null && !loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-5 rounded-2xl glass p-5">
              <ScoreRing score={score} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">{label} score · {assessment.intensity}</p>
                <p className="mt-1 text-base font-medium text-foreground" style={bodyFont}>
                  {score >= 75 ? "Solid foundation — there's still room to push." : score >= 50 ? "Mid-tier. Recruiters will scroll past unless we sharpen it." : "Brutal. We can fix this together — keep reading."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setAssessment(null); setScore(null); setError(null); autoRunRef.current = false; }} className="gap-1.5 h-8">
                    <RotateCcw className="h-3.5 w-3.5" /> Try a different intensity
                  </Button>
                </div>
              </div>
            </div>

            {checklistItems.length > 0 && <ChecklistCard items={checklistItems} />}

            {parsed?.preamble && (
              <div className="rounded-2xl glass p-5" style={bodyFont}>
                <div className={proseClass}>
                  <ReactMarkdown>{parsed.preamble}</ReactMarkdown>
                </div>
              </div>
            )}

            {otherSections.map((s, i) => (
              <div key={i} className="rounded-2xl glass p-5">
                <SectionLabel>{s.title}</SectionLabel>
                <div className={proseClass} style={bodyFont}>
                  <ReactMarkdown>{s.body}</ReactMarkdown>
                </div>
              </div>
            ))}

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
