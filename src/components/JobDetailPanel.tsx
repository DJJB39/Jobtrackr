import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Briefcase,
  CalendarDays,
  Plus,
  Trash2,
  Link as LinkIcon,
  Users,
  ListChecks,
  StickyNote,
  ExternalLink,
  MapPin,
  FileText,
  DollarSign,
  Download,
  Pencil,
  AlertCircle,
} from "lucide-react";
import type { JobApplication, Contact, NextStep, JobEvent } from "@/types/job";
import { COLUMNS, APPLICATION_TYPES } from "@/types/job";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { generateICS, downloadICS, googleCalendarUrl } from "@/lib/ics";
import ScheduleEventDialog from "./ScheduleEventDialog";

interface JobDetailPanelProps {
  job: JobApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (job: JobApplication) => void;
}

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

const SECTION_ICON_COLORS = {
  company: "hsl(36, 95%, 54%)",
  notes: "hsl(215, 80%, 55%)",
  contacts: "hsl(142, 60%, 42%)",
  steps: "hsl(262, 60%, 55%)",
  events: "hsl(24, 85%, 52%)",
  links: "hsl(190, 75%, 42%)",
};

const JobDetailPanel = ({ job, open, onOpenChange, onSave }: JobDetailPanelProps) => {
  const [editedJob, setEditedJob] = useState<JobApplication | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<JobEvent | undefined>(undefined);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const savedFadeRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (job) setEditedJob({ ...job });
  }, [job]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedFadeRef.current) clearTimeout(savedFadeRef.current);
    };
  }, []);

  const debouncedSave = useCallback((updated: JobApplication) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus("saving");
    debounceRef.current = setTimeout(() => {
      onSave(updated);
      setSaveStatus("saved");
      if (savedFadeRef.current) clearTimeout(savedFadeRef.current);
      savedFadeRef.current = setTimeout(() => setSaveStatus("idle"), 1500);
    }, 500);
  }, [onSave]);

  if (!editedJob) return null;

  const column = COLUMNS.find((c) => c.id === editedJob.columnId);

  const update = <K extends keyof JobApplication>(key: K, value: JobApplication[K]) => {
    const updated = { ...editedJob, [key]: value };
    setEditedJob(updated);
    debouncedSave(updated);
  };

  const addContact = () => {
    const newContact: Contact = { id: crypto.randomUUID(), name: "", role: "", email: "" };
    update("contacts", [...editedJob.contacts, newContact]);
  };

  const updateContact = (id: string, field: keyof Contact, value: string) => {
    update("contacts", editedJob.contacts.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const removeContact = (id: string) => {
    update("contacts", editedJob.contacts.filter((c) => c.id !== id));
  };

  const addNextStep = () => {
    const step: NextStep = { id: crypto.randomUUID(), text: "", done: false };
    update("nextSteps", [...editedJob.nextSteps, step]);
  };

  const updateNextStep = (id: string, field: keyof NextStep, value: string | boolean) => {
    update("nextSteps", editedJob.nextSteps.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const removeNextStep = (id: string) => {
    update("nextSteps", editedJob.nextSteps.filter((s) => s.id !== id));
  };

  const addLink = () => {
    update("links", [...editedJob.links, ""]);
  };

  const updateLink = (index: number, value: string) => {
    const updated = [...editedJob.links];
    updated[index] = value;
    update("links", updated);
  };

  const removeLink = (index: number) => {
    update("links", editedJob.links.filter((_, i) => i !== index));
  };

  const handleEventSave = (updatedJob: JobApplication) => {
    setEditedJob(updatedJob);
    onSave(updatedJob);
  };

  const pastEventsWithoutOutcome = (editedJob.events ?? []).filter(
    (e) => isBefore(parseISO(e.date), startOfDay(new Date())) && !e.outcome
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        {/* Header */}
        <SheetHeader className="sticky top-0 z-10 bg-gradient-to-r from-card to-secondary/30 backdrop-blur-sm border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            {column && <div className={`h-2.5 w-2.5 rounded-full ${column.colorClass}`} />}
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {column?.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SheetTitle className="text-lg font-bold">{editedJob.company}</SheetTitle>
            {saveStatus !== "idle" && (
              <span className={`text-[10px] font-medium transition-opacity ${saveStatus === "saving" ? "text-muted-foreground animate-pulse" : "text-emerald-500"}`}>
                {saveStatus === "saving" ? "Saving…" : "Saved"}
              </span>
            )}
          </div>
        </SheetHeader>

        {editedJob.links?.[0] && (
          <a href={editedJob.links[0]} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline px-6 pt-2">
            <ExternalLink className="h-3 w-3" /> View Original Posting
          </a>
        )}

        <div className="space-y-4 px-6 py-5">
          {/* Company & Role */}
          <section className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: SECTION_ICON_COLORS.company + "20" }}>
                <Building2 className="h-3.5 w-3.5" style={{ color: SECTION_ICON_COLORS.company }} />
              </div>
              <span className="text-sm font-semibold text-foreground">Details</span>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> Company
              </Label>
              <Input value={editedJob.company} onChange={(e) => update("company", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" /> Job Title
              </Label>
              <Input value={editedJob.role} onChange={(e) => update("role", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" /> Applied Date
              </Label>
              <p className="text-sm text-foreground font-mono">
                {format(new Date(editedJob.createdAt), "PPP")}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" /> Application Type
              </Label>
              <Select value={editedJob.applicationType} onValueChange={(v) => update("applicationType", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {APPLICATION_TYPES.filter((t) => t !== "All").map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Location
              </Label>
              <Input placeholder="e.g. San Francisco, CA" value={editedJob.location ?? ""} onChange={(e) => update("location", e.target.value || undefined)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" /> Description
              </Label>
              <Textarea placeholder="Short description of the role..." value={editedJob.description ?? ""} onChange={(e) => update("description", e.target.value.slice(0, 500) || undefined)} className="min-h-[80px] resize-none" maxLength={500} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" /> Salary / Range
              </Label>
              <Input placeholder="e.g. $120k-$150k" value={editedJob.salary ?? ""} onChange={(e) => update("salary", e.target.value || undefined)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" /> Application Deadline
              </Label>
              <Input type="date" value={editedJob.closeDate ?? ""} onChange={(e) => update("closeDate", e.target.value || undefined)} />
            </div>
          </section>

          {/* Notes */}
          <section className="rounded-xl border border-border bg-card/50 p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: SECTION_ICON_COLORS.notes + "20" }}>
                <StickyNote className="h-3.5 w-3.5" style={{ color: SECTION_ICON_COLORS.notes }} />
              </div>
              <span className="text-sm font-semibold text-foreground">Notes</span>
            </div>
            <Textarea placeholder="Add notes about this application..." value={editedJob.notes} onChange={(e) => update("notes", e.target.value)} className="min-h-[100px] resize-none" />
          </section>

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
            {editedJob.contacts.map((contact) => (
              <div key={contact.id} className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <Input placeholder="Name" value={contact.name} onChange={(e) => updateContact(contact.id, "name", e.target.value)} className="h-8 text-sm" />
                  <Button variant="ghost" size="icon" onClick={() => removeContact(contact.id)} className="h-7 w-7 shrink-0 ml-2 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Input placeholder="Role / Title" value={contact.role} onChange={(e) => updateContact(contact.id, "role", e.target.value)} className="h-8 text-sm" />
                <Input placeholder="Email" value={contact.email} onChange={(e) => updateContact(contact.id, "email", e.target.value)} className="h-8 text-sm" />
              </div>
            ))}
            {editedJob.contacts.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No contacts yet</p>
            )}
          </section>

          {/* Next Steps */}
          <section className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: SECTION_ICON_COLORS.steps + "20" }}>
                  <ListChecks className="h-3.5 w-3.5" style={{ color: SECTION_ICON_COLORS.steps }} />
                </div>
                <span className="text-sm font-semibold text-foreground">Next Steps</span>
              </div>
              <Button variant="ghost" size="sm" onClick={addNextStep} className="h-7 gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            {editedJob.nextSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-2">
                <Checkbox checked={step.done} onCheckedChange={(v) => updateNextStep(step.id, "done", !!v)} />
                <Input placeholder="What's next?" value={step.text} onChange={(e) => updateNextStep(step.id, "text", e.target.value)} className={`h-8 flex-1 text-sm ${step.done ? "line-through text-muted-foreground" : ""}`} />
                <Button variant="ghost" size="icon" onClick={() => removeNextStep(step.id)} className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {editedJob.nextSteps.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No next steps</p>
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
                <Plus className="h-3 w-3" /> Schedule Event
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

            {(editedJob.events ?? []).map((evt) => {
              const isPast = isBefore(parseISO(evt.date), startOfDay(new Date()));
              const borderColor = EVENT_BORDER_COLORS[evt.type] ?? "hsl(var(--border))";
              return (
                <div
                  key={evt.id}
                  className="rounded-lg border border-border border-l-[3px] p-3 space-y-1.5"
                  style={{ borderLeftColor: borderColor }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-medium">
                        {EVENT_TYPE_LABELS[evt.type] ?? evt.type}
                      </Badge>
                      <span className="text-sm font-medium text-foreground truncate">{evt.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
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

            {(!editedJob.events || editedJob.events.length === 0) && (
              <p className="text-xs text-muted-foreground italic">No events scheduled</p>
            )}
          </section>

          {/* Links */}
          <section className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: SECTION_ICON_COLORS.links + "20" }}>
                  <LinkIcon className="h-3.5 w-3.5" style={{ color: SECTION_ICON_COLORS.links }} />
                </div>
                <span className="text-sm font-semibold text-foreground">Links</span>
              </div>
              <Button variant="ghost" size="sm" onClick={addLink} className="h-7 gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            {editedJob.links.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input placeholder="https://..." value={link} onChange={(e) => updateLink(i, e.target.value)} className="h-8 flex-1 text-sm" />
                {link && (
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <Button variant="ghost" size="icon" onClick={() => removeLink(i)} className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {editedJob.links.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No links yet</p>
            )}
          </section>
        </div>

        <ScheduleEventDialog
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          job={editedJob}
          event={editingEvent}
          onSave={handleEventSave}
        />
      </SheetContent>
    </Sheet>
  );
};

export default JobDetailPanel;
