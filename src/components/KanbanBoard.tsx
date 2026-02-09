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
import AddJobDialog from "./AddJobDialog";
import { Briefcase } from "lucide-react";

const SAMPLE_JOBS: JobApplication[] = [
  { id: "1", company: "Stripe", role: "Senior Frontend Engineer", columnId: "applied", createdAt: new Date().toISOString() },
  { id: "2", company: "Vercel", role: "Full Stack Developer", columnId: "found", createdAt: new Date().toISOString() },
  { id: "3", company: "Linear", role: "Product Engineer", columnId: "phone", createdAt: new Date().toISOString() },
  { id: "4", company: "Figma", role: "Design Engineer", columnId: "found", createdAt: new Date().toISOString() },
  { id: "5", company: "Notion", role: "Software Engineer", columnId: "interview2", createdAt: new Date().toISOString() },
];

const KanbanBoard = () => {
  const [jobs, setJobs] = useState<JobApplication[]>(SAMPLE_JOBS);
  const [activeJob, setActiveJob] = useState<JobApplication | null>(null);

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

    // Check if dropping over a column
    const overColumn = COLUMNS.find((c) => c.id === overId);
    if (overColumn) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === activeId ? { ...j, columnId: overColumn.id } : j
        )
      );
      return;
    }

    // Dropping over another job card
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
    setActiveJob(null);
  };

  const addJob = useCallback((company: string, role: string, columnId: ColumnId) => {
    const newJob: JobApplication = {
      id: crypto.randomUUID(),
      company,
      role,
      columnId,
      createdAt: new Date().toISOString(),
    };
    setJobs((prev) => [...prev, newJob]);
  }, []);

  const deleteJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const getColumnJobs = (columnId: ColumnId) =>
    jobs.filter((j) => j.columnId === columnId);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                JobTrackr
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                {jobs.length} application{jobs.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <AddJobDialog onAdd={addJob} />
        </div>
      </header>

      {/* Board */}
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
                onDeleteJob={deleteJob}
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
    </div>
  );
};

export default KanbanBoard;
