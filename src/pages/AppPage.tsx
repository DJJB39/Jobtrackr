import { useState } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import Dashboard from "@/components/Dashboard";
import AddJobDialog from "@/components/AddJobDialog";
import UserMenu from "@/components/UserMenu";
import { Briefcase, LayoutDashboard, Columns3, Loader2, Download } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { Button } from "@/components/ui/button";
import { COLUMNS } from "@/types/job";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type View = "board" | "dashboard";

const AppPage = () => {
  const { jobs, setJobs, loading, addJob, updateJob, deleteJob } = useJobs();
  const [view, setView] = useState<View>("board");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const exportToCSV = () => {
    const stageMap = Object.fromEntries(COLUMNS.map((c) => [c.id, c.title]));
    const headers = ["Company", "Role", "Stage", "Type", "Created", "Location", "Notes", "Description", "Links"];
    const rows = jobs.map((j) => [
      j.company,
      j.role,
      stageMap[j.columnId] ?? j.columnId,
      j.applicationType,
      j.createdAt,
      j.location ?? "",
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border px-6 py-4">
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
            <nav className="flex items-center rounded-lg border border-border bg-muted p-0.5 mr-3">
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
            </nav>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportToCSV} disabled={jobs.length === 0}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <AddJobDialog onAdd={addJob} />
            <UserMenu />
          </div>
        </div>
      </header>

      {jobs.length === 0 ? (
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
          <AddJobDialog onAdd={addJob} open={dialogOpen} onOpenChange={setDialogOpen} />
        </div>
      ) : view === "board" ? (
        <KanbanBoard jobs={jobs} setJobs={setJobs} onUpdateJob={updateJob} onDeleteJob={deleteJob} />
      ) : (
        <Dashboard jobs={jobs} />
      )}
    </div>
  );
};

export default AppPage;
