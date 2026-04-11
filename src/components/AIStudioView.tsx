import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, Flame, FileText, Sparkles, CalendarCheck, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAIPreferences } from "@/hooks/useAIPreferences";
import type { JobApplication } from "@/types/job";

interface AIStudioViewProps {
  jobs: JobApplication[];
  onOpenCoach: (job: JobApplication) => void;
  onOpenBootcamp: (job: JobApplication) => void;
  onOpenTailor: (job: JobApplication) => void;
  onOpenAI: (job: JobApplication) => void;
  onOpenScreenshot: () => void;
  onSwitchToCV: () => void;
}

const TOOLS = [
  { id: "coach", icon: Mic, accent: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", title: "Interview Coach", desc: "Practice with AI that asks real questions and scores your answers", btn: "Start Practice", needsJob: true },
  { id: "roast", icon: Flame, accent: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", title: "CV Roast", desc: "Get your CV reviewed — from gentle feedback to nuclear destruction", btn: "Roast My CV", needsJob: false },
  { id: "tailor", icon: FileText, accent: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", title: "Tailor CV to Job", desc: "One-click CV tailoring with before-and-after scoring", btn: "Tailor Now", needsJob: true },
  { id: "cover", icon: Sparkles, accent: "text-primary", bg: "bg-primary/10", border: "border-primary/20", title: "Cover Letter", desc: "Generate a role-specific cover letter in seconds", btn: "Generate", needsJob: true },
  { id: "bootcamp", icon: CalendarCheck, accent: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", title: "Interview Bootcamp", desc: "Got an interview tomorrow? Get a full prep plan", btn: "Start Bootcamp", needsJob: true },
  { id: "screenshot", icon: Camera, accent: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", title: "Screenshot Capture", desc: "Upload a photo of any job listing — AI extracts the details", btn: "Upload Screenshot", needsJob: false },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

const AIStudioView = ({ jobs, onOpenCoach, onOpenBootcamp, onOpenTailor, onOpenAI, onOpenScreenshot, onSwitchToCV }: AIStudioViewProps) => {
  const { usageCount, usageLimit } = useAIPreferences();
  const [selectedJobs, setSelectedJobs] = useState<Record<string, string>>({});

  const handleAction = (toolId: ToolId) => {
    if (toolId === "roast") { onSwitchToCV(); return; }
    if (toolId === "screenshot") { onOpenScreenshot(); return; }
    const job = jobs.find((j) => j.id === selectedJobs[toolId]);
    if (!job) return;
    if (toolId === "coach") onOpenCoach(job);
    else if (toolId === "tailor") onOpenTailor(job);
    else if (toolId === "cover") onOpenAI(job);
    else if (toolId === "bootcamp") onOpenBootcamp(job);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-display text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Studio
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Your career toolkit — powered by AI</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <div key={tool.id} className="rounded-xl border border-border glass p-5 glow-hover flex flex-col gap-3">
                <div className={`h-10 w-10 rounded-lg ${tool.bg} ${tool.border} border flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${tool.accent}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{tool.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tool.desc}</p>
                </div>
                {tool.needsJob && (
                  <Select value={selectedJobs[tool.id] ?? ""} onValueChange={(v) => setSelectedJobs((p) => ({ ...p, [tool.id]: v }))}>
                    <SelectTrigger className="h-8 text-xs bg-secondary/50 border-border/50">
                      <SelectValue placeholder="Select a job…" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map((j) => (
                        <SelectItem key={j.id} value={j.id} className="text-xs">
                          {j.company} — {j.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-auto text-xs"
                  disabled={tool.needsJob && !selectedJobs[tool.id]}
                  onClick={() => handleAction(tool.id)}
                >
                  {tool.btn}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Usage indicator */}
        <div className="mt-8 rounded-xl border border-border glass p-5 max-w-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">AI Usage This Month</span>
            <span className="text-xs text-muted-foreground font-mono">{usageCount} / {usageLimit}</span>
          </div>
          <Progress value={(usageCount / usageLimit) * 100} className="h-2" />
          <p className="text-[11px] text-muted-foreground mt-2">
            {usageCount >= usageLimit
              ? "Monthly limit reached — resets next month"
              : `${usageLimit - usageCount} generation${usageLimit - usageCount !== 1 ? "s" : ""} remaining`}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AIStudioView;
