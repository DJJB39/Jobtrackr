import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2, FileText, CheckCircle2, X, AlertTriangle,
  ChevronRight, Copy, Flame, ArrowRight, Check, Minus,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { JobApplication } from "@/types/job";
import { useCVTailor } from "@/hooks/useCVTailor";
import { useToast } from "@/hooks/use-toast";

interface CVTailorModalProps {
  job: JobApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartRoast?: () => void;
  preferredModel?: string;
  onUsageIncrement?: () => void;
}

const ScoreCompare = ({ before, after }: { before: number; after: number }) => {
  const delta = after - before;
  const color = delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-muted-foreground";
  return (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">Before</p>
        <p className="text-2xl font-display font-bold text-muted-foreground">{before}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-muted-foreground" />
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">After</p>
        <p className="text-2xl font-display font-bold text-primary">{after}</p>
      </div>
      {delta !== 0 && (
        <span className={`text-sm font-semibold ${color}`}>
          {delta > 0 ? "+" : ""}{delta}
        </span>
      )}
    </div>
  );
};

const CVTailorModal = ({
  job,
  open,
  onOpenChange,
  onStartRoast,
  preferredModel,
  onUsageIncrement,
}: CVTailorModalProps) => {
  const tailor = useCVTailor(preferredModel, onUsageIncrement);
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);

  const handleGenerate = async () => {
    if (!job) return;
    await tailor.tailorCV(job);
  };

  const handleClose = () => {
    tailor.reset();
    setShowSummary(false);
    onOpenChange(false);
  };

  const handleCopyTailored = () => {
    const text = tailor.getTailoredText();
    if (text) {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard", description: "Tailored CV text copied" });
    }
  };

  if (!job) return null;

  const data = tailor.result;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-3xl h-[85vh] p-0 flex flex-col overflow-hidden gap-0 border-border/50 bg-background/95 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Tailor CV
            </h2>
            <p className="text-xs text-muted-foreground truncate">{job.company} — {job.role}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* IDLE */}
              {!data && !tailor.loading && (
                <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-display font-semibold">Optimize your CV for this role</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      AI will reword your existing experience to better match this job description.
                      Nothing is invented — only your real experience, rephrased.
                    </p>
                  </div>

                  {/* Honesty disclaimer */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Honesty guarantee</p>
                      <p className="text-xs text-muted-foreground">
                        This tool only rephrases your existing skills and experience. It will NOT invent
                        achievements, fabricate skills, or add experience you don't have. Always review
                        the output — misrepresentation is your responsibility.
                      </p>
                    </div>
                  </div>

                  {!job.description && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
                      <p className="text-sm text-destructive font-medium">No job description found</p>
                      <p className="text-xs text-muted-foreground mt-1">Add a job description in the Overview tab first</p>
                    </div>
                  )}

                  <Button
                    onClick={handleGenerate}
                    className="w-full gap-2 shadow-glow"
                    size="lg"
                    disabled={!job.description}
                  >
                    <FileText className="h-4 w-4" />
                    Tailor My CV for This Job
                  </Button>
                </motion.div>
              )}

              {/* LOADING */}
              {tailor.loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Analyzing your CV against the job description…</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Matching keywords, rephrasing bullets, checking honesty</p>
                </motion.div>
              )}

              {/* RESULT */}
              {data && (
                <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {/* Score comparison */}
                  <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/60 p-5">
                    <ScoreCompare before={data.overall_match_before} after={data.overall_match_after} />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowSummary(!showSummary)} className="gap-1.5 text-xs">
                        <ChevronRight className={`h-3 w-3 transition-transform ${showSummary ? "rotate-90" : ""}`} />
                        Summary
                      </Button>
                      <Button variant="outline" size="sm" onClick={tailor.acceptAll} className="gap-1.5 text-xs">
                        <CheckCircle2 className="h-3 w-3" /> Accept All
                      </Button>
                    </div>
                  </div>

                  {/* Summary */}
                  <AnimatePresence>
                    {showSummary && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="prose prose-sm dark:prose-invert max-w-none rounded-xl border border-border/50 bg-card/40 p-5">
                          <ReactMarkdown>{data.summary_markdown}</ReactMarkdown>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Honesty warning */}
                  {data.honesty_warning && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Honesty check</p>
                        <p className="text-xs text-muted-foreground">{data.honesty_warning}</p>
                      </div>
                    </div>
                  )}

                  {/* Keywords */}
                  <div className="flex flex-wrap gap-1.5">
                    {data.keywords_matched.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                        <Check className="h-2.5 w-2.5 mr-1" />{kw}
                      </Badge>
                    ))}
                    {data.keywords_missing.map((kw, i) => (
                      <Badge key={`m-${i}`} variant="outline" className="text-[10px] border-red-500/30 text-red-400 bg-red-500/5">
                        <Minus className="h-2.5 w-2.5 mr-1" />{kw}
                      </Badge>
                    ))}
                  </div>

                  {/* Diff sections */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Changes ({data.tailored_sections.length})
                    </h3>
                    {data.tailored_sections.map((section, i) => {
                      const accepted = tailor.acceptedSections.has(i);
                      return (
                        <div
                          key={i}
                          className={`rounded-xl border p-4 space-y-3 transition-all ${
                            accepted
                              ? "border-emerald-500/30 bg-emerald-500/5"
                              : "border-border/50 bg-card/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">{section.section_name}</span>
                            </div>
                            <Button
                              variant={accepted ? "default" : "outline"}
                              size="sm"
                              onClick={() => tailor.toggleSection(i)}
                              className={`text-xs gap-1.5 h-7 ${accepted ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                            >
                              {accepted ? <><CheckCircle2 className="h-3 w-3" /> Accepted</> : "Accept"}
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Original</p>
                              <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 rounded-lg p-3">{section.original}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Tailored</p>
                              <p className="text-sm text-foreground leading-relaxed bg-primary/5 rounded-lg p-3 border border-primary/10">{section.tailored}</p>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            <ChevronRight className="h-3 w-3 inline mr-0.5" />
                            {section.change_explanation}
                          </p>

                          {section.risk_note && (
                            <p className="text-xs text-amber-400 flex items-start gap-1.5">
                              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                              {section.risk_note}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCopyTailored}
                        disabled={tailor.acceptedSections.size === 0}
                        className="flex-1 gap-2"
                      >
                        <Copy className="h-4 w-4" /> Copy Tailored CV
                      </Button>
                      {onStartRoast && (
                        <Button
                          variant="outline"
                          onClick={onStartRoast}
                          className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
                        >
                          <Flame className="h-4 w-4" /> Roast This Version
                        </Button>
                      )}
                    </div>

                    {/* Final disclaimer */}
                    <p className="text-[11px] text-muted-foreground/60 text-center leading-relaxed">
                      Always review tailored content for accuracy. This tool optimizes your real experience —
                      it does not fabricate qualifications. Misrepresentation is your responsibility.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CVTailorModal;
