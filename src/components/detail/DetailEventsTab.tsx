import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, CalendarDays, Users, Download, ExternalLink, Pencil, AlertCircle,
} from "lucide-react";
import InlineEdit from "@/components/InlineEdit";
import type { JobApplication, Contact, JobEvent } from "@/types/job";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { generateICS, downloadICS, googleCalendarUrl } from "@/lib/ics";
import ScheduleEventDialog from "@/components/ScheduleEventDialog";

const SECTION_ICON_COLORS = {
  contacts: "hsl(142, 60%, 42%)",
  events: "hsl(24, 85%, 52%)",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  interview: "Interview",
  follow_up: "Follow-up",
  deadline: "Deadline",
};

const EVENT_BORDER_COLORS: Record<string, string> = {
  interview: "hsl(215, 80%, 55%)",
  follow_up: "hsl(36, 95%, 54%)",
  deadline: "hsl(0, 72%, 51%)",
};

interface DetailEventsTabProps {
  job: JobApplication;
  onUpdate: <K extends keyof JobApplication>(key: K, value: JobApplication[K]) => void;
  onSave: (job: JobApplication) => void;
}

const DetailEventsTab = ({ job, onUpdate, onSave }: DetailEventsTabProps) => {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<JobEvent | undefined>(undefined);

  const addContact = () => {
    const newContact: Contact = { id: crypto.randomUUID(), name: "", role: "", email: "" };
    onUpdate("contacts", [...job.contacts, newContact]);
  };

  const updateContact = (id: string, field: keyof Contact, value: string) => {
    onUpdate("contacts", job.contacts.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const removeContact = (id: string) => {
    onUpdate("contacts", job.contacts.filter((c) => c.id !== id));
  };

  const handleEventSave = (updatedJob: JobApplication) => {
    onSave(updatedJob);
  };

  const pastEventsWithoutOutcome = (job.events ?? []).filter(
    (e) => isBefore(parseISO(e.date), startOfDay(new Date())) && !e.outcome
  );

  return (
    <div className="space-y-4">
      {/* Contacts */}
      <section className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: SECTION_ICON_COLORS.contacts + "20" }}>
              <Users className="h-3.5 w-3.5" style={{ color: SECTION_ICON_COLORS.contacts }} />
            </div>
            <span className="text-sm font-semibold text-foreground">Contacts</span>
          </div>
          <Button variant="ghost" size="sm" onClick={addContact} className="h-7 gap-1 text-xs">
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
        {job.contacts.map((contact) => (
          <div key={contact.id} className="space-y-1 rounded-lg border border-border p-2.5">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 space-y-0.5">
                <InlineEdit
                  value={contact.name}
                  onChange={(v) => updateContact(contact.id, "name", v)}
                  placeholder="Name"
                  className="text-sm font-medium text-foreground"
                />
                <InlineEdit
                  value={contact.role}
                  onChange={(v) => updateContact(contact.id, "role", v)}
                  placeholder="Role / Title"
                  className="text-xs text-muted-foreground"
                />
                <InlineEdit
                  value={contact.email}
                  onChange={(v) => updateContact(contact.id, "email", v)}
                  placeholder="Email"
                  className="text-xs text-primary"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeContact(contact.id)} className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        {job.contacts.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No contacts yet</p>
        )}
      </section>

      {/* Events */}
      <section className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: SECTION_ICON_COLORS.events + "20" }}>
              <CalendarDays className="h-3.5 w-3.5" style={{ color: SECTION_ICON_COLORS.events }} />
            </div>
            <span className="text-sm font-semibold text-foreground">Events</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setEditingEvent(undefined); setScheduleOpen(true); }} className="h-7 gap-1 text-xs">
            <Plus className="h-3 w-3" /> Schedule
          </Button>
        </div>

        {pastEventsWithoutOutcome.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 p-2.5">
            <AlertCircle className="h-4 w-4 text-accent shrink-0" />
            <span className="text-xs text-foreground">
              {pastEventsWithoutOutcome.length} past event{pastEventsWithoutOutcome.length > 1 ? "s" : ""} need{pastEventsWithoutOutcome.length === 1 ? "s" : ""} an outcome —{" "}
              <button className="underline font-medium" onClick={() => { setEditingEvent(pastEventsWithoutOutcome[0]); setScheduleOpen(true); }}>
                Record now
              </button>
            </span>
          </div>
        )}

        {(job.events ?? []).map((evt) => {
          const isPast = isBefore(parseISO(evt.date), startOfDay(new Date()));
          const borderColor = EVENT_BORDER_COLORS[evt.type] ?? "hsl(var(--border))";
          return (
            <div
              key={evt.id}
              className="rounded-lg border border-border border-l-[3px] p-2.5 space-y-1"
              style={{ borderLeftColor: borderColor }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Badge variant="outline" className="text-[10px] font-medium shrink-0">
                    {EVENT_TYPE_LABELS[evt.type] ?? evt.type}
                  </Badge>
                  <span className="text-sm font-medium text-foreground truncate">{evt.title}</span>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground"
                    onClick={() => {
                      const ics = generateICS({ title: evt.title, date: evt.date, time: evt.time, location: evt.location, notes: evt.prepNotes });
                      downloadICS(ics, `${evt.title.replace(/\s+/g, "-")}.ics`);
                    }}
                    title="Download .ics"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" asChild title="Add to Google Calendar">
                    <a href={googleCalendarUrl({ title: evt.title, date: evt.date, time: evt.time, location: evt.location })} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => { setEditingEvent(evt); setScheduleOpen(true); }} title="Edit event">
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{format(parseISO(evt.date), "MMM d, yyyy")}</span>
                {evt.time && <span>at {evt.time}</span>}
                {evt.location && <span>· {evt.location}</span>}
              </div>
              {evt.outcome && (
                <Badge variant={evt.outcome === "passed" ? "default" : evt.outcome === "rejected" ? "destructive" : "secondary"} className="text-[10px]">
                  {evt.outcome.charAt(0).toUpperCase() + evt.outcome.slice(1)}
                </Badge>
              )}
              {isPast && !evt.outcome && (
                <button className="text-xs text-accent underline" onClick={() => { setEditingEvent(evt); setScheduleOpen(true); }}>
                  How did it go?
                </button>
              )}
            </div>
          );
        })}

        {(!job.events || job.events.length === 0) && (
          <p className="text-xs text-muted-foreground italic">No events scheduled</p>
        )}
      </section>

      <ScheduleEventDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        job={job}
        event={editingEvent}
        onSave={handleEventSave}
      />
    </div>
  );
};

export default DetailEventsTab;
