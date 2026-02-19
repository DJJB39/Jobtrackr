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
import { APPLICATION_TYPES, type ColumnId, type JobApplication } from "@/types/job";
import { useStages } from "@/hooks/useStages";
import KanbanColumn from "./KanbanColumn";
import JobCard from "./JobCard";
import JobDetailPanel from "./JobDetailPanel";
import AIAssistPanel from "./AIAssistPanel";
import ScheduleEventDialog from "./ScheduleEventDialog";
import BulkActionBar from "./BulkActionBar";
import { parseSalary } from "@/lib/salary";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Filter, X, CheckSquare } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface KanbanBoardProps {
  jobs: JobApplication[];
  setJobs: React.Dispatch<React.SetStateAction<JobApplication[]>>;
  onUpdateJob: (job: JobApplication) => void;
  onDeleteJob: (id: string) => void;
}

const SALARY_BRACKETS = [
  { value: "all", label: "All Salaries" },
  { value: "0-30", label: "Under 30k" },
  { value: "30-60", label: "30k–60k" },
  { value: "60-90", label: "60k–90k" },
  { value: "90-120", label: "90k–120k" },
  { value: "120+", label: "120k+" },
];

const KanbanBoard = ({ jobs, setJobs, onUpdateJob, onDeleteJob }: KanbanBoardProps) => {
  const { stages } = useStages();
  const [activeJob, setActiveJob] = useState<JobApplication | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [filterType, setFilterType] = useState("all_types");
  const [filterStage, setFilterStage] = useState("all_stages");
  const [filterRole, setFilterRole] = useState("all_roles");
  const [filterSalary, setFilterSalary] = useState("all");
  const [mobileStage, setMobileStage] = useState<string>(stages[0]?.id ?? "found");
  const isMobile = useIsMobile();

  const [compact, setCompact] = useState(() => localStorage.getItem("jobtrackr-compact") === "1");

  const handleCompactToggle = useCallback((val: boolean) => {
    setCompact(val);
    localStorage.setItem("jobtrackr-compact", val ? "1" : "0");
  }, []);

  const [scheduleTarget, setScheduleTarget] = useState<JobApplication | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleBulkMove = useCallback((target: ColumnId) => {
    const toMove = jobs.filter((j) => selectedIds.has(j.id));
    setJobs((prev) => prev.map((j) => selectedIds.has(j.id) ? { ...j, columnId: target } : j));
    toMove.forEach((j) => onUpdateJob({ ...j, columnId: target }));
    setSelectedIds(new Set());
    setSelectMode(false);
  }, [selectedIds, jobs, setJobs, onUpdateJob]);

  const handleBulkDelete = useCallback(() => {
    selectedIds.forEach((id) => onDeleteJob(id));
    setSelectedIds(new Set());
    setSelectMode(false);
  }, [selectedIds, onDeleteJob]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectMode(false);
  }, []);

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

    const overColumn = stages.find((c) => c.id === overId);
    const targetColumnId = overColumn
      ? overColumn.id
      : jobs.find((j) => j.id === overId)?.columnId;

    if (!targetColumnId) return;

    setJobs((prev) => {
      const activeJob = prev.find((j) => j.id === activeId);
      if (!activeJob || activeJob.columnId === targetColumnId) return prev;
      return prev.map((j) => j.id === activeId ? { ...j, columnId: targetColumnId } : j);
    });
  };

  const handleDragEnd = (_event: DragEndEvent) => {
    if (activeJob) {
      const updated = jobs.find((j) => j.id === activeJob.id);
      if (updated && updated.columnId !== activeJob.columnId) onUpdateJob(updated);
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
    if (filterType !== "all_types") result = result.filter((j) => j.applicationType === filterType);
    if (filterRole !== "all_roles") result = result.filter((j) => j.role.toLowerCase().includes(filterRole.toLowerCase()));
    if (filterSalary !== "all") {
      result = result.filter((j) => {
        const parsed = parseSalary(j.salary);
        if (!parsed) return filterSalary === "all";
        const max = parsed.max;
        switch (filterSalary) {
          case "0-30": return max <= 30;
          case "30-60": return max > 30 && max <= 60;
          case "60-90": return max > 60 && max <= 90;
          case "90-120": return max > 90 && max <= 120;
          case "120+": return max > 120;
          default: return true;
        }
      });
    }
    return result;
  }, [jobs, filterType, filterRole, filterSalary]);

  // Ctrl/Cmd+A to select all visible cards
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "a" && selectMode) {
        e.preventDefault();
        setSelectedIds(new Set(filteredJobs.map((j) => j.id)));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectMode, filteredJobs]);

  const visibleColumns = useMemo(
    () => filterStage === "all_stages" ? stages : stages.filter((c) => c.id === filterStage),
    [filterStage, stages]
  );

  const getColumnJobs = (columnId: string) => filteredJobs.filter((j) => j.columnId === columnId);

  const hasActiveFilters = filterType !== "all_types" || filterStage !== "all_stages" || filterRole !== "all_roles" || filterSalary !== "all";

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 pt-4 pb-0">
        <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px] sm:w-[180px] h-9">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_types">All Types</SelectItem>
            {APPLICATION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!isMobile && (
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Filter by stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_stages">All Stages</SelectItem>
              {stages.map((col) => (
                <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[140px] sm:w-[180px] h-9">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_roles">All Roles</SelectItem>
            {uniqueRoles.map((role) => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSalary} onValueChange={setFilterSalary}>
          <SelectTrigger className="w-[130px] sm:w-[150px] h-9">
            <SelectValue placeholder="Salary" />
          </SelectTrigger>
          <SelectContent>
            {SALARY_BRACKETS.map((b) => (
              <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-muted-foreground"
            onClick={() => { setFilterType("all_types"); setFilterStage("all_stages"); setFilterRole("all_roles"); setFilterSalary("all"); }}
          >
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <Switch id="compact-mode" checked={compact} onCheckedChange={handleCompactToggle} />
            <Label htmlFor="compact-mode" className="text-xs text-muted-foreground cursor-pointer">Compact</Label>
          </div>
          <Button
            variant={selectMode ? "secondary" : "ghost"}
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={() => { setSelectMode(!selectMode); if (selectMode) setSelectedIds(new Set()); }}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            {selectMode ? "Cancel" : "Select"}
          </Button>
        </div>
      </div>

      {/* Mobile: stage selector + single column */}
      {isMobile ? (
        <div className="flex-1 flex flex-col p-4 space-y-3">
          <Select value={mobileStage} onValueChange={setMobileStage}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map((col) => (
                <SelectItem key={col.id} value={col.id}>
                  {col.title} ({getColumnJobs(col.id).length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="space-y-2">
            {getColumnJobs(mobileStage).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onDelete={onDeleteJob}
                onClick={handleCardClick}
                onSchedule={handleScheduleFromCard}
                columnId={mobileStage as ColumnId}
                selected={selectedIds.has(job.id)}
                onToggleSelect={toggleSelect}
                selectMode={selectMode}
                compact={compact}
              />
            ))}
            {getColumnJobs(mobileStage).length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No applications in this stage</p>
            )}
          </div>
        </div>
      ) : (
        /* Desktop: full kanban */
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
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  selectMode={selectMode}
                  compact={compact}
                  autoCollapse={filterStage === "all_stages"}
                />
              ))}
            </div>
            <DragOverlay>
              {activeJob ? (
                <div className="rotate-3 scale-105">
                  <JobCard job={activeJob} onDelete={() => {}} columnId={activeJob.columnId} compact={compact} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      <JobDetailPanel
        job={selectedJob}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onSave={handleSaveJob}
        onOpenAI={() => setAiPanelOpen(true)}
      />

      {selectedJob && (
        <AIAssistPanel job={selectedJob} open={aiPanelOpen} onOpenChange={setAiPanelOpen} />
      )}

      {scheduleTarget && (
        <ScheduleEventDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          job={scheduleTarget}
          onSave={handleScheduleSave}
        />
      )}

      <BulkActionBar
        selectedCount={selectedIds.size}
        onMove={handleBulkMove}
        onDelete={handleBulkDelete}
        onClear={clearSelection}
      />
    </>
  );
};

export default KanbanBoard;
