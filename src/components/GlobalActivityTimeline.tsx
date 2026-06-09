import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { COLUMNS } from "@/types/job";
import type { JobApplication } from "@/types/job";
import {
  ArrowRight, StickyNote, UserPlus, UserMinus,
  CalendarPlus, Link as LinkIcon, Activity, History,
} from "lucide-react";

interface ActivityLog {
  id: string;
  job_id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

const STAGE_MAP = Object.fromEntries(COLUMNS.map((c) => [c.id, c.title]));

const ACTION_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  stage_change: { icon: ArrowRight, label: "Stage changed", color: "hsl(36, 95%, 54%)" },
  notes_edited: { icon: StickyNote, label: "Notes updated", color: "hsl(215, 80%, 55%)" },
  contact_added: { icon: UserPlus, label: "Contact added", color: "hsl(142, 60%, 42%)" },
  contact_removed: { icon: UserMinus, label: "Contact removed", color: "hsl(0, 72%, 51%)" },
  event_added: { icon: CalendarPlus, label: "Event scheduled", color: "hsl(24, 85%, 52%)" },
  event_removed: { icon: CalendarPlus, label: "Event removed", color: "hsl(0, 72%, 51%)" },
  link_changed: { icon: LinkIcon, label: "Links updated", color: "hsl(190, 75%, 42%)" },
};

interface GlobalActivityTimelineProps {
  jobs: JobApplication[];
  onSelectJob?: (job: JobApplication) => void;
  isDemo?: boolean;
}

const GlobalActivityTimeline = ({ jobs, onSelectJob, isDemo }: GlobalActivityTimelineProps) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    const run = async () => {
      const jobIds = jobs.map((j) => j.id);
      if (jobIds.length === 0) { setLogs([]); setLoading(false); return; }
      const { data } = await supabase
        .from("job_activity_log")
        .select("*")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!cancelled) {
        setLogs((data as unknown as ActivityLog[]) ?? []);
        setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [isDemo, jobs]);

  const jobById = Object.fromEntries(jobs.map((j) => [j.id, j]));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-display font-semibold text-foreground">Activity History</h2>
        </div>
        {isDemo ? (
          <p className="text-sm text-muted-foreground italic">
            Activity history is only recorded for signed-in accounts.
          </p>
        ) : loading ? (
          <p className="text-xs text-muted-foreground">Loading activity…</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No activity yet — your moves will show here.</p>
        ) : (
          <div className="relative space-y-0">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
            {logs.map((log) => {
              const config = ACTION_CONFIG[log.action] ?? { icon: Activity, label: log.action, color: "hsl(var(--muted-foreground))" };
              const Icon = config.icon;
              const job = jobById[log.job_id];
              const details = log.details as { from?: string; to?: string } | null;
              return (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => job && onSelectJob?.(job)}
                  className="relative flex w-full items-start gap-3 py-2 text-left hover:bg-muted/40 rounded transition-colors px-1"
                >
                  <div
                    className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full z-10 mt-0.5"
                    style={{ backgroundColor: config.color + "20" }}
                  >
                    <Icon className="h-3 w-3" style={{ color: config.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground">
                      {config.label}
                      {log.action === "stage_change" && details?.from && details?.to && (
                        <span className="text-muted-foreground">
                          {" "}{STAGE_MAP[details.from] ?? details.from} → {STAGE_MAP[details.to] ?? details.to}
                        </span>
                      )}
                      {job && (
                        <span className="text-muted-foreground"> · {job.company} — {job.role}</span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalActivityTimeline;