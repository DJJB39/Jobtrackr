import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, Clock, MapPin, Briefcase } from "lucide-react";
import { format, parseISO, isSameDay, isSameMonth, startOfDay } from "date-fns";
import type { JobApplication, JobEvent } from "@/types/job";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  jobs: JobApplication[];
  onSelectJob?: (job: JobApplication) => void;
}

interface CalendarEventItem {
  jobId: string;
  company: string;
  role: string;
  event: JobEvent;
}

interface DeadlineItem {
  jobId: string;
  company: string;
  role: string;
  date: string;
}

type ListItem =
  | { kind: "event"; data: CalendarEventItem }
  | { kind: "deadline"; data: DeadlineItem };

const TYPE_STYLES: Record<string, string> = {
  interview: "bg-status-phone/15 text-status-phone border-status-phone/30",
  follow_up: "bg-status-applied/15 text-status-applied border-status-applied/30",
  deadline: "bg-destructive/15 text-destructive border-destructive/30",
};

const TYPE_LABELS: Record<string, string> = {
  interview: "Interview",
  follow_up: "Follow-up",
  deadline: "Deadline",
};

const CalendarView = ({ jobs, onSelectJob }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(new Date());

  const jobMap = useMemo(() => {
    const map = new Map<string, JobApplication>();
    for (const job of jobs) map.set(job.id, job);
    return map;
  }, [jobs]);

  // Collect all events + deadlines
  const allItems = useMemo(() => {
    const items: ListItem[] = [];
    for (const job of jobs) {
      for (const evt of job.events ?? []) {
        items.push({
          kind: "event",
          data: { jobId: job.id, company: job.company, role: job.role, event: evt },
        });
      }
      if (job.closeDate) {
        items.push({
          kind: "deadline",
          data: { jobId: job.id, company: job.company, role: job.role, date: job.closeDate },
        });
      }
    }
    return items;
  }, [jobs]);

  // Dates that have events (for dot indicators)
  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    for (const item of allItems) {
      const d = item.kind === "event" ? item.data.event.date : item.data.date;
      dates.add(d);
    }
    return dates;
  }, [allItems]);

  // Items for the selected date
  const selectedItems = useMemo(() => {
    if (!selectedDate) return [];
    return allItems
      .filter((item) => {
        const d = item.kind === "event" ? item.data.event.date : item.data.date;
        try {
          return isSameDay(parseISO(d), selectedDate);
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const dateA = a.kind === "event" ? a.data.event.date : a.data.date;
        const dateB = b.kind === "event" ? b.data.event.date : b.data.date;
        const timeA = a.kind === "event" ? a.data.event.time ?? "" : "";
        const timeB = b.kind === "event" ? b.data.event.time ?? "" : "";
        return `${dateA}${timeA}`.localeCompare(`${dateB}${timeB}`);
      });
  }, [allItems, selectedDate]);

  // Items for the visible month (for sidebar when no date selected)
  const monthItems = useMemo(() => {
    return allItems
      .filter((item) => {
        const d = item.kind === "event" ? item.data.event.date : item.data.date;
        try {
          return isSameMonth(parseISO(d), month);
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const dateA = a.kind === "event" ? a.data.event.date : a.data.date;
        const dateB = b.kind === "event" ? b.data.event.date : b.data.date;
        return dateA.localeCompare(dateB);
      });
  }, [allItems, month]);

  const displayItems = selectedDate ? selectedItems : monthItems;
  const displayLabel = selectedDate
    ? format(selectedDate, "EEEE, MMMM d")
    : format(month, "MMMM yyyy");

  // Custom day rendering to show dots
  const modifiers = useMemo(() => {
    const hasEvent: Date[] = [];
    eventDates.forEach((d) => {
      try {
        hasEvent.push(parseISO(d));
      } catch { /* skip */ }
    });
    return { hasEvent };
  }, [eventDates]);

  const modifiersStyles = {
    hasEvent: {} as React.CSSProperties,
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: Calendar grid */}
      <div className="flex flex-col items-center border-r border-border p-6 w-[340px] shrink-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          month={month}
          onMonthChange={setMonth}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="p-3 pointer-events-auto"
          components={{
            DayContent: ({ date }) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const hasEvents = eventDates.has(dateStr);
              return (
                <div className="relative flex flex-col items-center">
                  <span>{date.getDate()}</span>
                  {hasEvents && (
                    <div className="absolute -bottom-1 flex gap-0.5">
                      <span className="h-1 w-1 rounded-full bg-accent" />
                    </div>
                  )}
                </div>
              );
            },
            IconLeft: ({ ...props }) => (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            ),
            IconRight: ({ ...props }) => (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            ),
          }}
        />
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            {eventDates.size} day{eventDates.size !== 1 ? "s" : ""} with events
          </p>
        </div>
      </div>

      {/* Right: Event list sidebar */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">{displayLabel}</h2>
          <span className="text-xs text-muted-foreground ml-auto">
            {displayItems.length} event{displayItems.length !== 1 ? "s" : ""}
          </span>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CalendarDays className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">No events {selectedDate ? "on this day" : "this month"}</p>
              </div>
            ) : (
              displayItems.map((item, i) => {
                if (item.kind === "event") {
                  const evt = item.data.event;
                  const isPast = parseISO(evt.date) < startOfDay(new Date());
                  return (
                    <div
                      key={evt.id}
                      onClick={() => {
                        const fullJob = jobMap.get(item.data.jobId);
                        if (fullJob && onSelectJob) onSelectJob(fullJob);
                      }}
                      className={cn(
                        "rounded-lg border border-border bg-card p-3 space-y-1.5 cursor-pointer hover:bg-muted/50 transition-colors",
                        isPast && !evt.outcome && "border-accent/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] border", TYPE_STYLES[evt.type])}
                        >
                          {TYPE_LABELS[evt.type] ?? evt.type}
                        </Badge>
                        <span className="text-sm font-medium text-foreground truncate">
                          {evt.title}
                        </span>
                        {evt.outcome && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] ml-auto",
                              evt.outcome === "passed" && "border-status-accepted/50 text-status-accepted",
                              evt.outcome === "rejected" && "border-destructive/50 text-destructive",
                            )}
                          >
                            {evt.outcome}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {item.data.company} — {item.data.role}
                        </span>
                        {evt.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {evt.time}
                          </span>
                        )}
                        {evt.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {evt.location}
                          </span>
                        )}
                      </div>
                      {isPast && !evt.outcome && (
                        <p className="text-[10px] text-accent font-medium">
                          Outcome not recorded
                        </p>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={item.data.jobId + "-deadline"}
                      onClick={() => {
                        const fullJob = jobMap.get(item.data.jobId);
                        if (fullJob && onSelectJob) onSelectJob(fullJob);
                      }}
                      className="rounded-lg border border-border bg-card p-3 space-y-1.5 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] border", TYPE_STYLES.deadline)}
                        >
                          Deadline
                        </Badge>
                        <span className="text-sm font-medium text-foreground truncate">
                          Apply by {format(parseISO(item.data.date), "MMM d")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3" />
                        {item.data.company} — {item.data.role}
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default CalendarView;
