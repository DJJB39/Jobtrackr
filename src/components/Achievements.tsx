import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Target, Flame, Star, Rocket, Medal, Crown, Zap } from "lucide-react";
import type { JobApplication } from "@/types/job";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Achievement {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  check: (jobs: JobApplication[]) => boolean;
  color: string;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_app",
    icon: Target,
    label: "First Step",
    description: "Added your first application",
    check: (jobs) => jobs.length >= 1,
    color: "hsl(var(--status-found))",
  },
  {
    id: "five_apps",
    icon: Flame,
    label: "Getting Started",
    description: "Tracked 5 applications",
    check: (jobs) => jobs.length >= 5,
    color: "hsl(var(--status-applied))",
  },
  {
    id: "ten_apps",
    icon: Zap,
    label: "On a Roll",
    description: "Tracked 10 applications",
    check: (jobs) => jobs.length >= 10,
    color: "hsl(var(--status-phone))",
  },
  {
    id: "twenty_five",
    icon: Rocket,
    label: "Power User",
    description: "Tracked 25 applications",
    check: (jobs) => jobs.length >= 25,
    color: "hsl(var(--status-interview2))",
  },
  {
    id: "first_interview",
    icon: Star,
    label: "Interview Time",
    description: "Reached interview stage",
    check: (jobs) => jobs.some((j) => ["phone", "interview2", "final"].includes(j.columnId)),
    color: "hsl(var(--status-interview2))",
  },
  {
    id: "first_offer",
    icon: Medal,
    label: "Offer Received",
    description: "Got your first offer!",
    check: (jobs) => jobs.some((j) => j.columnId === "offer" || j.columnId === "accepted"),
    color: "hsl(var(--status-offer))",
  },
  {
    id: "accepted",
    icon: Crown,
    label: "Mission Complete",
    description: "Accepted an offer 🎉",
    check: (jobs) => jobs.some((j) => j.columnId === "accepted"),
    color: "hsl(var(--status-accepted))",
  },
  {
    id: "fifty_apps",
    icon: Trophy,
    label: "Job Hunt Hero",
    description: "Tracked 50 applications",
    check: (jobs) => jobs.length >= 50,
    color: "hsl(var(--primary))",
  },
];

const Achievements = ({ jobs }: { jobs: JobApplication[] }) => {
  const earned = useMemo(
    () => ACHIEVEMENTS.map((a) => ({ ...a, unlocked: a.check(jobs) })),
    [jobs]
  );

  const unlockedCount = earned.filter((a) => a.unlocked).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Achievements</h3>
        <span className="text-[10px] font-mono text-muted-foreground">
          {unlockedCount}/{ACHIEVEMENTS.length}
        </span>
      </div>
      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-4 gap-2">
          {earned.map((a, i) => (
            <Tooltip key={a.id}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all ${
                    a.unlocked
                      ? "border-border bg-card/80 shadow-sm"
                      : "border-border/30 bg-card/20 opacity-40 grayscale"
                  }`}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: a.unlocked ? a.color + "20" : undefined,
                      color: a.unlocked ? a.color : undefined,
                    }}
                  >
                    <a.icon className="h-4 w-4" />
                  </div>
                  <span className="text-[9px] font-medium text-foreground text-center leading-tight">
                    {a.label}
                  </span>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-medium">{a.label}</p>
                <p className="text-muted-foreground">{a.description}</p>
                {!a.unlocked && <p className="text-primary mt-0.5">🔒 Locked</p>}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
};

export default Achievements;
