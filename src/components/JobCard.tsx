import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { JobApplication } from "@/types/job";
import { GripVertical, Building2, Briefcase, Trash2, MapPin, DollarSign, CalendarDays, ExternalLink } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";

const isClosingSoon = (dateStr: string) => {
  try {
    return differenceInDays(parseISO(dateStr), new Date()) < 7;
  } catch { return false; }
};

const formatDeadline = (dateStr: string) => {
  try { return format(parseISO(dateStr), "MMM d"); }
  catch { return dateStr; }
};

interface JobCardProps {
  job: JobApplication;
  onDelete: (id: string) => void;
  onClick?: (job: JobApplication) => void;
}

const JobCard = ({ job, onDelete, onClick }: JobCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id, data: { type: "job", job } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onClick?.(job)}
      className={`group relative cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:bg-[hsl(var(--card-hover))] ${
        isDragging ? "opacity-50 shadow-lg scale-105 z-50" : ""
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
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Briefcase className="h-3 w-3 shrink-0" />
            <span className="truncate">{job.role}</span>
          </div>
          {job.location && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" />
              <span className="truncate">{job.location}</span>
            </div>
          )}
          {job.salary && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
              <DollarSign className="h-2.5 w-2.5" />
              <span className="truncate">{job.salary}</span>
            </div>
          )}
          {job.closeDate && (
            <div className={`mt-1 flex items-center gap-1 text-[10px] ${
              isClosingSoon(job.closeDate) ? "text-destructive font-medium" : "text-muted-foreground"
            }`}>
              <CalendarDays className="h-2.5 w-2.5" />
              <span>{formatDeadline(job.closeDate)}</span>
            </div>
          )}
          {job.applicationType && job.applicationType !== "Other" && (
            <span className="mt-1.5 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {job.applicationType}
            </span>
          )}
        </div>
        {job.links?.[0] && (
          <a href={job.links[0]} target="_blank" rel="noopener noreferrer"
             onClick={(e) => e.stopPropagation()}
             className="mt-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(job.id); }}
          className="mt-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          aria-label="Delete application"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default JobCard;
