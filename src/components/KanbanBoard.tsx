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
import ScheduleEventDialog from "./ScheduleEventDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [filterStage, setFilterStage] = useState("all_stages");
  const [filterRole, setFilterRole] = useState("all_roles");
  const [searchQuery, setSearchQuery] = useState("");

  // Schedule dialog state
  const [scheduleTarget, setScheduleTarget] = useState<JobApplication | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const uniqueRoles = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.role).filter(Boolean))).sort(),
    [jobs]
  );

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

  const handleScheduleFromCard = useCallback((job: JobApplication) => {
    setScheduleTarget(job);
    setScheduleDialogOpen(true);
  }, []);

  const handleScheduleSave = useCallback((updatedJob: JobApplication) => {
    onUpdateJob(updatedJob);
  }, [onUpdateJob]);

  const filteredJobs = useMemo(() => {
    let result = jobs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (j) =>
          j.company.toLowerCase().includes(q) ||
          j.role.toLowerCase().includes(q) ||
          j.notes.toLowerCase().includes(q)
      );
    }
    if (filterType !== "All") {
      result = result.filter((j) => j.applicationType === filterType);
    }
    if (filterRole !== "all_roles") {
      result = result.filter((j) => j.role.toLowerCase().includes(filterRole.toLowerCase()));
    }
    return result;
  }, [jobs, filterType, filterRole, searchQuery]);

  const visibleColumns = useMemo(
    () => filterStage === "all_stages" ? COLUMNS : COLUMNS.filter((c) => c.id === filterStage),
    [filterStage]
  );

  const getColumnJobs = (columnId: ColumnId) =>
    filteredJobs.filter((j) => j.columnId === columnId);

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 px-6 pt-4 pb-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search company, role…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-[200px] pl-8 text-sm"
          />
        </div>
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px] h-9">
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

        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_stages">All Stages</SelectItem>
            {COLUMNS.map((col) => (
              <SelectItem key={col.id} value={col.id}>
                {col.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_roles">All Roles</SelectItem>
            {uniqueRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(filterType !== "All" || filterStage !== "all_stages" || filterRole !== "all_roles" || searchQuery) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-muted-foreground"
            onClick={() => {
              setFilterType("All");
              setFilterStage("all_stages");
              setFilterRole("all_roles");
              setSearchQuery("");
            }}
          >
            <X className="h-3.5 w-3.5" />
            Clear Filters
          </Button>
        )}
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
            {visibleColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                jobs={getColumnJobs(column.id)}
                onDeleteJob={onDeleteJob}
                onClickJob={handleCardClick}
                onScheduleJob={handleScheduleFromCard}
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

      {scheduleTarget && (
        <ScheduleEventDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          job={scheduleTarget}
          onSave={handleScheduleSave}
        />
      )}
    </>
  );
};

export default KanbanBoard;
