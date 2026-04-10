import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2, MapPin, Clock, Building2, Newspaper, Package,
  CalendarCheck, Flame, Printer, X, ChevronRight,
} from "lucide-react";
import type { JobApplication } from "@/types/job";
import { useBootcamp, type BootcampData } from "@/hooks/useBootcamp";

interface DayBeforeBootcampProps {
  job: JobApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartRoast?: (bootcampData: BootcampData) => void;
  preferredModel?: string;
  onUsageIncrement?: () => void;
}

const FOCUS_COLORS: Record<string, string> = {
  research: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  practice: "border-primary/30 bg-primary/10 text-primary",
  logistics: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  rest: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
};

const DayBeforeBootcamp = ({
  job,
  open,
  onOpenChange,
  onStartRoast,
  preferredModel,
  onUsageIncrement,
}: DayBeforeBootcampProps) => {
  const bootcamp = useBootcamp(preferredModel, onUsageIncrement);
  const [userLocation, setUserLocation] = useState("");

  const handleGenerate = async () => {
    if (!job) return;
    await bootcamp.generateBootcamp(job, userLocation || undefined);
  };

  const handleClose = () => {
    bootcamp.reset();
    setUserLocation("");
    onOpenChange(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!job) return null;

  const data = bootcamp.bootcampData;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl h-[85vh] p-0 flex flex-col overflow-hidden gap-0 border-border/50 bg-background/95 backdrop-blur-xl print:h-auto print:max-h-none print:overflow-visible">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0 print:hidden">
          <div className="min-w-0">
            <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Day Before Bootcamp
            </h2>
            <p className="text-xs text-muted-foreground truncate">{job.company} — {job.role}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {data && (
              <Button variant="ghost" size="icon" onClick={handlePrint} title="Print prep plan">
                <Printer className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* IDLE — Location input */}
              {!data && !bootcamp.loading && (
                <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-display font-semibold">Prep like a machine</h3>
                    <p className="text-sm text-muted-foreground">
                      Get a structured prep plan, company intel, and tailored questions for tomorrow's interview.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        Your location <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <Input
                        value={userLocation}
                        onChange={(e) => setUserLocation(e.target.value)}
                        placeholder="e.g. Brooklyn, NY"
                        className="bg-secondary/50"
                      />
                      <p className="text-xs text-muted-foreground">For commute estimates. Leave blank to skip logistics.</p>
                    </div>
                  </div>

                  <Button onClick={handleGenerate} className="w-full gap-2 shadow-glow" size="lg">
                    <CalendarCheck className="h-4 w-4" />
                    Generate Bootcamp Plan
                  </Button>
                </motion.div>
              )}

              {/* LOADING */}
              {bootcamp.loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Building your bootcamp plan…</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Researching {job.company} & analyzing your profile</p>
                </motion.div>
              )}

              {/* READY — Full bootcamp plan */}
              {data && (
                <motion.div key="ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {/* Company Snapshot */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" /> Company Intel
                    </h3>
                    <div className="grid gap-3">
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">Why Join {job.company}?</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{data.company_snapshot.why_join}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                            <Newspaper className="h-3 w-3" /> Recent News
                          </div>
                          <p className="text-sm text-muted-foreground">{data.company_snapshot.recent_news}</p>
                        </div>
                        <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                            <Package className="h-3 w-3" /> Product Context
                          </div>
                          <p className="text-sm text-muted-foreground">{data.company_snapshot.product_context}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Logistics */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> Logistics
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-border/50 bg-card/60 p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Commute</p>
                        <p className="text-sm font-semibold text-foreground">{data.logistics.commute_estimate}</p>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-card/60 p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Cost</p>
                        <p className="text-sm font-semibold text-foreground">{data.logistics.cost_estimate}</p>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-card/60 p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Advice</p>
                        <p className="text-sm font-semibold text-foreground">{data.logistics.time_advice}</p>
                      </div>
                    </div>
                  </section>

                  {/* Schedule Timeline */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Your Day Plan
                    </h3>
                    <div className="relative space-y-0">
                      {data.schedule.map((item, i) => (
                        <div key={i} className="flex gap-3 group">
                          {/* Timeline line */}
                          <div className="flex flex-col items-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
                            {i < data.schedule.length - 1 && <div className="w-px flex-1 bg-border/50" />}
                          </div>
                          {/* Content */}
                          <div className="pb-4 flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono font-semibold text-foreground">{item.time}</span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 h-4 ${FOCUS_COLORS[item.focus_area] || "border-border/50"}`}
                              >
                                {item.focus_area}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground/50">{item.duration_min}min</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{item.activity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Questions */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Tailored Questions
                    </h3>
                    <div className="space-y-2">
                      {data.questions.map((q, i) => (
                        <div key={i} className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-primary">Q{i + 1}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {q.type === "behavioral" ? "Behavioral" : "Company-Specific"}
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold text-foreground">{q.question}</p>
                          <p className="text-xs text-muted-foreground/70 italic">
                            <ChevronRight className="h-3 w-3 inline mr-0.5" />
                            {q.context_note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Roast Me Now button */}
                  {onStartRoast && (
                    <div className="pt-2">
                      <Button
                        onClick={() => onStartRoast(data)}
                        size="lg"
                        className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                      >
                        <Flame className="h-5 w-5" />
                        Roast Me Now — Ruthless Bootcamp Drill
                      </Button>
                      <p className="text-xs text-muted-foreground/60 text-center mt-2">
                        Uses bootcamp questions with savage, company-aware feedback
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DayBeforeBootcamp;
