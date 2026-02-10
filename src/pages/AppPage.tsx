import { useState } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import Dashboard from "@/components/Dashboard";
import AddJobDialog from "@/components/AddJobDialog";
import UserMenu from "@/components/UserMenu";
import { Briefcase, LayoutDashboard, Columns3, Loader2 } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";

type View = "board" | "dashboard";

const AppPage = () => {
  const { jobs, setJobs, loading, addJob, updateJob, deleteJob } = useJobs();
  const [view, setView] = useState<View>("board");

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
            <AddJobDialog onAdd={addJob} />
            <UserMenu />
          </div>
        </div>
      </header>

      {view === "board" ? (
        <KanbanBoard jobs={jobs} setJobs={setJobs} onUpdateJob={updateJob} onDeleteJob={deleteJob} />
      ) : (
        <Dashboard jobs={jobs} />
      )}
    </div>
  );
};

export default AppPage;
