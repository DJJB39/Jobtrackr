import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { JobApplication, ColumnId } from "@/types/job";
import {
  Trash2,
  ExternalLink,
  CalendarPlus,
} from "lucide-react";
import { differenceInDays, parseISO, startOfDay, isBefore } from "date-fns";
import { useMemo, useState } from "react";
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

const getSalaryColor = (salary: string): string => {
  const match = salary.match(/\d+/);
  const num = match ? parseInt(match[0]) : 0;
  if (num >= 150) return "bg-emerald-500/20 text-emerald-400";
  if (num >= 100) return "bg-blue-500/20 text-blue-400";
  if (num >= 50) return "bg-amber-500/20 text-amber-400";
  return "bg-primary/20 text-primary";
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
}

const JobCard = ({ job, onDelete, onClick, onSchedule, columnId }: JobCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    data: { type: "job", job },
  });
  const [logoError, setLogoError] = useState(false);

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(job)}
      className={`group relative cursor-grab active:cursor-grabbing rounded-xl border border-border/50 bg-card p-3 shadow-sm transition-all hover:shadow-md hover:bg-[hsl(var(--card-hover))] ${
        isDragging ? "shadow-2xl scale-105 z-50 opacity-90" : ""
      }`}
    >
      {/* Row 1: Logo + Company + Salary */}
      <div className="flex items-center gap-2.5">
        <div className={`h-8 w-8 shrink-0 rounded-lg overflow-hidden flex items-center justify-center ${logoError ? getInitialColor(job.company) : "bg-muted"}`}>
          {!logoError ? (
            <img
              src={logoUrl}
              alt=""
              className="h-full w-full object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="text-xs font-bold text-white">{job.company[0]?.toUpperCase()}</span>
          )}
        </div>
        <span className="font-semibold text-sm text-card-foreground truncate flex-1">{job.company}</span>
        {job.salary && (
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getSalaryColor(job.salary)}`}>
            {formatSalary(job.salary)}
          </span>
        )}
      </div>

      {/* Row 2: Role */}
      <p className="mt-1 text-xs text-muted-foreground truncate pl-[42px]">{job.role}</p>

      {/* Row 3: Metadata dots + type */}
      <div className="mt-1.5 flex items-center gap-2 pl-[42px]">
        {job.applicationType && job.applicationType !== "Other" && job.applicationType !== "All" && (
          <span className="text-[10px] text-muted-foreground/70 truncate">{job.applicationType}</span>
        )}
        <div className="flex items-center gap-1">
          {hasUpcomingEvents && <div className="h-2 w-2 rounded-full bg-emerald-500" title="Events scheduled" />}
          {deadlineSoon && <div className="h-2 w-2 rounded-full bg-amber-500" title="Deadline approaching" />}
          {job.links?.[0] && <div className="h-2 w-2 rounded-full bg-sky-400" title="Has link" />}
        </div>
      </div>

      {/* Hover actions - top right overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 backdrop-blur-sm rounded-md px-1 py-0.5">
        {onSchedule && (
          <button
            onClick={(e) => { e.stopPropagation(); onSchedule(job); }}
            className="text-muted-foreground hover:text-foreground p-0.5"
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
            className="text-muted-foreground hover:text-foreground p-0.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-destructive p-0.5"
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
    </div>
  );
};

export default JobCard;
