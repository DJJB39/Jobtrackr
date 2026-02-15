import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import type { JobApplication, ColumnId } from "@/types/job";
import {
  Trash2,
  ExternalLink,
  CalendarPlus,
  MapPin,
  Clock,
  Users,
} from "lucide-react";
import { differenceInDays, parseISO, startOfDay, isBefore, format } from "date-fns";
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

const STAGE_PROGRESS: Record<string, number> = {
  found: 10,
  applied: 25,
  phone: 45,
  interview2: 60,
  final: 75,
  offer: 90,
  accepted: 100,
  rejected: 0,
};

const formatSalary = (salary: string): string =>
  salary.length > 14 ? salary.slice(0, 14) + "…" : salary;

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

  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    return (job.events ?? [])
      .filter((e) => { try { return !isBefore(parseISO(e.date), today); } catch { return false; } })
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(0, 2);
  }, [job.events]);

  const upcomingEventCount = useMemo(() => {
    const today = startOfDay(new Date());
    return (job.events ?? []).filter((e) => {
      try { return !isBefore(parseISO(e.date), today); } catch { return false; }
    }).length;
  }, [job.events]);

  const contactCount = job.contacts?.length ?? 0;
  const stageProgress = columnId ? (STAGE_PROGRESS[columnId] ?? 0) : 0;
  const visibleLinks = (job.links ?? []).slice(0, 3);
  const hasMoreLinks = (job.links ?? []).length > 3;

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
      className={`group relative cursor-grab active:cursor-grabbing rounded-xl ${compact ? "p-2.5" : "p-3.5"} shadow-sm transition-all duration-200 glow-hover
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

      {/* Row 1: Company name */}
      <h4 className="font-bold text-base text-card-foreground truncate pr-16">{job.company}</h4>

      {/* Row 2: Role + salary + CV score */}
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-sm text-muted-foreground truncate flex-1">{job.role}</span>
        {job.salary && (
          <span className={`shrink-0 rounded-md px-2.5 py-0.5 text-xs font-semibold ${getSalaryColorFromParsed(job.salary)}`}>
            {formatSalary(job.salary)}
          </span>
        )}
        {cvScore !== null && (
          <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold font-mono ${
            cvScore >= 75 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" :
            cvScore >= 50 ? "bg-amber-500/20 text-amber-400 border border-amber-500/20" :
            "bg-rose-500/20 text-rose-400 border border-rose-500/20"
          }`} title={`CV Match: ${cvScore}%`}>
            {cvScore}%
          </span>
        )}
      </div>

      {/* Row 3: Date applied */}
      <p className="text-[11px] text-muted-foreground/60 mt-1">
        Applied {(() => { try { return format(parseISO(job.createdAt), "MMM d, yyyy"); } catch { return "—"; } })()}
      </p>

      {/* Non-compact details */}
      {!compact && (
        <>
          {/* Row 4: Location + Type */}
          {(job.location || (job.applicationType && job.applicationType !== "Other" && job.applicationType !== "All")) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {job.location && (
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] bg-muted/60 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
              )}
              {job.applicationType && job.applicationType !== "Other" && job.applicationType !== "All" && (
                <span className="text-[11px] text-muted-foreground/60 font-medium tracking-wide uppercase">
                  {job.applicationType}
                </span>
              )}
            </div>
          )}

          {/* Row 5: Notes preview */}
          {job.notes && (
            <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed mt-2">
              {job.notes}
            </p>
          )}

          {/* Row 6: Upcoming events */}
          {upcomingEvents.length > 0 && (
            <div className="mt-2 space-y-1">
              {upcomingEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0 text-primary/60" />
                  <span className="truncate flex-1">{e.title}</span>
                  <span className="shrink-0 text-muted-foreground/50">
                    {(() => { try { return format(parseISO(e.date), "MMM d"); } catch { return ""; } })()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Row 7: Contacts */}
          {contactCount > 0 && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3 shrink-0" />
              <span>
                {contactCount === 1
                  ? job.contacts[0]?.name || "1 contact"
                  : `${contactCount} contacts`}
              </span>
            </div>
          )}
        </>
      )}

      {/* Compact mode: badges row */}
      {compact && (upcomingEventCount > 0 || contactCount > 0) && (
        <div className="flex items-center gap-2.5 mt-1.5">
          {upcomingEventCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3 text-primary/60" />
              {upcomingEventCount} upcoming
            </span>
          )}
          {contactCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3" />
              {contactCount}
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      {columnId && columnId !== "rejected" && (
        <div className="h-1 rounded-full bg-primary/10 overflow-hidden mt-2.5">
          <div
            className="h-full rounded-full bg-primary/40 transition-all duration-500"
            style={{ width: `${stageProgress}%` }}
          />
        </div>
      )}

      {/* Hover actions */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 glass rounded-lg px-1.5 py-1">
        {onSchedule && (
          <button
            onClick={(e) => { e.stopPropagation(); onSchedule(job); }}
            className="text-muted-foreground hover:text-primary p-0.5 transition-colors"
            aria-label="Schedule event"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
          </button>
        )}
        {visibleLinks.map((link, i) => (
          <a
            key={i}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-primary p-0.5 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ))}
        {hasMoreLinks && (
          <span className="text-muted-foreground text-xs px-0.5">…</span>
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
