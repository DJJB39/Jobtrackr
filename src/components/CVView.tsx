import { useState, useCallback, useEffect, Component } from "react";
import CVUploadSection from "@/components/CVUploadSection";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2, FileText, CheckCircle2, Flame, Copy, RefreshCw, AlertTriangle, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { JobApplication } from "@/types/job";
import { COLUMNS } from "@/types/job";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import ReactMarkdown from "react-markdown";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;

type Intensity = "soft" | "medium" | "hard" | "nuclear";

const INTENSITY_OPTIONS: { value: Intensity; label: string; color: string }[] = [
  { value: "soft", label: "Soft", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 data-[state=on]:bg-emerald-500 data-[state=on]:text-white" },
  { value: "medium", label: "Medium", color: "bg-amber-500/15 text-amber-600 border-amber-500/30 data-[state=on]:bg-amber-500 data-[state=on]:text-white" },
  { value: "hard", label: "Hard", color: "bg-red-500/15 text-red-600 border-red-500/30 data-[state=on]:bg-red-500 data-[state=on]:text-white" },
  { value: "nuclear", label: "Nuclear ☢️", color: "bg-purple-500/15 text-purple-600 border-purple-500/30 data-[state=on]:bg-purple-500 data-[state=on]:text-white" },
];

interface CVViewProps {
  jobs: JobApplication[];
  onSelectJob?: (job: JobApplication) => void;
}

interface SuitabilityResult {
  score: number;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
}

const ScoreRing = ({ score }: { score: number }) => {
  const color = score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-red-500";
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative h-20 w-20 flex items-center justify-center">
      <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
        <circle
          cx="40" cy="40" r="36" fill="none"
          className={color}
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <span className={`text-xl font-display font-bold ${color}`}>{score}</span>
    </div>
  );
};

class MarkdownErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="text-sm text-destructive p-4">Failed to render review</div>;
    return this.props.children;
  }
}

const markdownComponents = {
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text = String(children);
    if (text.toLowerCase().includes("checklist")) {
      return (
        <h2 className="bg-destructive/10 border-l-4 border-destructive px-3 py-2 rounded font-bold text-destructive mt-6 mb-3" {...props}>
          {children}
        </h2>
      );
    }
    return <h2 {...props}>{children}</h2>;
  },
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="checklist-item font-semibold mb-3" {...props}>{children}</li>
  ),
};

const CVView = ({ jobs, onSelectJob }: CVViewProps) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [cvText, setCvText] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, SuitabilityResult>>({});

  // Ruthless review state
  const [ruthlessLoading, setRuthlessLoading] = useState(false);
  const [ruthlessText, setRuthlessText] = useState("");
  const [ruthlessOpen, setRuthlessOpen] = useState(false);
  const [ruthlessCooldown, setRuthlessCooldown] = useState(false);
  const [ruthlessIntensity, setRuthlessIntensity] = useState<Intensity>("hard");

  // Cooldown logic
  useEffect(() => {
    const checkCooldown = () => {
      const ts = localStorage.getItem("ruthless-cooldown");
      if (!ts) return;
      const elapsed = Date.now() - parseInt(ts, 10);
      if (elapsed < 30000) {
        setRuthlessCooldown(true);
        const timer = setTimeout(() => setRuthlessCooldown(false), 30000 - elapsed);
        return () => clearTimeout(timer);
      }
    };
    return checkCooldown();
  }, []);

  const handleCVText = useCallback((text: string | null) => {
    setCvText(text);
  }, []);

  // Load cached results
  useEffect(() => {
    if (!user) return;
    const cached = localStorage.getItem(`cv-results-${user.id}`);
    if (cached) {
      try { setResults(JSON.parse(cached)); } catch { /* ignore */ }
    }
  }, [user]);

  const reviewJob = async (job: JobApplication) => {
    if (!cvText) {
      toast({ title: "No CV uploaded", description: "Upload your CV first", variant: "destructive" });
      return;
    }
    if (!job.description && !job.role) {
      toast({ title: "No job description", description: "Add a description to this job first", variant: "destructive" });
      return;
    }

    setSelectedJobId(job.id);
    setLoading(true);

    if (!session?.access_token) {
      toast({ title: "Please log in", description: "Authentication required for AI analysis", variant: "destructive" });
      return;
    }

    try {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          mode: "cv_suitability",
          job: {
            company: job.company,
            role: job.role,
            salary: job.salary,
            location: job.location,
            description: job.description,
            notes: job.notes,
          },
          cvText,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        toast({ title: "AI Error", description: err.error, variant: "destructive" });
        return;
      }

      const data = await resp.json();
      const updated = { ...results, [job.id]: data };
      setResults(updated);
      if (user) localStorage.setItem(`cv-results-${user.id}`, JSON.stringify(updated));
    } catch {
      toast({ title: "Error", description: "Failed to review suitability", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const startRuthlessReview = async () => {
    if (!cvText) {
      toast({ title: "No CV uploaded", description: "Upload your CV first", variant: "destructive" });
      return;
    }
    if (!session?.access_token) {
      toast({ title: "Please log in", description: "Authentication required", variant: "destructive" });
      return;
    }
    if (cvText.length > 6000) {
      toast({ title: "CV truncated", description: "CV truncated to 6000 chars for review" });
    }

    localStorage.setItem("ruthless-cooldown", Date.now().toString());
    setRuthlessCooldown(true);
    setTimeout(() => setRuthlessCooldown(false), 30000);

    setRuthlessLoading(true);
    setRuthlessText("");
    setRuthlessOpen(true);

    try {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          mode: "ruthless_review",
          job: {},
          cvText,
          intensity: ruthlessIntensity,
        }),
      });

      if (!resp.ok) {
        toast({ title: "Review unavailable", description: "Try again later", variant: "destructive" });
        setRuthlessLoading(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) { setRuthlessLoading(false); return; }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              setRuthlessText((prev) => prev + content);
            }
          } catch { /* skip malformed chunks */ }
        }
      }
    } catch {
      toast({ title: "Review unavailable", description: "Try again later", variant: "destructive" });
    } finally {
      setRuthlessLoading(false);
    }
  };

  const activeJobs = jobs.filter((j) => j.columnId !== "rejected" && j.columnId !== "accepted");
  const selectedResult = selectedJobId ? results[selectedJobId] : null;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Section 1: CV Upload */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-display font-semibold text-foreground">Master CV</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload your CV once and review it against any job in your pipeline.
          </p>
          <CVUploadSection onCVTextReady={handleCVText} />
          {cvText && (
            <div className="space-y-3">
              {/* Intensity selector */}
              <div className="flex flex-wrap items-center gap-2">
                {INTENSITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRuthlessIntensity(opt.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${opt.color} ${
                      ruthlessIntensity === opt.value ? "ring-2 ring-offset-1 ring-offset-background" : "opacity-70 hover:opacity-100"
                    }`}
                    data-state={ruthlessIntensity === opt.value ? "on" : "off"}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Nuclear disclaimer */}
              {ruthlessIntensity === "nuclear" && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Nuclear mode contains harsh language — proceed at your own risk
                </p>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={startRuthlessReview}
                  disabled={ruthlessLoading || ruthlessCooldown}
                >
                  {ruthlessLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4" />}
                  {ruthlessCooldown ? "Cooldown..." : "Ruthless Review"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Takes 5–15s. Be prepared — this is brutal.
              </p>
            </div>
          )}
        </section>

        {/* Section 2: Job review grid */}
        {cvText && activeJobs.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-display font-semibold text-foreground">Review Against Jobs</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Select a job to review your CV suitability. Results are cached locally.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeJobs.map((job) => {
                const result = results[job.id];
                const isSelected = selectedJobId === job.id;
                const col = COLUMNS.find((c) => c.id === job.columnId);

                return (
                  <motion.button
                    key={job.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedJobId(job.id);
                      if (!result) reviewJob(job);
                    }}
                    className={`relative text-left rounded-xl border p-4 transition-all ${
                      isSelected
                        ? "border-primary/60 ring-1 ring-primary/30 bg-primary/5"
                        : "border-border/40 bg-card/80 hover:border-border/60 hover:bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{job.company}</p>
                        <p className="text-xs text-muted-foreground truncate">{job.role}</p>
                        {col && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className={`h-2 w-2 rounded-full ${col.colorClass}`} />
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{col.title}</span>
                          </div>
                        )}
                      </div>
                      {result && (
                        <div className="shrink-0">
                          <div className={`flex items-center justify-center h-10 w-10 rounded-full border-2 ${
                            result.score >= 75 ? "border-emerald-500 text-emerald-500" :
                            result.score >= 50 ? "border-amber-500 text-amber-500" :
                            "border-red-500 text-red-500"
                          }`}>
                            <span className="text-xs font-bold font-mono">{result.score}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {loading && isSelected && !result && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Analyzing…
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </section>
        )}

        {/* Section 3: Selected result detail */}
        <AnimatePresence mode="wait">
          {selectedResult && (
            <motion.section
              key={selectedJobId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4 rounded-xl border border-border/50 bg-secondary/10 p-5"
            >
              <div className="flex items-center gap-5">
                <ScoreRing score={selectedResult.score} />
                <div>
                  <p className="text-lg font-display font-semibold text-foreground">
                    Suitability Score
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedResult.score >= 75 ? "Strong match!" : selectedResult.score >= 50 ? "Moderate match" : "Weak match — review suggestions"}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-7 text-xs gap-1.5"
                    onClick={() => {
                      const job = jobs.find((j) => j.id === selectedJobId);
                      if (job) reviewJob(job);
                    }}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Re-analyse
                  </Button>
                </div>
              </div>

              {selectedResult.strengths.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-emerald-500 mb-1.5">✓ Strengths</h4>
                  <ul className="space-y-1">
                    {selectedResult.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-foreground pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-emerald-500">{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedResult.gaps.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-amber-500 mb-1.5">⚠ Gaps</h4>
                  <ul className="space-y-1">
                    {selectedResult.gaps.map((g, i) => (
                      <li key={i} className="text-sm text-foreground pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-amber-500">{g}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedResult.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-1.5">💡 Suggestions</h4>
                  <ul className="space-y-1">
                    {selectedResult.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-foreground pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Empty states */}
        {!cvText && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Upload your CV above to start reviewing against jobs</p>
          </div>
        )}

        {cvText && activeJobs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Add some job applications to review your CV against</p>
          </div>
        )}
      </div>

      {/* Ruthless Review Sheet */}
      <Sheet open={ruthlessOpen} onOpenChange={setRuthlessOpen}>
        <SheetContent className="sm:max-w-2xl flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-destructive">
              <Flame className="h-5 w-5" /> Ruthless CV Review
            </SheetTitle>
            {ruthlessIntensity === "nuclear" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                Nuclear mode — harsh language ahead
              </p>
            )}
          </SheetHeader>

          {/* Intensity selector + Update Roast inside sheet */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border/40">
            {INTENSITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRuthlessIntensity(opt.value)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all ${opt.color} ${
                  ruthlessIntensity === opt.value ? "ring-2 ring-offset-1 ring-offset-background" : "opacity-70 hover:opacity-100"
                }`}
                data-state={ruthlessIntensity === opt.value ? "on" : "off"}
              >
                {opt.label}
              </button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 ml-auto h-7 text-xs"
              onClick={startRuthlessReview}
              disabled={ruthlessLoading || ruthlessCooldown}
            >
              {ruthlessLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Update Roast
            </Button>
          </div>

          <ScrollArea className="flex-1 pr-4">
            <MarkdownErrorBoundary>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown components={markdownComponents}>
                  {ruthlessText || "Waiting for the roast..."}
                </ReactMarkdown>
              </div>
            </MarkdownErrorBoundary>
          </ScrollArea>
          <SheetFooter className="flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                navigator.clipboard.writeText(ruthlessText);
                toast({ title: "Copied ruthless review to clipboard" });
              }}
              disabled={!ruthlessText || ruthlessLoading}
            >
              <Copy className="h-4 w-4" /> Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                const checklist = ruthlessText.split("## Immediate Action Checklist")[1] || ruthlessText;
                navigator.clipboard.writeText(checklist.trim());
                toast({ title: "Checklist copied" });
              }}
              disabled={!ruthlessText || ruthlessLoading}
            >
              <ClipboardList className="h-4 w-4" /> Copy Checklist Only
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={startRuthlessReview}
              disabled={ruthlessLoading || ruthlessCooldown}
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CVView;
