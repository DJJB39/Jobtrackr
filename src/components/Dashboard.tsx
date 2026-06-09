import { useMemo, useState } from "react";
import { type JobApplication, type ColumnId } from "@/types/job";
import { useStages } from "@/hooks/useStages";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, FunnelChart, Funnel, LabelList, CartesianGrid,
} from "recharts";
import { Activity, CalendarDays, AlertTriangle, Ghost, Flame, Dumbbell } from "lucide-react";
import { parseISO, format, startOfDay, differenceInDays } from "date-fns";
import {
  getStaleJobs as cornerStale,
  getGhostJobs as cornerGhosts,
  getUpcomingEvents as cornerUpcoming,
  STALE_THRESHOLD_DAYS,
  GHOST_THRESHOLD_DAYS,
} from "@/lib/cornerLogic";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import JobDetailPanel from "./JobDetailPanel";
import { useUserCV, type UserCV } from "@/hooks/useUserCV";
import { useSparHistory } from "@/hooks/useSparHistory";

interface DashboardProps {
  jobs: JobApplication[];
  onUpdateJob?: (job: JobApplication) => void;
  onFilterByStage?: (stageId: ColumnId) => void;
  /** Optional CV override (demo mode). When omitted, loads from useUserCV. */
  cv?: UserCV | null;
  /** Optional spar history override (demo mode). */
  sparOverride?: { date: string; score: number }[];
}

const AMBER = "hsl(36, 95%, 54%)";
const STEEL = "hsl(215, 25%, 70%)";

const EVENT_TYPE_LABELS: Record<string, string> = {
  interview: "Interview",
  follow_up: "Follow-up",
  deadline: "Deadline",
};

interface UpcomingItem {
  id: string;
  title: string;
  company: string;
  role: string;
  date: string;
  time: string | null;
  type: string;
}

const FUNNEL_STAGES: { id: ColumnId; label: string; color: string }[] = [
  { id: "found", label: "Found", color: "hsl(215, 80%, 55%)" },
  { id: "applied", label: "Applied", color: "hsl(262, 60%, 55%)" },
  { id: "phone", label: "Phone", color: "hsl(190, 75%, 42%)" },
  { id: "interview2", label: "Interview", color: "hsl(36, 95%, 54%)" },
  { id: "final", label: "Final", color: "hsl(24, 85%, 52%)" },
  { id: "offer", label: "Offer", color: "hsl(142, 60%, 42%)" },
  { id: "accepted", label: "Accepted", color: "hsl(142, 72%, 35%)" },
];

const Dashboard = ({ jobs, onUpdateJob, onFilterByStage, cv: cvProp, sparOverride }: DashboardProps) => {
  const { stages } = useStages();
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const { cv: loadedCv } = useUserCV();
  const cv = cvProp !== undefined ? cvProp : loadedCv;
  const { points: sparPoints } = useSparHistory();
  const spar = sparOverride ?? sparPoints;

  // Conversion funnel data — cumulative count at each stage or beyond
  const funnelData = useMemo(() => {
    const stageOrder: ColumnId[] = FUNNEL_STAGES.map((s) => s.id);
    return FUNNEL_STAGES.map((stage, i) => {
      const atOrBeyond = jobs.filter((j) => {
        const jIdx = stageOrder.indexOf(j.columnId);
        return jIdx >= i && j.columnId !== "rejected";
      }).length;
      return { name: stage.label, value: atOrBeyond, fill: stage.color };
    }).filter((d) => d.value > 0);
  }, [jobs]);

  // Stale + ghost shared with the Today view (single source of truth).
  const staleJobs = useMemo(() => cornerStale(jobs).slice(0, 5), [jobs]);
  const ghostJobs = useMemo(() => cornerGhosts(jobs).slice(0, 5), [jobs]);

  // Roast score over time. Without a dedicated history table we plot whatever
  // scored snapshots exist on the user_cvs row, oldest first.
  const roastSeries = useMemo(() => {
    if (!cv) return [] as { label: string; score: number }[];
    const out: { label: string; score: number; t: number }[] = [];
    if (cv.original_score != null) {
      const t = cv.created_at ? new Date(cv.created_at).getTime() : 0;
      out.push({ label: "Original", score: cv.original_score, t });
    }
    if (cv.cleaned_score != null) {
      const t = cv.updated_at ? new Date(cv.updated_at).getTime() : Date.now();
      out.push({ label: "Cleaned", score: cv.cleaned_score, t });
    }
    out.sort((a, b) => a.t - b.t);
    return out.map(({ label, score }) => ({ label, score }));
  }, [cv]);

  // Spar trend — chronological scores from interview_sessions.
  const sparSeries = useMemo(() => {
    return spar.map((p, i) => ({
      label: p.date ? format(new Date(p.date), "MMM d") : `#${i + 1}`,
      score: p.score,
    }));
  }, [spar]);

  // Response rate — % of applied jobs that produced ANY event within 14 days.
  const responseRate = useMemo(() => {
    const applied = jobs.filter((j) => j.columnId !== "found");
    if (applied.length === 0) return { pct: null as number | null, responded: 0, total: 0 };
    const responded = applied.filter((j) => {
      const appliedAt = new Date(j.createdAt).getTime();
      const cutoff = appliedAt + 14 * 86400000;
      return (j.events ?? []).some((e) => {
        const created = e.createdAt ? new Date(e.createdAt).getTime() : NaN;
        const dated = e.date ? parseISO(e.date).getTime() : NaN;
        const t = !Number.isNaN(created) ? created : dated;
        if (Number.isNaN(t)) return false;
        return t >= appliedAt && t <= cutoff;
      });
    }).length;
    return { pct: Math.round((responded / applied.length) * 100), responded, total: applied.length };
  }, [jobs]);

  // Roast delta for the headline stat
  const roastDelta = roastSeries.length >= 2 ? roastSeries[roastSeries.length - 1].score - roastSeries[0].score : null;
  const latestRoast = roastSeries.length ? roastSeries[roastSeries.length - 1].score : null;
  const latestSpar = sparSeries.length ? sparSeries[sparSeries.length - 1].score : null;

  const upcomingItems = useMemo(() => {
    const items: UpcomingItem[] = cornerUpcoming(jobs, 14);
    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [jobs]);

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
    color: "hsl(var(--foreground))",
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Fighter's record header stats — mono, terse */}
          <div className="grid grid-cols-3 gap-4">
            <RecordStat
              icon={<Flame className="h-4 w-4" />}
              label="Roast"
              value={latestRoast != null ? `${latestRoast}` : "—"}
              sub={roastDelta != null ? `${roastDelta >= 0 ? "+" : ""}${roastDelta} since first` : "no scored CV"}
            />
            <RecordStat
              icon={<Dumbbell className="h-4 w-4" />}
              label="Spar"
              value={latestSpar != null ? `${latestSpar}` : "—"}
              sub={spar.length ? `${spar.length} session${spar.length === 1 ? "" : "s"}` : "no sessions"}
            />
            <RecordStat
              icon={<Activity className="h-4 w-4" />}
              label="Response Rate"
              value={responseRate.pct != null ? `${responseRate.pct}%` : "—"}
              sub={responseRate.total > 0 ? `${responseRate.responded}/${responseRate.total} replied in 14d` : "no applications"}
            />
          </div>

          {/* Roast score over time */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-foreground">Roast / over time</h3>
              <p className="text-[10px] font-mono text-muted-foreground">Lower means weaker. Step on the scales regularly.</p>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                {roastSeries.length >= 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={roastSeries} margin={{ top: 10, right: 16, bottom: 0, left: -20 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: "ui-monospace, monospace", fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontFamily: "ui-monospace, monospace", fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="score" stroke={AMBER} strokeWidth={2} dot={{ r: 4, fill: AMBER, stroke: AMBER }} activeDot={{ r: 6 }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="No roast on record. Get scored to start the trend." />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Spar performance trend */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-foreground">Spar / performance</h3>
              <p className="text-[10px] font-mono text-muted-foreground">Interview Coach session scores, chronological.</p>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                {sparSeries.length >= 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparSeries} margin={{ top: 10, right: 16, bottom: 0, left: -20 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: "ui-monospace, monospace", fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontFamily: "ui-monospace, monospace", fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="score" stroke={STEEL} strokeWidth={2} dot={{ r: 3, fill: STEEL, stroke: STEEL }} activeDot={{ r: 5 }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="No spars logged. Open the Coach to record one." />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-foreground">Conversion / funnel</h3>
              <p className="text-[10px] font-mono text-muted-foreground">Applications at or beyond each stage. Empty stages hidden.</p>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                {funnelData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Funnel dataKey="value" data={funnelData} isAnimationActive={false}>
                        <LabelList position="right" fill="hsl(var(--foreground))" stroke="none" fontSize={11} />
                        <LabelList position="center" fill="hsl(var(--foreground))" stroke="none" fontSize={12} dataKey="value" />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="Add applications to build a funnel." />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stale & Ghost alerts row */}
          {(staleJobs.length > 0 || ghostJobs.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {staleJobs.length > 0 && (
                <Card className="glass-card border-[hsl(36,95%,54%)]/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-[hsl(36,95%,54%)]" />
                      <h3 className="text-xs font-mono uppercase tracking-wider text-foreground">Stale</h3>
                      <Badge variant="outline" className="ml-auto text-[10px]">{staleJobs.length}</Badge>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground">No activity for {STALE_THRESHOLD_DAYS}+ days</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1.5">
                      {staleJobs.map((job) => (
                        <button
                          key={job.id}
                          onClick={() => { setSelectedJob(job); setPanelOpen(true); }}
                          className="flex w-full items-center justify-between rounded-lg border border-border bg-card/50 p-2 text-left hover:bg-muted/50 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{job.company}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{job.role}</p>
                          </div>
                          <Badge variant="outline" className="text-[9px] shrink-0 ml-2">
                            {differenceInDays(new Date(), new Date(job.createdAt))}d
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {ghostJobs.length > 0 && (
                <Card className="glass-card border-[hsl(262,60%,55%)]/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Ghost className="h-4 w-4 text-[hsl(262,60%,55%)]" />
                      <h3 className="text-xs font-mono uppercase tracking-wider text-foreground">Ghosted</h3>
                      <Badge variant="outline" className="ml-auto text-[10px]">{ghostJobs.length}</Badge>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground">No events for {GHOST_THRESHOLD_DAYS}+ days</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1.5">
                      {ghostJobs.map((job) => (
                        <button
                          key={job.id}
                          onClick={() => { setSelectedJob(job); setPanelOpen(true); }}
                          className="flex w-full items-center justify-between rounded-lg border border-border bg-card/50 p-2 text-left hover:bg-muted/50 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{job.company}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{job.role}</p>
                          </div>
                          <Badge variant="secondary" className="text-[9px] shrink-0 ml-2">
                            {stages.find((c) => c.id === job.columnId)?.title}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Right column: upcoming sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: AMBER + "20" }}>
                  <CalendarDays className="h-4 w-4" style={{ color: AMBER }} />
                </div>
                <span className="text-xs font-mono uppercase tracking-wider">Upcoming</span>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingItems.length > 0 ? (
                <div className="space-y-1.5">
                  {upcomingItems.map((item) => {
                    const parentJob = jobs.find((j) => j.company === item.company && j.role === item.role);
                    return (
                      <div
                        key={item.id}
                        onClick={() => { if (parentJob) { setSelectedJob(parentJob); setPanelOpen(true); } }}
                        className="flex flex-col gap-0.5 rounded-lg border border-border bg-card/50 p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-muted-foreground">{format(parseISO(item.date), "MMM d")}</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">{EVENT_TYPE_LABELS[item.type] ?? item.type}</Badge>
                        </div>
                        <span className="text-xs text-foreground truncate">{item.title}</span>
                        <span className="text-[10px] text-muted-foreground truncate">{item.company}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs font-mono text-muted-foreground">Nothing upcoming.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <JobDetailPanel
        job={selectedJob}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onSave={(updated) => { onUpdateJob?.(updated); setSelectedJob(updated); }}
      />
    </div>
  );
};

const RecordStat = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) => (
  <div className="rounded-xl glass-card p-4 border-l-2 border-[hsl(36,95%,54%)]/60">
    <div className="flex items-center gap-2 mb-1.5 text-muted-foreground">
      {icon}
      <span className="text-[10px] font-mono uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-2xl font-mono text-foreground">{value}</p>
    <p className="mt-0.5 text-[10px] font-mono text-muted-foreground">{sub}</p>
  </div>
);

const EmptyChart = ({ label }: { label: string }) => (
  <div className="h-full flex items-center justify-center text-[11px] font-mono text-muted-foreground">{label}</div>
);

export default Dashboard;
