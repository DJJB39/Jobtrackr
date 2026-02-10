import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  closestCorners,
} from "@dnd-kit/core";
import { COLUMNS, type ColumnId, type JobApplication } from "@/types/job";
import KanbanColumn from "./KanbanColumn";
import JobCard from "./JobCard";
import JobDetailPanel from "./JobDetailPanel";

interface KanbanBoardProps {
  jobs: JobApplication[];
  setJobs: React.Dispatch<React.SetStateAction<JobApplication[]>>;
  onUpdateJob: (job: JobApplication) => void;
  onDeleteJob: (id: string) => void;
}

const KanbanBoard = ({ jobs, setJobs, onUpdateJob, onDeleteJob }: KanbanBoardProps) => {
  const [activeJob, setActiveJob] = useState<JobApplication | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const job = jobs.find((j) => j.id === event.active.id);
    if (job) setActiveJob(job);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const overColumn = COLUMNS.find((c) => c.id === overId);
    if (overColumn) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === activeId ? { ...j, columnId: overColumn.id } : j
        )
      );
      return;
    }

    const overJob = jobs.find((j) => j.id === overId);
    if (overJob) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === activeId ? { ...j, columnId: overJob.columnId } : j
        )
      );
    }
  };

  const handleDragEnd = (_event: DragEndEvent) => {
    if (activeJob) {
      const updated = jobs.find((j) => j.id === activeJob.id);
      if (updated && updated.columnId !== activeJob.columnId) {
        onUpdateJob(updated);
      }
    }
    setActiveJob(null);
  };

  const handleCardClick = useCallback((job: JobApplication) => {
    setSelectedJob(job);
    setPanelOpen(true);
  }, []);

  const handleSaveJob = useCallback((updated: JobApplication) => {
    onUpdateJob(updated);
    setSelectedJob(updated);
  }, [onUpdateJob]);

  const getColumnJobs = (columnId: ColumnId) =>
    jobs.filter((j) => j.columnId === columnId);

  return (
    <>
      <div className="flex-1 overflow-x-auto kanban-scrollbar p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                jobs={getColumnJobs(column.id)}
                onDeleteJob={onDeleteJob}
                onClickJob={handleCardClick}
              />
            ))}
          </div>

          <DragOverlay>
            {activeJob ? (
              <div className="rotate-3 scale-105">
                <JobCard job={activeJob} onDelete={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <JobDetailPanel
        job={selectedJob}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onSave={handleSaveJob}
      />
    </>
  );
};

export default KanbanBoard;
