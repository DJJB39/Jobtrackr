import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Column, JobApplication } from "@/types/job";
import JobCard from "./JobCard";

interface KanbanColumnProps {
  column: Column;
  jobs: JobApplication[];
  onDeleteJob: (id: string) => void;
  onClickJob?: (job: JobApplication) => void;
  onScheduleJob?: (job: JobApplication) => void;
}

const KanbanColumn = ({ column, jobs, onDeleteJob, onClickJob, onScheduleJob }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      className={`flex w-64 shrink-0 flex-col rounded-xl bg-column transition-colors ${
        isOver ? "ring-2 ring-accent/50" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-3">
        <div className={`h-2.5 w-2.5 rounded-full ${column.colorClass}`} />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-column-header">
          {column.title}
        </h3>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {jobs.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex min-h-[120px] flex-1 flex-col gap-2 px-2 pb-3"
      >
        <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onDelete={onDeleteJob} onClick={onClickJob} onSchedule={onScheduleJob} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;
