import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import KanbanBoard from "@/components/KanbanBoard";
import Dashboard from "@/components/Dashboard";
import ListView from "@/components/ListView";
import AddJobDialog from "@/components/AddJobDialog";
import { Briefcase, X } from "lucide-react";
import CalendarView from "@/components/CalendarView";
import CVView from "@/components/CVView";
import JobDetailPanel from "@/components/JobDetailPanel";
import AIAssistPanel from "@/components/AIAssistPanel";
import InterviewCoach from "@/components/InterviewCoach";
import DayBeforeBootcamp from "@/components/DayBeforeBootcamp";
import CVTailorModal from "@/components/CVTailorModal";
import ScreenshotCaptureModal from "@/components/ScreenshotCaptureModal";
import type { BootcampData } from "@/hooks/useBootcamp";
import CSVImportModal from "@/components/CSVImportModal";
import CommandPalette from "@/components/CommandPalette";
import OnboardingTour from "@/components/OnboardingTour";
import AppHeader from "@/components/layout/AppHeader";
import type { View } from "@/components/layout/AppHeader";
import { useJobStore } from "@/stores/jobStore";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useOnboardingTour } from "@/hooks/useOnboardingTour";
import type { JobApplication, ColumnId } from "@/types/job";
import { useLoginReminders } from "@/hooks/useLoginReminders";
import { Button } from "@/components/ui/button";
import { useStages } from "@/hooks/useStages";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import AIStudioView from "@/components/AIStudioView";
import { Camera, Flame, Upload } from "lucide-react";

const AppPage = () => {
  const { user } = useAuth();
  const { stages } = useStages();
  const { jobs, loading, searchQuery, setSearchQuery, fetchJobs, addJob, updateJob, deleteJob, setJobs } = useJobStore();
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
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchJobs(user.id);
  }, [user, fetchJobs]);

  useLoginReminders(jobs);

  const handleAddJob = useCallback(
    async (company: string, role: string, columnId: ColumnId, applicationType?: string, extras?: {
      location?: string; description?: string; links?: string[]; salary?: string; closeDate?: string;
    }) => {
      if (!user) return;
      const result = await addJob(user.id, company, role, columnId, applicationType, extras);
      if (result) {
        toast({ title: "Application added", description: `${company} — ${role} has been added` });
      } else {
        toast({ title: "Error adding job", variant: "destructive" });
      }
    },
    [user, addJob, toast]
  );

  const handleUpdateJob = useCallback(
    async (job: JobApplication) => { await updateJob(job, user?.id); },
    [updateJob, user]
  );

  const handleDeleteJob = useCallback(
    async (id: string) => {
      const jobToDelete = jobs.find((j) => j.id === id);
      const { undoFn } = await deleteJob(id);
      toast({
        title: "Application deleted",
        description: jobToDelete ? `${jobToDelete.company} — ${jobToDelete.role}` : undefined,
        action: undoFn ? (
          <Button variant="outline" size="sm" onClick={() => { undoFn(); toast({ title: "Undo successful", description: "Application restored" }); }}>
            Undo
          </Button>
        ) : undefined,
      });
    },
    [jobs, deleteJob, toast]
  );

  const { showBanner, dismissBanner, tourReady } = useOnboarding({ jobCount: jobs.length, loading, addJob: handleAddJob });
  const tour = useOnboardingTour({ tourReady });

  const [searchPulse, setSearchPulse] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("jobtrackr-search-seen")) {
      setSearchPulse(true);
      const timer = setTimeout(() => { setSearchPulse(false); localStorage.setItem("jobtrackr-search-seen", "1"); }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSelectJob = useCallback((job: JobApplication) => { setSelectedJob(job); setPanelOpen(true); }, []);

  const filteredJobs = useMemo(() => {
    if (!searchQuery) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter((j) =>
      j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q) ||
      (j.notes ?? "").toLowerCase().includes(q) || (j.description ?? "").toLowerCase().includes(q) ||
      (j.location ?? "").toLowerCase().includes(q)
    );
  }, [jobs, searchQuery]);

  const exportToCSV = useCallback(() => {
    const stageMap = Object.fromEntries(stages.map((c) => [c.id, c.title]));
    const headers = ["Company", "Role", "Stage", "Type", "Created", "Location", "Salary", "Deadline", "Events", "Notes", "Description", "Links"];
    const rows = jobs.map((j) => [
      j.company, j.role, stageMap[j.columnId] ?? j.columnId, j.applicationType, j.createdAt,
      j.location ?? "", j.salary ?? "", j.closeDate ?? "", String((j.events ?? []).length),
      (j.notes ?? "").slice(0, 100).replace(/"/g, '""'), (j.description ?? "").slice(0, 100).replace(/"/g, '""'),
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
  }, [jobs, stages, toast]);

  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <motion.div className="absolute inset-0 rounded-xl border-2 border-primary/40" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading your pipeline…</p>
        </motion.div>
      </div>
    );
  }

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
        onAddJob={handleAddJob}
      />

      {/* Onboarding banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-3 bg-primary/10 border-b border-primary/20 px-6 py-2.5">
              <span className="text-sm text-foreground">👋 We added sample jobs to help you explore. Delete them anytime!</span>
              <Button variant="ghost" size="sm" onClick={dismissBanner} className="ml-auto h-7"><X className="h-3.5 w-3.5" /></Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {jobs.length === 0 && !showBanner ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center"><Briefcase className="h-10 w-10 text-primary/60" /></div>
            <motion.div className="absolute -inset-2 rounded-3xl border border-primary/20" animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-display text-foreground">Welcome to JobTrackr</h2>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">Start by adding a job, or explore what AI can do for your career</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2 shadow-glow"><Briefcase className="h-4 w-4" />Add Your First Application</Button>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setScreenshotOpen(true)} className="flex flex-col items-center gap-1.5 rounded-xl border border-border glass p-3 w-28 hover:border-border/80 transition-all glow-hover">
              <Camera className="h-5 w-5 text-purple-500" />
              <span className="text-[11px] text-muted-foreground text-center leading-tight">Screenshot a job listing</span>
            </button>
            <button onClick={() => setView("cv")} className="flex flex-col items-center gap-1.5 rounded-xl border border-border glass p-3 w-28 hover:border-border/80 transition-all glow-hover">
              <Flame className="h-5 w-5 text-amber-500" />
              <span className="text-[11px] text-muted-foreground text-center leading-tight">Roast your CV first</span>
            </button>
            <button onClick={() => setImportOpen(true)} className="flex flex-col items-center gap-1.5 rounded-xl border border-border glass p-3 w-28 hover:border-border/80 transition-all glow-hover">
              <Upload className="h-5 w-5 text-primary" />
              <span className="text-[11px] text-muted-foreground text-center leading-tight">Import from CSV</span>
            </button>
          </div>
          <AddJobDialog onAdd={handleAddJob} open={dialogOpen} onOpenChange={setDialogOpen} jobs={jobs} />
        </motion.div>
      ) : view === "ai" ? (
        <AIStudioView
          jobs={filteredJobs}
          onOpenCoach={(job) => { setSelectedJob(job); setCoachOpen(true); }}
          onOpenBootcamp={(job) => { setSelectedJob(job); setBootcampOpen(true); }}
          onOpenTailor={(job) => { setSelectedJob(job); setTailorOpen(true); }}
          onOpenAI={(job) => { setSelectedJob(job); setAiPanelOpen(true); }}
          onOpenScreenshot={() => setScreenshotOpen(true)}
          onSwitchToCV={() => setView("cv")}
        />
      ) : view === "board" ? (
        <KanbanBoard jobs={searchQuery ? filteredJobs : jobs} setJobs={setJobs} onUpdateJob={handleUpdateJob} onDeleteJob={handleDeleteJob} onSwitchView={(v) => setView(v as View)} />
      ) : view === "list" ? (
        <ListView jobs={jobs} onSelectJob={handleSelectJob} searchQuery={searchQuery} />
      ) : view === "dashboard" ? (
        <Dashboard jobs={filteredJobs} onUpdateJob={handleUpdateJob} onFilterByStage={(stageId) => { const col = stages.find((c) => c.id === stageId); if (col) { setSearchQuery(col.title); setView("list"); } }} />
      ) : view === "cv" ? (
        <CVView jobs={filteredJobs} onSelectJob={handleSelectJob} />
      ) : (
        <CalendarView jobs={filteredJobs} onSelectJob={handleSelectJob} />
      )}

      {/* Panels & Modals */}
      <JobDetailPanel job={selectedJob} open={panelOpen} onOpenChange={setPanelOpen} onSave={handleUpdateJob} onOpenAI={() => setAiPanelOpen(true)} onOpenCoach={() => setCoachOpen(true)} onOpenBootcamp={() => setBootcampOpen(true)} onOpenTailor={() => setTailorOpen(true)} />
      {selectedJob && <AIAssistPanel job={selectedJob} open={aiPanelOpen} onOpenChange={setAiPanelOpen} />}
      {selectedJob && <InterviewCoach job={selectedJob} open={coachOpen} onOpenChange={setCoachOpen} />}
      {selectedJob && <DayBeforeBootcamp job={selectedJob} open={bootcampOpen} onOpenChange={setBootcampOpen} onStartRoast={(bootcampData: BootcampData) => { setBootcampOpen(false); setCoachOpen(true); }} />}
      {selectedJob && <CVTailorModal job={selectedJob} open={tailorOpen} onOpenChange={setTailorOpen} onStartRoast={() => { setTailorOpen(false); setCoachOpen(true); }} />}
      <CSVImportModal open={importOpen} onOpenChange={setImportOpen} onImportComplete={() => { if (user) fetchJobs(user.id); }} />
      <ScreenshotCaptureModal open={screenshotOpen} onOpenChange={setScreenshotOpen} onJobSaved={() => { if (user) fetchJobs(user.id); }} />
      <CommandPalette jobs={jobs} onSelectJob={handleSelectJob} onSwitchView={setView} onAddJob={() => setDialogOpen(true)} onExport={exportToCSV} />
      <OnboardingTour active={tour.active} step={tour.step} currentStep={tour.currentStep} totalSteps={tour.totalSteps} onAdvance={tour.advance} onSkip={tour.skip} />
    </div>
  );
};

export default AppPage;
