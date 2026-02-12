import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { JobApplication, ColumnId } from "@/types/job";
import {
  GripVertical,
  Building2,
  Briefcase,
  Trash2,
  MapPin,
  DollarSign,
  CalendarDays,
  ExternalLink,
  CalendarPlus,
  Clock,
} from "lucide-react";
import { differenceInDays, parseISO, format, isBefore, startOfDay } from "date-fns";
import { useMemo } from "react";
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

const STATUS_BORDER_COLORS: Record<string, string> = {
  found: "hsl(215, 80%, 55%)",
  applied: "hsl(262, 60%, 55%)",
  phone: "hsl(190, 75%, 42%)",
  interview2: "hsl(36, 95%, 54%)",
  final: "hsl(24, 85%, 52%)",
  offer: "hsl(142, 60%, 42%)",
  accepted: "hsl(142, 72%, 35%)",
  rejected: "hsl(0, 72%, 51%)",
};

const isClosingSoon = (dateStr: string) => {
  try {
    return differenceInDays(parseISO(dateStr), new Date()) < 7;
  } catch {
    return false;
  }
};

const formatDeadline = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), "MMM d");
  } catch {
    return dateStr;
  }
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

  const resolvedColumnId = columnId ?? job.columnId;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderLeftColor: STATUS_BORDER_COLORS[resolvedColumnId] ?? "transparent",
  };

  const nextEvent = useMemo(() => {
    const today = startOfDay(new Date());
    return (
      (job.events ?? [])
        .filter((e) => {
          try {
            return !isBefore(parseISO(e.date), today);
          } catch {
            return false;
          }
        })
        .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
    );
  }, [job.events]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onClick?.(job)}
      className={`group relative cursor-pointer rounded-lg border border-border border-l-[3px] bg-gradient-to-r from-card to-card/80 p-3 shadow-sm transition-all hover:shadow-lg hover:shadow-primary/5 hover:bg-[hsl(var(--card-hover))] ${
        isDragging ? "shadow-2xl shadow-primary/10 scale-105 z-50" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-card-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{job.company}</span>
            {job.links?.[0] && (
              <span className="text-[9px] text-muted-foreground/70 font-normal bg-muted rounded px-1 py-0.5 shrink-0">
                Fetched
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Briefcase className="h-3 w-3 shrink-0" />
            <span className="truncate">{job.role}</span>
          </div>
          {job.location && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate max-w-[140px]">{job.location}</span>
            </div>
          )}
          {job.salary && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
              <DollarSign className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate max-w-[140px]">{job.salary}</span>
            </div>
          )}
          {job.closeDate && (
            <div
              className={`mt-1 flex items-center gap-1 text-[10px] ${
                isClosingSoon(job.closeDate) ? "text-destructive font-medium" : "text-muted-foreground"
              }`}
            >
              <CalendarDays className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate max-w-[140px]">{formatDeadline(job.closeDate)}</span>
            </div>
          )}
          {nextEvent && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate max-w-[160px]">
                {job.events.length === 1
                  ? `${nextEvent.title.slice(0, 18)}${nextEvent.title.length > 18 ? "…" : ""}`
                  : `${job.events.length} events`}
                {" — "}
                {formatDeadline(nextEvent.date)}
                {nextEvent.time ? ` ${nextEvent.time}` : ""}
              </span>
            </div>
          )}
          {job.applicationType && job.applicationType !== "Other" && (
            <span className="mt-1.5 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {job.applicationType}
            </span>
          )}
        </div>
        {onSchedule && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSchedule(job);
            }}
            className="mt-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
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
            className="mt-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
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
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(job.id);
                }}
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
