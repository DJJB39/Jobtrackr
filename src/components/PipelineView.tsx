import { useState } from "react";
import { Columns3, List as ListIcon, CalendarDays } from "lucide-react";
import KanbanBoard from "@/components/KanbanBoard";
import ListView from "@/components/ListView";
import CalendarView from "@/components/CalendarView";
import type { JobApplication } from "@/types/job";

export type PipelineMode = "kanban" | "list" | "calendar";

interface PipelineViewProps {
  jobs: JobApplication[];
  filteredJobs: JobApplication[];
  searchQuery: string;
  setJobs: React.Dispatch<React.SetStateAction<JobApplication[]>>;
  onUpdateJob: (job: JobApplication) => void;
  onDeleteJob: (id: string) => void;
  onSelectJob: (job: JobApplication) => void;
  onSwitchToYou?: () => void;
}

const MODES: { id: PipelineMode; label: string; icon: React.ElementType }[] = [
  { id: "kanban", label: "KANBAN", icon: Columns3 },
  { id: "list", label: "LIST", icon: ListIcon },
  { id: "calendar", label: "CALENDAR", icon: CalendarDays },
];

const PipelineView = ({
  jobs, filteredJobs, searchQuery, setJobs,
  onUpdateJob, onDeleteJob, onSelectJob, onSwitchToYou,
}: PipelineViewProps) => {
  const [mode, setMode] = useState<PipelineMode>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("pipeline-mode") : null;
    return (saved as PipelineMode) ?? "kanban";
  });

  const handleMode = (m: PipelineMode) => {
    setMode(m);
    try { localStorage.setItem("pipeline-mode", m); } catch { /* ignore */ }
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex items-center gap-2 px-4 sm:px-6 pt-3">
        <div className="inline-flex items-center rounded-lg border border-border/50 bg-secondary/30 p-0.5">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleMode(m.id)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10px] tracking-[0.15em] transition-colors ${
                  active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3 w-3" />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {mode === "kanban" && (
        <KanbanBoard
          jobs={searchQuery ? filteredJobs : jobs}
          setJobs={setJobs}
          onUpdateJob={onUpdateJob}
          onDeleteJob={onDeleteJob}
          onSwitchView={() => onSwitchToYou?.()}
        />
      )}
      {mode === "list" && (
        <ListView jobs={jobs} onSelectJob={onSelectJob} searchQuery={searchQuery} />
      )}
      {mode === "calendar" && (
        <CalendarView jobs={filteredJobs} onSelectJob={onSelectJob} />
      )}
    </div>
  );
};

export default PipelineView;