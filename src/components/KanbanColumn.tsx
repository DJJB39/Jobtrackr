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
      className={`flex w-72 shrink-0 flex-col rounded-xl transition-colors ${
        isOver ? "ring-2 ring-accent/50" : ""
      }`}
    >
      <div className="px-3 py-3 text-center">
        <h3 className="text-sm font-semibold text-foreground">
          {column.title} <span className="text-muted-foreground font-normal">({jobs.length})</span>
        </h3>
      </div>

      <div
        ref={setNodeRef}
        className="flex min-h-[120px] flex-1 flex-col gap-2 px-2 pb-3 pt-1"
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
