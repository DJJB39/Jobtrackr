import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { COLUMNS } from "@/types/job";
import {
  ArrowRight,
  StickyNote,
  UserPlus,
  UserMinus,
  CalendarPlus,
  Link as LinkIcon,
  Activity,
} from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  details: any;
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

const ActivityTimeline = ({ jobId }: { jobId: string }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("job_activity_log")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false })
        .limit(20);
      setLogs((data as any[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, [jobId]);

  if (loading) return <p className="text-xs text-muted-foreground">Loading activity…</p>;
  if (logs.length === 0) return <p className="text-xs text-muted-foreground italic">No activity recorded yet</p>;

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

      {logs.map((log) => {
        const config = ACTION_CONFIG[log.action] ?? { icon: Activity, label: log.action, color: "hsl(var(--muted-foreground))" };
        const Icon = config.icon;
        return (
          <div key={log.id} className="relative flex items-start gap-3 py-1.5">
            <div
              className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full z-10"
              style={{ backgroundColor: config.color + "20" }}
            >
              <Icon className="h-3 w-3" style={{ color: config.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground">
                {config.label}
                {log.action === "stage_change" && log.details?.from && log.details?.to && (
                  <span className="text-muted-foreground">
                    {" "}{STAGE_MAP[log.details.from] ?? log.details.from} → {STAGE_MAP[log.details.to] ?? log.details.to}
                  </span>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityTimeline;
