import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import {
  Sparkles,
  Loader2,
  FileText,
  CheckCircle2,
  Flame,
  Copy,
  RefreshCw,
  AlertTriangle,
  ClipboardList,
  Upload,
  ArrowUp,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  DEMO_CV_TEXT,
  DEMO_ROASTS,
  DEMO_SUITABILITY,
  DEMO_PROJECTED_SCORES,
  type DemoIntensity,
} from "@/lib/demo-cv-data";
import type { JobApplication } from "@/types/job";
import { COLUMNS } from "@/types/job";

const INTENSITY_OPTIONS: { value: DemoIntensity; label: string; color: string }[] = [
  {
    value: "soft",
    label: "Soft",
    color:
      "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 data-[state=on]:bg-emerald-500 data-[state=on]:text-white",
  },
  {
    value: "medium",
    label: "Medium",
    color: "bg-amber-500/15 text-amber-600 border-amber-500/30 data-[state=on]:bg-amber-500 data-[state=on]:text-white",
  },
  {
    value: "hard",
    label: "Hard",
    color: "bg-red-500/15 text-red-600 border-red-500/30 data-[state=on]:bg-red-500 data-[state=on]:text-white",
  },
  {
    value: "nuclear",
    label: "Nuclear ☢️",
    color:
      "bg-purple-500/15 text-purple-600 border-purple-500/30 data-[state=on]:bg-purple-500 data-[state=on]:text-white",
  },
];

const markdownComponents = {
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text = String(children);
    if (text.toLowerCase().includes("checklist")) {
      return (
        <h2
          className="bg-destructive/10 border-l-4 border-destructive px-3 py-2 rounded font-bold text-destructive mt-6 mb-3"
          {...props}
        >
          {children}
        </h2>
      );
    }
    return <h2 {...props}>{children}</h2>;
  },
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="checklist-item font-semibold mb-3" {...props}>
      {children}
    </li>
  ),
};

const ScoreRing = ({ score }: { score: number }) => {
  const color = score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-red-500";
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative h-20 w-20 flex items-center justify-center">
      <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
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

interface DemoCVViewProps {
  jobs: JobApplication[];
}

const DemoCVView = ({ jobs }: DemoCVViewProps) => {
  const { toast } = useToast();
  const [cvUploaded, setCvUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [intensity, setIntensity] = useState<DemoIntensity>("hard");
  const [roastLoading, setRoastLoading] = useState(false);
  const [roastText, setRoastText] = useState("");
  const [roastOpen, setRoastOpen] = useState(false);
  const [hasRoasted, setHasRoasted] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const handleUpload = useCallback(() => {
    setUploading(true);
    setTimeout(() => {
      setCvUploaded(true);
      setUploading(false);
    }, 800);
  }, []);

  const startRoast = useCallback(() => {
    setRoastLoading(true);
    setRoastText("");
    setRoastOpen(true);
    const delay = 3000 + Math.random() * 2000;
    setTimeout(() => {
      setRoastText(DEMO_ROASTS[intensity]);
      setRoastLoading(false);
      setHasRoasted(true);
    }, delay);
  }, [intensity]);

  const updateRoast = useCallback(() => {
    setRoastText(DEMO_ROASTS[intensity]);
  }, [intensity]);

  const activeJobs = jobs.filter((j) => j.columnId !== "rejected" && j.columnId !== "accepted");

  return (
    <TooltipProvider>
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
          {/* Banner */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                🎯 In real mode, upload your CV and get a personalised savage roast
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">AI-powered analysis with actionable fix checklist</p>
            </div>
            <Button size="sm" className="h-8 text-xs shrink-0" asChild>
              <Link to="/auth?tab=signup">Sign Up</Link>
            </Button>
          </div>

          {/* Section 1: CV Upload */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-display font-semibold text-foreground">Master CV</h2>
              <Badge variant="outline" className="text-[10px] ml-1">
                Demo
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload your CV once and review it against any job in your pipeline.
            </p>

            {!cvUploaded ? (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full rounded-xl border-2 border-dashed border-border/60 bg-muted/30 hover:bg-muted/50 hover:border-border transition-all p-8 flex flex-col items-center gap-3 cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {uploading ? "Loading sample CV…" : "Click to upload CV"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Demo: loads a sample CV instantly</p>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">sample-cv.pdf</p>
                  <p className="text-xs text-muted-foreground">
                    Sample CV loaded • {DEMO_CV_TEXT.split(/\s+/).length} words
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setCvUploaded(false)}>
                  Remove
                </Button>
              </div>
            )}

            {cvUploaded && (
              <div className="space-y-3">
                {/* Intensity selector */}
                <div className="flex flex-wrap items-center gap-2">
                  {INTENSITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setIntensity(opt.value)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${opt.color} ${
                        intensity === opt.value
                          ? "ring-2 ring-offset-1 ring-offset-background"
                          : "opacity-70 hover:opacity-100"
                      }`}
                      data-state={intensity === opt.value ? "on" : "off"}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {intensity === "nuclear" && (
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
                    onClick={startRoast}
                    disabled={roastLoading}
                  >
                    {roastLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4" />}
                    Ruthless Review
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Demo: simulates 3–5s loading, then shows pre-written roast.
                </p>
              </div>
            )}
          </section>

          {/* Section 2: Job Suitability Grid */}
          {cvUploaded && activeJobs.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold text-foreground">Job Suitability</h2>
                <Badge variant="outline" className="text-[10px] ml-1">
                  Demo
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeJobs.map((job) => {
                  const score = DEMO_SUITABILITY[job.id] ?? 32;
                  const projected = DEMO_PROJECTED_SCORES[job.id] ?? 78;
                  const col = COLUMNS.find((c) => c.id === job.columnId);
                  const isSelected = selectedJobId === job.id;

                  return (
                    <motion.button
                      key={job.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedJobId(job.id)}
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
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                {col.title}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="shrink-0">
                          <div
                            className={`flex items-center justify-center h-10 w-10 rounded-full border-2 ${
                              score >= 75
                                ? "border-emerald-500 text-emerald-500"
                                : score >= 50
                                  ? "border-amber-500 text-amber-500"
                                  : "border-red-500 text-red-500"
                            }`}
                          >
                            <span className="text-xs font-bold font-mono">{score}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">Current CV match: {score}%</div>

                      {hasRoasted && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <ArrowUp className="h-3 w-3 text-emerald-500" />
                          <span className="text-xs font-medium text-emerald-500">
                            Projected after fixes: {projected}%
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Sign up to see real improvements</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Selected job detail */}
          <AnimatePresence mode="wait">
            {selectedJobId && cvUploaded && (
              <motion.section
                key={selectedJobId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4 rounded-xl border border-border/50 bg-secondary/10 p-5"
              >
                <div className="flex items-center gap-5">
                  <ScoreRing score={DEMO_SUITABILITY[selectedJobId] ?? 32} />
                  <div>
                    <p className="text-lg font-display font-semibold text-foreground">Suitability Score</p>
                    <p className="text-xs text-muted-foreground">Demo score — sign up for real AI analysis</p>
                    {hasRoasted && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-500">
                          Projected: {DEMO_PROJECTED_SCORES[selectedJobId] ?? 78}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  In the full app, you'll see detailed strengths, gaps, and tailored suggestions for each job.
                </p>
                <Button size="sm" className="h-8 text-xs gap-1.5" asChild>
                  <Link to="/auth?tab=signup">Sign Up for Real Analysis</Link>
                </Button>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Empty states */}
          {!cvUploaded && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Click the upload zone above to load a sample CV</p>
            </div>
          )}
        </div>

        {/* Ruthless Review Sheet */}
        <Sheet open={roastOpen} onOpenChange={setRoastOpen}>
          <SheetContent className="sm:max-w-2xl flex flex-col">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-destructive">
                <Flame className="h-5 w-5" /> Ruthless CV Review
                <Badge variant="outline" className="text-[10px] ml-1">
                  Demo
                </Badge>
              </SheetTitle>
              {intensity === "nuclear" && (
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
                  onClick={() => setIntensity(opt.value)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all ${opt.color} ${
                    intensity === opt.value
                      ? "ring-2 ring-offset-1 ring-offset-background"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  data-state={intensity === opt.value ? "on" : "off"}
                >
                  {opt.label}
                </button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 ml-auto h-7 text-xs"
                onClick={updateRoast}
                disabled={roastLoading || !roastText}
              >
                <RefreshCw className="h-3 w-3" />
                Update Roast
              </Button>
            </div>

            {/* Hint banner after first roast */}
            {roastText && intensity !== "nuclear" && (
              <div className="rounded-md border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-xs text-purple-600 dark:text-purple-400">
                Want it harsher? Switch to <strong>Nuclear ☢️</strong> and hit <strong>Update Roast</strong>
              </div>
            )}

            <ScrollArea className="flex-1 pr-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {roastLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-destructive" />
                    <p className="text-sm text-muted-foreground">Preparing your roast…</p>
                  </div>
                ) : (
                  <ReactMarkdown components={markdownComponents}>
                    {roastText || "Select an intensity and hit Ruthless Review to begin."}
                  </ReactMarkdown>
                )}
              </div>
            </ScrollArea>

            {/* Sign-up banner after roast */}
            {roastText && !roastLoading && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">
                    🚀 Sign up to roast your real CV and track improvements
                  </p>
                </div>
                <Button size="sm" className="h-7 text-xs shrink-0" asChild>
                  <Link to="/auth?tab=signup">Sign Up</Link>
                </Button>
              </div>
            )}

            <SheetFooter className="flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(roastText);
                  toast({ title: "Copied review to clipboard" });
                }}
                disabled={!roastText || roastLoading}
              >
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const checklist = roastText.split("## Immediate Action Checklist")[1] || roastText;
                  navigator.clipboard.writeText(checklist.trim());
                  toast({ title: "Checklist copied" });
                }}
                disabled={!roastText || roastLoading}
              >
                <ClipboardList className="h-4 w-4" /> Copy Checklist Only
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
};

export default DemoCVView;
