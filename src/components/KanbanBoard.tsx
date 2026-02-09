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
import JobDetailPanel from "./JobDetailPanel";
import { Briefcase } from "lucide-react";

const defaultFields = { notes: "", contacts: [], nextSteps: [], links: [] };

const SAMPLE_JOBS: JobApplication[] = [
  { id: "1", company: "Stripe", role: "Senior Frontend Engineer", columnId: "applied", createdAt: new Date().toISOString(), ...defaultFields },
  { id: "2", company: "Vercel", role: "Full Stack Developer", columnId: "found", createdAt: new Date().toISOString(), ...defaultFields },
  { id: "3", company: "Linear", role: "Product Engineer", columnId: "phone", createdAt: new Date().toISOString(), ...defaultFields },
  { id: "4", company: "Figma", role: "Design Engineer", columnId: "found", createdAt: new Date().toISOString(), ...defaultFields },
  { id: "5", company: "Notion", role: "Software Engineer", columnId: "interview2", createdAt: new Date().toISOString(), ...defaultFields },
];

const KanbanBoard = () => {
  const [jobs, setJobs] = useState<JobApplication[]>(SAMPLE_JOBS);
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
    setActiveJob(null);
  };

  const addJob = useCallback((company: string, role: string, columnId: ColumnId) => {
    const newJob: JobApplication = {
      id: crypto.randomUUID(),
      company,
      role,
      columnId,
      createdAt: new Date().toISOString(),
      ...defaultFields,
    };
    setJobs((prev) => [...prev, newJob]);
  }, []);

  const deleteJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const handleCardClick = useCallback((job: JobApplication) => {
    setSelectedJob(job);
    setPanelOpen(true);
  }, []);

  const handleSaveJob = useCallback((updated: JobApplication) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    setSelectedJob(updated);
  }, []);

  const getColumnJobs = (columnId: ColumnId) =>
    jobs.filter((j) => j.columnId === columnId);

  return (
    <div className="flex min-h-screen flex-col bg-background">
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
    </div>
  );
};

export default KanbanBoard;
