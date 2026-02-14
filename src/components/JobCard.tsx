import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import type { JobApplication, ColumnId } from "@/types/job";
import {
  Trash2,
  ExternalLink,
  CalendarPlus,
} from "lucide-react";
import { differenceInDays, parseISO, startOfDay, isBefore } from "date-fns";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSalaryColorFromParsed } from "@/lib/salary";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const getCompanyLogoUrl = (job: JobApplication): string => {
  if (job.links?.[0]) {
    try {
      const domain = new URL(job.links[0]).hostname.replace("www.", "");
      return `https://logo.clearbit.com/${domain}`;
    } catch {
      /* fall through */
    }
  }
  const guess = job.company.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
  return `https://logo.clearbit.com/${guess}`;
};

const formatSalary = (salary: string): string => {
  return salary.length > 12 ? salary.slice(0, 12) + "…" : salary;
};

const INITIAL_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-orange-500", "bg-pink-500",
];

const getInitialColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length];
};

interface JobCardProps {
  job: JobApplication;
  onDelete: (id: string) => void;
  onClick?: (job: JobApplication) => void;
  onSchedule?: (job: JobApplication) => void;
  columnId?: ColumnId;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  selectMode?: boolean;
  compact?: boolean;
}

const JobCard = ({ job, onDelete, onClick, onSchedule, columnId, selected, onToggleSelect, selectMode, compact }: JobCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    data: { type: "job", job },
  });
  const [logoError, setLogoError] = useState(false);
  const { user } = useAuth();
  const [cvScore, setCvScore] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(`cv-results-${user.id}`);
      if (raw) {
        const results = JSON.parse(raw);
        if (results[job.id]?.score != null) setCvScore(results[job.id].score);
      }
    } catch { /* ignore */ }
  }, [user, job.id]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasUpcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    return (job.events ?? []).some((e) => {
      try { return !isBefore(parseISO(e.date), today); } catch { return false; }
    });
  }, [job.events]);

  const deadlineSoon = useMemo(() => {
    if (!job.closeDate) return false;
    try { return differenceInDays(parseISO(job.closeDate), new Date()) < 7; } catch { return false; }
  }, [job.closeDate]);

  const logoUrl = useMemo(() => getCompanyLogoUrl(job), [job.company, job.links]);

  const logoSize = compact ? "h-6 w-6" : "h-8 w-8";

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => {
        if (selectMode && onToggleSelect) {
          onToggleSelect(job.id);
        } else {
          onClick?.(job);
        }
      }}
      className={`group relative cursor-grab active:cursor-grabbing rounded-xl ${compact ? "p-2" : "p-3"} shadow-sm transition-all duration-200 glow-hover
        ${isDragging ? "shadow-glow-lg scale-105 z-50 opacity-90" : "hover:shadow-glow"}
        ${selected
          ? "border-primary/60 ring-1 ring-primary/30 bg-primary/5 glass-card"
          : "glass-card hover:bg-[hsl(var(--card-hover))] hover:border-border/60"
        }
      `}
    >
      {/* Selection checkbox */}
      {selectMode && (
        <div
          className="absolute top-2 left-2 z-10"
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(job.id); }}
        >
          <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
            selected ? "bg-primary border-primary scale-110" : "border-muted-foreground/40 bg-card"
          }`}>
            {selected && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
          </div>
        </div>
      )}

      {/* Row 1: Logo + Company + Salary */}
      <div className="flex items-center gap-2.5">
        <div className={`${logoSize} shrink-0 rounded-lg overflow-hidden flex items-center justify-center ring-1 ring-border/30 ${logoError ? getInitialColor(job.company) : "bg-muted/50"}`}>
          {!logoError ? (
            <img
              src={logoUrl}
              alt=""
              className="h-full w-full object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className={`${compact ? "text-[9px]" : "text-xs"} font-bold text-white`}>{job.company[0]?.toUpperCase()}</span>
          )}
        </div>
        <span className="font-semibold text-sm text-card-foreground truncate flex-1">{job.company}</span>
        {cvScore !== null && (
          <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-bold font-mono ${
            cvScore >= 75 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" :
            cvScore >= 50 ? "bg-amber-500/20 text-amber-400 border-amber-500/20" :
            "bg-rose-500/20 text-rose-400 border-rose-500/20"
          }`} title={`CV Match: ${cvScore}%`}>
            {cvScore}%
          </span>
        )}
        {job.salary && (
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold font-mono ${getSalaryColorFromParsed(job.salary)}`}>
            {formatSalary(job.salary)}
          </span>
        )}
      </div>

      {/* Row 2: Role */}
      <p className={`mt-1.5 text-xs text-muted-foreground truncate ${compact ? "pl-[34px]" : "pl-[42px]"}`}>{job.role}</p>

      {/* Row 3: Metadata dots + type (hidden in compact) */}
      {!compact && (
        <div className="mt-2 flex items-center gap-2 pl-[42px]">
          {job.applicationType && job.applicationType !== "Other" && job.applicationType !== "All" && (
            <span className="text-[10px] text-muted-foreground/60 font-medium tracking-wide uppercase truncate">{job.applicationType}</span>
          )}
          <div className="flex items-center gap-1.5 ml-auto">
            {hasUpcomingEvents && (
              <div className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" title="Events scheduled" />
            )}
            {deadlineSoon && (
              <div className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" title="Deadline approaching" />
            )}
            {job.links?.[0] && (
              <div className="h-2 w-2 rounded-full bg-sky-400 ring-2 ring-sky-400/20" title="Has link" />
            )}
          </div>
        </div>
      )}

      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 glass rounded-lg px-1.5 py-1">
        {onSchedule && (
          <button
            onClick={(e) => { e.stopPropagation(); onSchedule(job); }}
            className="text-muted-foreground hover:text-primary p-0.5 transition-colors"
            aria-label="Schedule event"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
          </button>
        )}
        {job.links?.[0] && (
          <a
            href={job.links[0]}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-primary p-0.5 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-destructive p-0.5 transition-colors"
              aria-label="Delete application"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete application?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {job.company} — {job.role} and all associated events.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(e) => { e.stopPropagation(); onDelete(job.id); }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
};

export default JobCard;
