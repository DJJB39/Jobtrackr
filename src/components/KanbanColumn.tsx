import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Column, JobApplication } from "@/types/job";
import JobCard from "./JobCard";

const STATUS_COLORS_HEX: Record<string, string> = {
  found: "#3b82f6",
  applied: "#8b5cf6",
  phone: "#06b6d4",
  interview2: "#f59e0b",
  final: "#f97316",
  offer: "#22c55e",
  accepted: "#16a34a",
  rejected: "#ef4444",
};

interface KanbanColumnProps {
  column: Column;
  jobs: JobApplication[];
  onDeleteJob: (id: string) => void;
  onClickJob?: (job: JobApplication) => void;
  onScheduleJob?: (job: JobApplication) => void;
}

const KanbanColumn = ({ column, jobs, onDeleteJob, onClickJob, onScheduleJob }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const tintColor = STATUS_COLORS_HEX[column.id] ?? "#888";

  return (
    <div
      className={`flex w-64 shrink-0 flex-col rounded-xl bg-gradient-to-b from-column to-transparent transition-colors ${
        isOver ? "ring-2 ring-accent/50" : ""
      }`}
    >
      <div
        className="flex items-center gap-2 px-3 py-3 rounded-t-xl"
        style={{ backgroundColor: tintColor + "15" }}
      >
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: tintColor }}
        />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-column-header">
          {column.title}
        </h3>
        <span
          className="ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] font-medium text-foreground"
          style={{ backgroundColor: tintColor + "20" }}
        >
          {jobs.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex min-h-[120px] flex-1 flex-col gap-2 px-2 pb-3 pt-2"
      >
        <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onDelete={onDeleteJob}
              onClick={onClickJob}
              onSchedule={onScheduleJob}
              columnId={column.id}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;
