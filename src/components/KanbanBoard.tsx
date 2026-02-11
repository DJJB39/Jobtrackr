import { useState, useCallback, useMemo } from "react";
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
import { COLUMNS, APPLICATION_TYPES, type ColumnId, type JobApplication } from "@/types/job";
import KanbanColumn from "./KanbanColumn";
import JobCard from "./JobCard";
import JobDetailPanel from "./JobDetailPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

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
  const [filterType, setFilterType] = useState("All");

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

  const filteredJobs = useMemo(
    () => filterType === "All" ? jobs : jobs.filter((j) => j.applicationType === filterType),
    [jobs, filterType]
  );

  const getColumnJobs = (columnId: ColumnId) =>
    filteredJobs.filter((j) => j.columnId === columnId);

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center gap-2 px-6 pt-4 pb-0">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {APPLICATION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
