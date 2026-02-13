import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import type { Column, JobApplication } from "@/types/job";
import JobCard from "./JobCard";

interface KanbanColumnProps {
  column: Column;
  jobs: JobApplication[];
  onDeleteJob: (id: string) => void;
  onClickJob?: (job: JobApplication) => void;
  onScheduleJob?: (job: JobApplication) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  selectMode?: boolean;
}

const KanbanColumn = ({ column, jobs, onDeleteJob, onClickJob, onScheduleJob, selectedIds, onToggleSelect, selectMode }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-2xl transition-all duration-300 ${
        isOver
          ? "ring-2 ring-primary/40 bg-primary/5"
          : "glass-surface"
      }`}
    >
      {/* Column header */}
      <div className="px-3 py-3 flex items-center justify-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full ${column.colorClass} ring-2 ring-offset-1 ring-offset-background`}
          style={{ boxShadow: `0 0 8px hsl(var(--status-${column.id}) / 0.4)` }}
        />
        <h3 className="text-sm font-semibold text-foreground tracking-tight">
          {column.title}
        </h3>
        <span className="text-xs text-muted-foreground font-mono tabular-nums bg-muted/50 px-1.5 py-0.5 rounded-md">
          {jobs.length}
        </span>
      </div>

      <div className="flex min-h-[120px] flex-1 flex-col gap-2 px-2 pb-3 pt-1">
        <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onDelete={onDeleteJob}
                onClick={onClickJob}
                onSchedule={onScheduleJob}
                columnId={column.id}
                selected={selectedIds?.has(job.id)}
                onToggleSelect={onToggleSelect}
                selectMode={selectMode}
              />
            ))}
          </AnimatePresence>
        </SortableContext>

        {jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
            <div className="h-8 w-8 rounded-lg border-2 border-dashed border-current mb-2" />
            <span className="text-xs">Drop here</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
