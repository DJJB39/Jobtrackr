import { useMemo, useState } from "react";
import { COLUMNS, type JobApplication } from "@/types/job";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Activity, Layers, CalendarDays } from "lucide-react";
import { parseISO, format, isBefore, startOfDay } from "date-fns";
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
};

const Dashboard = ({ jobs, onUpdateJob }: DashboardProps) => {
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = jobs.filter((j) => new Date(j.createdAt) >= weekAgo);

    const active = jobs.filter(
      (j) => j.columnId !== "found" && j.columnId !== "rejected"
    );
    const responseRate = jobs.length > 0 ? Math.round((active.length / jobs.length) * 100) : 0;

    const breakdown = COLUMNS.map((col) => ({
      name: col.title,
      count: jobs.filter((j) => j.columnId === col.id).length,
      id: col.id,
    }));

    return { thisWeek: thisWeek.length, responseRate, breakdown, total: jobs.length };
  }, [jobs]);

  const upcomingItems = useMemo(() => {
    const today = startOfDay(new Date());
    const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const items: UpcomingItem[] = [];

    for (const job of jobs) {
      for (const evt of job.events ?? []) {
        try {
          const d = parseISO(evt.date);
          if (!isBefore(d, today) && isBefore(d, in7Days)) {
            items.push({
              id: evt.id,
              title: evt.title,
              company: job.company,
              role: job.role,
              date: evt.date,
              time: evt.time,
              type: evt.type,
            });
          }
        } catch { /* skip invalid */ }
      }
      if (job.closeDate) {
        try {
          const d = parseISO(job.closeDate);
          if (!isBefore(d, today) && isBefore(d, in7Days)) {
            items.push({
              id: `deadline-${job.id}`,
              title: `Deadline: ${job.company}`,
              company: job.company,
              role: job.role,
              date: job.closeDate,
              time: null,
              type: "deadline",
            });
          }
        } catch { /* skip invalid */ }
      }
    }

    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [jobs]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Upcoming This Week */}
        <Card className="bg-gradient-to-br from-card to-secondary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: STAT_ACCENTS.gold + "20" }}>
                <CalendarDays className="h-5 w-5" style={{ color: STAT_ACCENTS.gold }} />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider">Upcoming This Week</span>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingItems.length > 0 ? (
              <div className="space-y-2">
                {upcomingItems.map((item) => {
                  const parentJob = jobs.find(j => j.company === item.company && j.role === item.role);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (parentJob) {
                          setSelectedJob(parentJob);
                          setPanelOpen(true);
                        }
                      }}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-xs font-mono text-muted-foreground w-14 shrink-0">
                        {format(parseISO(item.date), "MMM d")}
                      </span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {EVENT_TYPE_LABELS[item.type] ?? item.type}
                      </Badge>
                      <span className="text-sm text-foreground truncate">{item.title}</span>
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">{item.company}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Nothing this week</p>
            )}
          </CardContent>
        </Card>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Added This Week"
            value={stats.thisWeek}
            sub={`of ${stats.total} total`}
            accentColor={STAT_ACCENTS.gold}
          />
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            label="Response Rate"
            value={`${stats.responseRate}%`}
            sub="excl. Found & Rejected"
            accentColor={STAT_ACCENTS.blue}
          />
          <StatCard
            icon={<Layers className="h-5 w-5" />}
            label="Total Applications"
            value={stats.total}
            sub={`across ${COLUMNS.length} stages`}
            accentColor={STAT_ACCENTS.purple}
          />
        </div>

        {/* Chart */}
        <div className="rounded-xl border border-border bg-gradient-to-br from-card via-card to-secondary/20 p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Applications by Stage</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.breakdown} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(222, 44%, 12%)",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {stats.breakdown.map((entry) => (
                    <Cell key={entry.id} fill={STATUS_COLORS[entry.id]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stage breakdown cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.breakdown.map((stage) => (
            <div
              key={stage.id}
              className="rounded-lg border border-border bg-gradient-to-b from-card to-secondary/10 p-3 text-center transition-shadow hover:shadow-md"
            >
              <div
                className="mx-auto mb-2 h-2 w-8 rounded-full"
                style={{ background: STATUS_COLORS[stage.id] }}
              />
              <p className="text-2xl font-bold text-foreground font-mono">{stage.count}</p>
              <p className="text-xs text-muted-foreground">{stage.name}</p>
            </div>
          ))}
        </div>
      </div>

      <JobDetailPanel
        job={selectedJob}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onSave={(updated) => {
          onUpdateJob?.(updated);
          setSelectedJob(updated);
        }}
      />
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  sub,
  accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  accentColor: string;
}) => (
  <div
    className="rounded-xl border border-border bg-gradient-to-br from-card to-secondary/20 p-5"
    style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}
  >
    <div className="flex items-center gap-2 mb-2">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: accentColor + "20" }}
      >
        {icon}
      </div>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
    <p className="text-3xl font-bold text-foreground font-mono">{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
  </div>
);

export default Dashboard;
