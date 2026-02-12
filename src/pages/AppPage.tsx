import { useState, useCallback } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import Dashboard from "@/components/Dashboard";
import AddJobDialog from "@/components/AddJobDialog";
import UserMenu from "@/components/UserMenu";
import { Briefcase, LayoutDashboard, Columns3, Loader2, Download, CalendarDays, X } from "lucide-react";
import CalendarView from "@/components/CalendarView";
import JobDetailPanel from "@/components/JobDetailPanel";
import AIAssistPanel from "@/components/AIAssistPanel";
import CommandPalette from "@/components/CommandPalette";
import { useJobs } from "@/hooks/useJobs";
import { useOnboarding } from "@/hooks/useOnboarding";
import type { JobApplication } from "@/types/job";
import { useLoginReminders } from "@/hooks/useLoginReminders";
import { Button } from "@/components/ui/button";
import { COLUMNS } from "@/types/job";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type View = "board" | "dashboard" | "calendar";

const AppPage = () => {
  const { jobs, setJobs, loading, addJob, updateJob, deleteJob } = useJobs();
  const [view, setView] = useState<View>("board");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const { toast } = useToast();
  useLoginReminders(jobs);

  const { showBanner, dismissBanner } = useOnboarding({ jobCount: jobs.length, loading, addJob });

  const handleSelectJob = useCallback((job: JobApplication) => {
    setSelectedJob(job);
    setPanelOpen(true);
  }, []);

  const exportToCSV = () => {
    const stageMap = Object.fromEntries(COLUMNS.map((c) => [c.id, c.title]));
    const headers = ["Company", "Role", "Stage", "Type", "Created", "Location", "Salary", "Deadline", "Events", "Notes", "Description", "Links"];
    const rows = jobs.map((j) => [
      j.company,
      j.role,
      stageMap[j.columnId] ?? j.columnId,
      j.applicationType,
      j.createdAt,
      j.location ?? "",
      j.salary ?? "",
      j.closeDate ?? "",
      String((j.events ?? []).length),
      (j.notes ?? "").slice(0, 100).replace(/"/g, '""'),
      (j.description ?? "").slice(0, 100).replace(/"/g, '""'),
      (j.links ?? []).join("; "),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jobtrackr-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported", description: `${jobs.length} application(s) exported` });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[hsl(var(--gradient-start))] via-background to-[hsl(var(--gradient-end))]">
      <header className="border-b border-border px-4 sm:px-6 py-4 backdrop-blur-sm bg-background/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">JobTrackr</h1>
              <p className="text-xs text-muted-foreground font-mono">
                {jobs.length} application{jobs.length !== 1 ? "s" : ""} · <span className="opacity-60">⌘K search</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <nav className="hidden sm:flex items-center rounded-lg border border-border bg-muted p-0.5 mr-3">
              <button
                onClick={() => setView("board")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === "board"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Columns3 className="h-3.5 w-3.5" />
                Board
              </button>
              <button
                onClick={() => setView("dashboard")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === "dashboard"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === "calendar"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Calendar
              </button>
            </nav>

            {/* Mobile view switcher */}
            <div className="flex sm:hidden items-center rounded-lg border border-border bg-muted p-0.5 mr-1">
              <button onClick={() => setView("board")} className={`p-1.5 rounded-md ${view === "board" ? "bg-background shadow-sm" : ""}`}>
                <Columns3 className="h-4 w-4" />
              </button>
              <button onClick={() => setView("dashboard")} className={`p-1.5 rounded-md ${view === "dashboard" ? "bg-background shadow-sm" : ""}`}>
                <LayoutDashboard className="h-4 w-4" />
              </button>
              <button onClick={() => setView("calendar")} className={`p-1.5 rounded-md ${view === "calendar" ? "bg-background shadow-sm" : ""}`}>
                <CalendarDays className="h-4 w-4" />
              </button>
            </div>

            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex" onClick={exportToCSV} disabled={jobs.length === 0}>
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
            <AddJobDialog onAdd={addJob} jobs={jobs} />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Onboarding banner */}
      {showBanner && (
        <div className="flex items-center gap-3 bg-primary/10 border-b border-primary/20 px-6 py-2.5">
          <span className="text-sm text-foreground">
            👋 We added sample jobs to help you explore. Delete them anytime!
          </span>
          <Button variant="ghost" size="sm" onClick={dismissBanner} className="ml-auto h-7">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {jobs.length === 0 && !showBanner ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <Briefcase className="h-16 w-16 text-muted-foreground/50" />
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">No applications yet</h2>
            <p className="text-sm text-muted-foreground mt-1">Add your first job to get started</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Briefcase className="h-4 w-4" />
            Add Application
          </Button>
          <AddJobDialog onAdd={addJob} open={dialogOpen} onOpenChange={setDialogOpen} jobs={jobs} />
        </div>
      ) : view === "board" ? (
        <KanbanBoard jobs={jobs} setJobs={setJobs} onUpdateJob={updateJob} onDeleteJob={deleteJob} />
      ) : view === "dashboard" ? (
        <Dashboard jobs={jobs} onUpdateJob={updateJob} />
      ) : (
        <CalendarView jobs={jobs} onSelectJob={handleSelectJob} />
      )}

      {/* Detail panel for calendar + AI trigger */}
      <JobDetailPanel
        job={selectedJob}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onSave={updateJob}
        onOpenAI={() => setAiPanelOpen(true)}
      />

      {/* AI Assistant */}
      {selectedJob && (
        <AIAssistPanel job={selectedJob} open={aiPanelOpen} onOpenChange={setAiPanelOpen} />
      )}

      {/* Command Palette */}
      <CommandPalette
        jobs={jobs}
        onSelectJob={handleSelectJob}
        onSwitchView={setView}
        onAddJob={() => setDialogOpen(true)}
        onExport={exportToCSV}
      />
    </div>
  );
};

export default AppPage;
