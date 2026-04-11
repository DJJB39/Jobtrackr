import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import KanbanBoard from "@/components/KanbanBoard";
import Dashboard from "@/components/Dashboard";
import ListView from "@/components/ListView";
import AddJobDialog from "@/components/AddJobDialog";
import { Briefcase } from "lucide-react";
import AIStudioView from "@/components/AIStudioView";
import CalendarView from "@/components/CalendarView";
import JobDetailPanel from "@/components/JobDetailPanel";
import AIAssistPanel from "@/components/AIAssistPanel";
import InterviewCoach from "@/components/InterviewCoach";
import DayBeforeBootcamp from "@/components/DayBeforeBootcamp";
import CVTailorModal from "@/components/CVTailorModal";
import ScreenshotCaptureModal from "@/components/ScreenshotCaptureModal";
import CSVImportModal from "@/components/CSVImportModal";
import CommandPalette from "@/components/CommandPalette";
import DemoCVView from "@/components/DemoCVView";
import AppHeader from "@/components/layout/AppHeader";
import type { View } from "@/components/layout/AppHeader";
import { useGuestMode } from "@/hooks/useGuestMode";
import type { JobApplication, ColumnId } from "@/types/job";
import type { BootcampData } from "@/hooks/useBootcamp";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";


const DemoPage = () => {
  const { jobs, setJobs, addJob: rawAddJob, updateJob: rawUpdateJob, deleteJob: rawDeleteJob } = useGuestMode();
  const [view, setView] = useState<View>("board");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [bootcampOpen, setBootcampOpen] = useState(false);
  const [tailorOpen, setTailorOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [screenshotOpen, setScreenshotOpen] = useState(false);
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
  }, [rawUpdateJob]);

  const deleteJob = useCallback((id: string) => {
    rawDeleteJob(id);
    demoToast();
  }, [rawDeleteJob, demoToast]);

  const handleSelectJob = useCallback((job: JobApplication) => {
    setSelectedJob(job);
    setPanelOpen(true);
  }, []);

  const filteredJobs = useMemo(() => {
    if (!searchQuery) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter((j) =>
      j.company.toLowerCase().includes(q) ||
      j.role.toLowerCase().includes(q) ||
      (j.notes ?? "").toLowerCase().includes(q) ||
      (j.description ?? "").toLowerCase().includes(q) ||
      (j.location ?? "").toLowerCase().includes(q)
    );
  }, [jobs, searchQuery]);

  const [searchPulse, setSearchPulse] = useState(false);
  useEffect(() => {
    if (!sessionStorage.getItem("demo-search-seen")) {
      setSearchPulse(true);
      const timer = setTimeout(() => {
        setSearchPulse(false);
        sessionStorage.setItem("demo-search-seen", "1");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const exportToCSV = useCallback(() => {
    const stageMap: Record<string, string> = { found: "Found", applied: "Applied", phone: "Phone Screen", interview1: "Interview 1", interview2: "Interview 2", offer: "Offer", rejected: "Rejected", withdrawn: "Withdrawn" };
    const headers = ["Company", "Role", "Stage", "Type", "Created", "Location", "Salary", "Notes", "Links"];
    const rows = jobs.map((j) => [
      j.company, j.role, stageMap[j.columnId] ?? j.columnId, j.applicationType, j.createdAt,
      j.location ?? "", j.salary ?? "", (j.notes ?? "").slice(0, 100).replace(/"/g, '""'),
      (j.links ?? []).join("; "),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jobtrackr-demo-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported", description: `${jobs.length} application(s) exported` });
  }, [jobs, toast]);

  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[hsl(var(--gradient-start))] via-background to-[hsl(var(--gradient-end))] mesh-gradient relative">
      <AppHeader
        jobs={jobs}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        view={view}
        setView={setView}
        searchPulse={searchPulse}
        isMac={isMac}
        onImport={() => setImportOpen(true)}
        onScreenshot={() => setScreenshotOpen(true)}
        onExport={exportToCSV}
        onAddJob={addJob}
        isDemo
      />

      {/* Content */}
      <AnimatePresence mode="wait">
        {jobs.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-10 w-10 text-primary/60" />
              </div>
              <motion.div className="absolute -inset-2 rounded-3xl border border-primary/20" animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-display text-foreground">Start exploring</h2>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">Add a job to see how JobTrackr works.</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2 shadow-glow">
              <Briefcase className="h-4 w-4" />Add Your First Application
            </Button>
            <AddJobDialog onAdd={addJob} open={dialogOpen} onOpenChange={setDialogOpen} jobs={jobs} />
          </motion.div>
        ) : view === "board" ? (
          <KanbanBoard key="board" jobs={searchQuery ? filteredJobs : jobs} setJobs={setJobs} onUpdateJob={updateJob} onDeleteJob={deleteJob} onSwitchView={(v) => setView(v as View)} />
        ) : view === "list" ? (
          <ListView key="list" jobs={jobs} onSelectJob={handleSelectJob} searchQuery={searchQuery} />
        ) : view === "dashboard" ? (
          <Dashboard key="dashboard" jobs={filteredJobs} onUpdateJob={updateJob} />
        ) : view === "cv" ? (
          <DemoCVView key="cv" jobs={jobs} />
        ) : (
          <CalendarView key="calendar" jobs={filteredJobs} onSelectJob={handleSelectJob} />
        )}
      </AnimatePresence>

      {/* Panels & Modals */}
      <JobDetailPanel
        job={selectedJob}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onSave={(updated) => { updateJob(updated); setSelectedJob(updated); }}
        onOpenAI={() => setAiPanelOpen(true)}
        onOpenCoach={() => setCoachOpen(true)}
        onOpenBootcamp={() => setBootcampOpen(true)}
        onOpenTailor={() => setTailorOpen(true)}
      />
      {selectedJob && <AIAssistPanel job={selectedJob} open={aiPanelOpen} onOpenChange={setAiPanelOpen} />}
      {selectedJob && <InterviewCoach job={selectedJob} open={coachOpen} onOpenChange={setCoachOpen} />}
      {selectedJob && <DayBeforeBootcamp job={selectedJob} open={bootcampOpen} onOpenChange={setBootcampOpen} onStartRoast={(bootcampData: BootcampData) => { setBootcampOpen(false); setCoachOpen(true); }} />}
      {selectedJob && <CVTailorModal job={selectedJob} open={tailorOpen} onOpenChange={setTailorOpen} onStartRoast={() => { setTailorOpen(false); setCoachOpen(true); }} />}
      <CSVImportModal open={importOpen} onOpenChange={setImportOpen} onImportComplete={() => demoToast()} />
      <ScreenshotCaptureModal open={screenshotOpen} onOpenChange={setScreenshotOpen} onJobSaved={() => demoToast()} />
      <CommandPalette jobs={jobs} onSelectJob={handleSelectJob} onSwitchView={setView} onAddJob={() => setDialogOpen(true)} onExport={exportToCSV} />
    </div>
  );
};

export default DemoPage;
