import { useState, useCallback } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import Dashboard from "@/components/Dashboard";
import ListView from "@/components/ListView";
import AddJobDialog from "@/components/AddJobDialog";
import UserMenu from "@/components/UserMenu";
import { Briefcase, LayoutDashboard, Columns3, Loader2, Download, CalendarDays, X, List, Search } from "lucide-react";
import CalendarView from "@/components/CalendarView";
import JobDetailPanel from "@/components/JobDetailPanel";
import AIAssistPanel from "@/components/AIAssistPanel";
import CommandPalette from "@/components/CommandPalette";
import { useJobs } from "@/hooks/useJobs";
import { useOnboarding } from "@/hooks/useOnboarding";
import type { JobApplication } from "@/types/job";
import { useLoginReminders } from "@/hooks/useLoginReminders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COLUMNS } from "@/types/job";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type View = "board" | "dashboard" | "calendar" | "list";

const AppPage = () => {
  const { jobs, setJobs, loading, addJob, updateJob, deleteJob } = useJobs();
  const [view, setView] = useState<View>("board");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  useLoginReminders(jobs);

  const { showBanner, dismissBanner } = useOnboarding({ jobCount: jobs.length, loading, addJob });

  const handleSelectJob = useCallback((job: JobApplication) => {
    setSelectedJob(job);
    setPanelOpen(true);
  }, []);

  const filteredJobs = searchQuery
    ? jobs.filter((j) => {
        const q = searchQuery.toLowerCase();
        return (
          j.company.toLowerCase().includes(q) ||
          j.role.toLowerCase().includes(q) ||
          (j.notes ?? "").toLowerCase().includes(q) ||
          (j.description ?? "").toLowerCase().includes(q) ||
          (j.location ?? "").toLowerCase().includes(q)
        );
      })
    : jobs;

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
                {jobs.length} application{jobs.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search bar */}
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search jobs… (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-48 lg:w-64 pl-8 text-sm bg-muted/50 border-border"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <nav className="hidden sm:flex items-center rounded-lg border border-border bg-muted p-0.5 mr-1">
              {([
                { key: "board" as View, icon: Columns3, label: "Board" },
                { key: "list" as View, icon: List, label: "List" },
                { key: "dashboard" as View, icon: LayoutDashboard, label: "Dashboard" },
                { key: "calendar" as View, icon: CalendarDays, label: "Calendar" },
              ]).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    view === key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </nav>

            {/* Mobile view switcher */}
            <div className="flex sm:hidden items-center rounded-lg border border-border bg-muted p-0.5 mr-1">
              {([
                { key: "board" as View, icon: Columns3 },
                { key: "list" as View, icon: List },
                { key: "dashboard" as View, icon: LayoutDashboard },
                { key: "calendar" as View, icon: CalendarDays },
              ]).map(({ key, icon: Icon }) => (
                <button key={key} onClick={() => setView(key)} className={`p-1.5 rounded-md ${view === key ? "bg-background shadow-sm" : ""}`}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex" onClick={exportToCSV} disabled={jobs.length === 0}>
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
            <AddJobDialog onAdd={addJob} jobs={jobs} />
            <UserMenu />
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="mt-3 md:hidden relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search jobs…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-8 text-sm bg-muted/50 border-border"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
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
        <KanbanBoard jobs={searchQuery ? filteredJobs : jobs} setJobs={setJobs} onUpdateJob={updateJob} onDeleteJob={deleteJob} />
      ) : view === "list" ? (
        <ListView jobs={jobs} onSelectJob={handleSelectJob} searchQuery={searchQuery} />
      ) : view === "dashboard" ? (
        <Dashboard jobs={filteredJobs} onUpdateJob={updateJob} />
      ) : (
        <CalendarView jobs={filteredJobs} onSelectJob={handleSelectJob} />
      )}

      {/* Detail panel for calendar/list + AI trigger */}
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
