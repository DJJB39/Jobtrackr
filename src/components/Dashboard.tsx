import { useMemo, useState } from "react";
import { COLUMNS, type JobApplication } from "@/types/job";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, PieChart, Pie, Legend,
} from "recharts";
import { TrendingUp, Activity, Layers, CalendarDays, Zap } from "lucide-react";
import { parseISO, format, isBefore, startOfDay, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import JobDetailPanel from "./JobDetailPanel";

interface DashboardProps {
  jobs: JobApplication[];
  onUpdateJob?: (job: JobApplication) => void;
}

const STATUS_COLORS: Record<string, string> = {
  found: "hsl(215, 80%, 55%)",
  applied: "hsl(262, 60%, 55%)",
  phone: "hsl(190, 75%, 42%)",
  interview2: "hsl(36, 95%, 54%)",
  final: "hsl(24, 85%, 52%)",
  offer: "hsl(142, 60%, 42%)",
  accepted: "hsl(142, 72%, 35%)",
  rejected: "hsl(0, 72%, 51%)",
};

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

const STAT_ACCENTS = {
  gold: "hsl(36, 95%, 54%)",
  blue: "hsl(215, 80%, 55%)",
  purple: "hsl(262, 60%, 55%)",
  green: "hsl(142, 60%, 42%)",
};

const Dashboard = ({ jobs, onUpdateJob }: DashboardProps) => {
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = jobs.filter((j) => new Date(j.createdAt) >= weekAgo);
    const active = jobs.filter((j) => j.columnId !== "found" && j.columnId !== "rejected");
    const responseRate = jobs.length > 0 ? Math.round((active.length / jobs.length) * 100) : 0;
    const breakdown = COLUMNS.map((col) => ({
      name: col.title,
      count: jobs.filter((j) => j.columnId === col.id).length,
      id: col.id,
    }));
    return { thisWeek: thisWeek.length, active: active.length, responseRate, breakdown, total: jobs.length };
  }, [jobs]);

  const weeklyData = useMemo(() => {
    const weeks: { week: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const ws = startOfWeek(subWeeks(new Date(), i));
      const we = endOfWeek(ws);
      const label = format(ws, "MMM d");
      const count = jobs.filter((j) => {
        const d = new Date(j.createdAt);
        return d >= ws && d <= we;
      }).length;
      weeks.push({ week: label, count });
    }
    return weeks;
  }, [jobs]);

  const upcomingItems = useMemo(() => {
    const today = startOfDay(new Date());
    const in14Days = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const items: UpcomingItem[] = [];
    for (const job of jobs) {
      for (const evt of job.events ?? []) {
        try {
          const d = parseISO(evt.date);
          if (!isBefore(d, today) && isBefore(d, in14Days)) {
            items.push({ id: evt.id, title: evt.title, company: job.company, role: job.role, date: evt.date, time: evt.time, type: evt.type });
          }
        } catch { /* skip */ }
      }
      if (job.closeDate) {
        try {
          const d = parseISO(job.closeDate);
          if (!isBefore(d, today) && isBefore(d, in14Days)) {
            items.push({ id: `deadline-${job.id}`, title: `Deadline: ${job.company}`, company: job.company, role: job.role, date: job.closeDate, time: null, type: "deadline" });
          }
        } catch { /* skip */ }
      }
    }
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
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label="This Week" value={stats.thisWeek} sub={`of ${stats.total} total`} accentColor={STAT_ACCENTS.gold} />
            <StatCard icon={<Zap className="h-4 w-4" />} label="Active" value={stats.active} sub="in pipeline" accentColor={STAT_ACCENTS.green} />
            <StatCard icon={<Activity className="h-4 w-4" />} label="Response Rate" value={`${stats.responseRate}%`} sub="excl. Found/Rejected" accentColor={STAT_ACCENTS.blue} />
            <StatCard icon={<Layers className="h-4 w-4" />} label="Total" value={stats.total} sub={`${COLUMNS.length} stages`} accentColor={STAT_ACCENTS.purple} />
          </div>

          {/* Area chart */}
          <Card className="bg-gradient-to-br from-card to-secondary/20">
            <CardHeader className="pb-2">
              <h3 className="text-sm font-semibold text-foreground">Applications By Week</h3>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(36, 95%, 54%)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(36, 95%, 54%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="count" stroke="hsl(36, 95%, 54%)" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bottom row: pie + bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie chart */}
            <Card className="bg-gradient-to-br from-card to-secondary/20">
              <CardHeader className="pb-2">
                <h3 className="text-sm font-semibold text-foreground">Stages</h3>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.breakdown.filter((s) => s.count > 0)}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {stats.breakdown.filter((s) => s.count > 0).map((entry) => (
                          <Cell key={entry.id} fill={STATUS_COLORS[entry.id]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar chart */}
            <Card className="bg-gradient-to-br from-card to-secondary/20">
              <CardHeader className="pb-2">
                <h3 className="text-sm font-semibold text-foreground">By Stage</h3>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.breakdown} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {stats.breakdown.map((entry) => (
                          <Cell key={entry.id} fill={STATUS_COLORS[entry.id]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right column: upcoming sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 bg-gradient-to-br from-card to-secondary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: STAT_ACCENTS.gold + "20" }}>
                  <CalendarDays className="h-4 w-4" style={{ color: STAT_ACCENTS.gold }} />
                </div>
                <span className="text-xs font-medium uppercase tracking-wider">Upcoming</span>
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
                <p className="text-xs text-muted-foreground italic">Nothing upcoming</p>
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

const StatCard = ({ icon, label, value, sub, accentColor }: { icon: React.ReactNode; label: string; value: string | number; sub: string; accentColor: string }) => (
  <div className="rounded-xl border border-border bg-gradient-to-br from-card to-secondary/20 p-4" style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}>
    <div className="flex items-center gap-2 mb-1.5">
      <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: accentColor + "20", color: accentColor }}>{icon}</div>
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
    <p className="text-2xl font-bold text-foreground font-mono">{value}</p>
    <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>
  </div>
);

export default Dashboard;
