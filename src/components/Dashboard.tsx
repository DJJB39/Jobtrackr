import { useMemo } from "react";
import { COLUMNS, type JobApplication } from "@/types/job";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Activity, Layers } from "lucide-react";

interface DashboardProps {
  jobs: JobApplication[];
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

const Dashboard = ({ jobs }: DashboardProps) => {
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

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Added This Week"
            value={stats.thisWeek}
            sub={`of ${stats.total} total`}
          />
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            label="Response Rate"
            value={`${stats.responseRate}%`}
            sub="excl. Found & Rejected"
          />
          <StatCard
            icon={<Layers className="h-5 w-5" />}
            label="Total Applications"
            value={stats.total}
            sub={`across ${COLUMNS.length} stages`}
          />
        </div>

        {/* Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
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
                    background: "hsl(var(--popover))",
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
              className="rounded-lg border border-border bg-card p-3 text-center"
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
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
}) => (
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="flex items-center gap-2 text-muted-foreground mb-2">
      {icon}
      <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-3xl font-bold text-foreground font-mono">{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
  </div>
);

export default Dashboard;
