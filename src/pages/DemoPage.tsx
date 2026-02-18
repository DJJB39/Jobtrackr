import { useState, useCallback } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import Dashboard from "@/components/Dashboard";
import ListView from "@/components/ListView";
import AddJobDialog from "@/components/AddJobDialog";
import { Briefcase, LayoutDashboard, Columns3, CalendarDays, X, List, Search, ArrowLeft, FileUp } from "lucide-react";
import CalendarView from "@/components/CalendarView";
import JobDetailPanel from "@/components/JobDetailPanel";
import CommandPalette from "@/components/CommandPalette";
import { useGuestMode } from "@/hooks/useGuestMode";
import DemoCVView from "@/components/DemoCVView";
import type { JobApplication } from "@/types/job";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type View = "board" | "dashboard" | "calendar" | "list" | "cv";

const DemoPage = () => {
  const { jobs, setJobs, addJob: rawAddJob, updateJob: rawUpdateJob, deleteJob: rawDeleteJob } = useGuestMode();
  const [view, setView] = useState<View>("board");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const demoToast = useCallback(() => {
    toast({ title: "Demo mode", description: "Nothing saved. Sign up to keep your data." });
  }, [toast]);

  const addJob = useCallback((...args: Parameters<typeof rawAddJob>) => {
    rawAddJob(...args);
    demoToast();
  }, [rawAddJob, demoToast]);

  const updateJob = useCallback((updated: JobApplication) => {
    rawUpdateJob(updated);
    demoToast();
  }, [rawUpdateJob, demoToast]);

  const deleteJob = useCallback((id: string) => {
    rawDeleteJob(id);
    demoToast();
  }, [rawDeleteJob, demoToast]);

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

  const VIEW_ITEMS: { key: View; icon: typeof Columns3; label: string; tourAttr?: string }[] = [
    { key: "board", icon: Columns3, label: "Board" },
    { key: "list", icon: List, label: "List" },
    { key: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { key: "calendar", icon: CalendarDays, label: "Calendar" },
    { key: "cv", icon: FileUp, label: "CV", tourAttr: "cv-tab" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[hsl(var(--gradient-start))] via-background to-[hsl(var(--gradient-end))]">
      {/* Demo banner */}
      <div className="flex items-center gap-3 bg-primary/10 border-b border-primary/20 px-6 py-2">
        <Badge variant="outline" className="text-xs border-primary/40 text-primary">Demo Mode</Badge>
        <span className="text-xs text-muted-foreground">Explore freely — nothing is saved.</span>
        <Button variant="default" size="sm" className="ml-auto h-7 text-xs gap-1.5" asChild>
          <Link to="/auth?tab=signup">Sign Up to Save Your Data</Link>
        </Button>
      </div>

      <header className="border-b border-border px-4 sm:px-6 py-4 backdrop-blur-sm bg-background/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
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
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search jobs…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-48 lg:w-64 pl-8 text-sm bg-muted/50 border-border"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <nav className="hidden sm:flex items-center rounded-lg border border-border bg-muted p-0.5 mr-1" data-tour="view-switcher">
              {VIEW_ITEMS.map(({ key, icon: Icon, label, tourAttr }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  data-tour={tourAttr}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    view === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </nav>

            <div className="flex sm:hidden items-center rounded-lg border border-border bg-muted p-0.5 mr-1">
              {VIEW_ITEMS.map(({ key, icon: Icon, tourAttr }) => (
                <button key={key} onClick={() => setView(key)} data-tour={tourAttr} className={`p-1.5 rounded-md ${view === key ? "bg-background shadow-sm" : ""}`}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            <AddJobDialog onAdd={addJob} jobs={jobs} />
          </div>
        </div>
      </header>

      {view === "board" ? (
        <KanbanBoard jobs={searchQuery ? filteredJobs : jobs} setJobs={setJobs} onUpdateJob={updateJob} onDeleteJob={deleteJob} />
      ) : view === "list" ? (
        <ListView jobs={jobs} onSelectJob={handleSelectJob} searchQuery={searchQuery} />
      ) : view === "dashboard" ? (
        <Dashboard jobs={filteredJobs} onUpdateJob={updateJob} />
      ) : view === "cv" ? (
        <DemoCVView jobs={jobs} />
      ) : (
        <CalendarView jobs={filteredJobs} onSelectJob={handleSelectJob} />
      )}

      <JobDetailPanel
        job={selectedJob}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onSave={(updated) => { updateJob(updated); setSelectedJob(updated); }}
      />

      <CommandPalette
        jobs={jobs}
        onSelectJob={handleSelectJob}
        onSwitchView={setView}
        onAddJob={() => setDialogOpen(true)}
        onExport={() => {}}
      />
    </div>
  );
};

export default DemoPage;
