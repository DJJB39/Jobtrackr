import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Download, ExternalLink, Trash2 } from "lucide-react";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { JobApplication, JobEvent, EventType, EventOutcome } from "@/types/job";
import { COLUMNS } from "@/types/job";
import { generateICS, downloadICS, googleCalendarUrl } from "@/lib/ics";

interface ScheduleEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobApplication;
  event?: JobEvent;
  onSave: (updatedJob: JobApplication) => void;
}

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "interview", label: "Interview" },
  { value: "follow_up", label: "Follow-up" },
  { value: "deadline", label: "Deadline" },
];

const OUTCOMES: { value: string; label: string }[] = [
  { value: "passed", label: "Passed" },
  { value: "rejected", label: "Rejected" },
  { value: "pending", label: "Pending" },
  { value: "rescheduled", label: "Rescheduled" },
];

const sortEvents = (events: JobEvent[]) =>
  [...events].sort((a, b) => {
    const da = `${a.date}${a.time ?? ""}`;
    const db = `${b.date}${b.time ?? ""}`;
    return da.localeCompare(db);
  });

const ScheduleEventDialog = ({
  open,
  onOpenChange,
  job,
  event,
  onSave,
}: ScheduleEventDialogProps) => {
  const isEdit = !!event;
  const column = COLUMNS.find((c) => c.id === job.columnId);
  const defaultTitle = `${column?.title ?? "Event"} — ${job.company}`;

  const [title, setTitle] = useState(event?.title ?? defaultTitle);
  const [date, setDate] = useState<Date | undefined>(
    event?.date ? parseISO(event.date) : undefined
  );
  const [time, setTime] = useState(event?.time ?? "");
  const [type, setType] = useState<EventType>(event?.type ?? "interview");
  const [location, setLocation] = useState(event?.location ?? "");
  const [prepNotes, setPrepNotes] = useState(event?.prepNotes ?? "");
  const [outcome, setOutcome] = useState<EventOutcome>(event?.outcome ?? null);

  useEffect(() => {
    if (open) {
      setTitle(event?.title ?? defaultTitle);
      setDate(event?.date ? parseISO(event.date) : undefined);
      setTime(event?.time ?? "");
      setType(event?.type ?? "interview");
      setLocation(event?.location ?? "");
      setPrepNotes(event?.prepNotes ?? "");
      setOutcome(event?.outcome ?? null);
    }
  }, [open, event, defaultTitle]);

  const isPastEvent = event?.date
    ? isBefore(parseISO(event.date), startOfDay(new Date()))
    : false;

  const handleSave = () => {
    if (!date) return;
    const dateStr = format(date, "yyyy-MM-dd");
    const newEvent: JobEvent = {
      id: event?.id ?? crypto.randomUUID(),
      title,
      date: dateStr,
      time: time || null,
      type,
      location: location || null,
      prepNotes: prepNotes || null,
      outcome,
      createdAt: event?.createdAt ?? new Date().toISOString(),
    };

    const updatedEvents = isEdit
      ? job.events.map((e) => (e.id === event!.id ? newEvent : e))
      : [...(job.events ?? []), newEvent];

    onSave({ ...job, events: sortEvents(updatedEvents) });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!event) return;
    onSave({ ...job, events: job.events.filter((e) => e.id !== event.id) });
    onOpenChange(false);
  };

  const eventData = {
    title,
    date: date ? format(date, "yyyy-MM-dd") : "",
    time: time || null,
    location: location || null,
    notes: prepNotes || null,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Event" : "Schedule Event"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as EventType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Location</Label>
              <Input
                placeholder="Zoom / Office"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Prep Notes</Label>
            <Textarea
              placeholder="Preparation notes..."
              value={prepNotes}
              onChange={(e) => setPrepNotes(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {isPastEvent && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Outcome</Label>
              <Select
                value={outcome ?? ""}
                onValueChange={(v) => setOutcome(v as EventOutcome)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome..." />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOMES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <div className="flex gap-2">
            {date && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => {
                    const ics = generateICS(eventData);
                    downloadICS(ics, `${title.replace(/\s+/g, "-")}.ics`);
                  }}
                  title="Download .ics"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  asChild
                  title="Add to Google Calendar"
                >
                  <a href={googleCalendarUrl(eventData)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </>
            )}
            {isEdit && (
              <Button variant="outline" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={handleDelete} title="Delete event">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button onClick={handleSave} disabled={!date || !title.trim()}>
            {isEdit ? "Update" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleEventDialog;
