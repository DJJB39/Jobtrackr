import { useState, useCallback } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import Dashboard from "@/components/Dashboard";
import AddJobDialog from "@/components/AddJobDialog";
import { Briefcase, LayoutDashboard, Columns3 } from "lucide-react";
import type { JobApplication, ColumnId } from "@/types/job";

const defaultFields = { notes: "", contacts: [] as JobApplication["contacts"], nextSteps: [] as JobApplication["nextSteps"], links: [] as string[] };

const SAMPLE_JOBS: JobApplication[] = [
  { id: "1", company: "Stripe", role: "Senior Frontend Engineer", columnId: "applied", createdAt: new Date().toISOString(), ...defaultFields },
  { id: "2", company: "Vercel", role: "Full Stack Developer", columnId: "found", createdAt: new Date().toISOString(), ...defaultFields },
  { id: "3", company: "Linear", role: "Product Engineer", columnId: "phone", createdAt: new Date().toISOString(), ...defaultFields },
  { id: "4", company: "Figma", role: "Design Engineer", columnId: "found", createdAt: new Date().toISOString(), ...defaultFields },
  { id: "5", company: "Notion", role: "Software Engineer", columnId: "interview2", createdAt: new Date().toISOString(), ...defaultFields },
];

type View = "board" | "dashboard";

const Index = () => {
  const [jobs, setJobs] = useState<JobApplication[]>(SAMPLE_JOBS);
  const [view, setView] = useState<View>("board");

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
              <h1 className="text-lg font-bold tracking-tight text-foreground">JobTrackr</h1>
              <p className="text-xs text-muted-foreground font-mono">
                {jobs.length} application{jobs.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Nav tabs */}
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
          </div>
        </div>
      </header>

      {/* Content */}
      {view === "board" ? (
        <KanbanBoard jobs={jobs} setJobs={setJobs} />
      ) : (
        <Dashboard jobs={jobs} />
      )}
    </div>
  );
};

export default Index;
