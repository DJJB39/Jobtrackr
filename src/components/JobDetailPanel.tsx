import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import type { JobApplication, Contact, NextStep } from "@/types/job";
import { COLUMNS } from "@/types/job";
import { format } from "date-fns";

interface JobDetailPanelProps {
  job: JobApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (job: JobApplication) => void;
}

const JobDetailPanel = ({ job, open, onOpenChange, onSave }: JobDetailPanelProps) => {
  const [editedJob, setEditedJob] = useState<JobApplication | null>(null);

  useEffect(() => {
    if (job) setEditedJob({ ...job });
  }, [job]);

  if (!editedJob) return null;

  const column = COLUMNS.find((c) => c.id === editedJob.columnId);

  const update = <K extends keyof JobApplication>(key: K, value: JobApplication[K]) => {
    const updated = { ...editedJob, [key]: value };
    setEditedJob(updated);
    onSave(updated);
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        {/* Header */}
        <SheetHeader className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            {column && <div className={`h-2.5 w-2.5 rounded-full ${column.colorClass}`} />}
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {column?.title}
            </span>
          </div>
          <SheetTitle className="text-lg font-bold">{editedJob.company}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-6 py-5">
          {/* Company & Role */}
          <section className="space-y-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> Company
              </Label>
              <Input
                value={editedJob.company}
                onChange={(e) => update("company", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" /> Job Title
              </Label>
              <Input
                value={editedJob.role}
                onChange={(e) => update("role", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" /> Applied Date
              </Label>
              <p className="text-sm text-foreground font-mono">
                {format(new Date(editedJob.createdAt), "PPP")}
              </p>
            </div>
          </section>

          <Separator />

          {/* Notes */}
          <section className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <StickyNote className="h-3.5 w-3.5" /> Notes
            </Label>
            <Textarea
              placeholder="Add notes about this application..."
              value={editedJob.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </section>

          <Separator />

          {/* Contacts */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Contacts
              </Label>
              <Button variant="ghost" size="sm" onClick={addContact} className="h-7 gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            {editedJob.contacts.map((contact) => (
              <div key={contact.id} className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <Input
                    placeholder="Name"
                    value={contact.name}
                    onChange={(e) => updateContact(contact.id, "name", e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeContact(contact.id)}
                    className="h-7 w-7 shrink-0 ml-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  placeholder="Role / Title"
                  value={contact.role}
                  onChange={(e) => updateContact(contact.id, "role", e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Email"
                  value={contact.email}
                  onChange={(e) => updateContact(contact.id, "email", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            ))}
            {editedJob.contacts.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No contacts yet</p>
            )}
          </section>

          <Separator />

          {/* Next Steps */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ListChecks className="h-3.5 w-3.5" /> Next Steps
              </Label>
              <Button variant="ghost" size="sm" onClick={addNextStep} className="h-7 gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            {editedJob.nextSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-2">
                <Checkbox
                  checked={step.done}
                  onCheckedChange={(v) => updateNextStep(step.id, "done", !!v)}
                />
                <Input
                  placeholder="What's next?"
                  value={step.text}
                  onChange={(e) => updateNextStep(step.id, "text", e.target.value)}
                  className={`h-8 flex-1 text-sm ${step.done ? "line-through text-muted-foreground" : ""}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeNextStep(step.id)}
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {editedJob.nextSteps.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No next steps</p>
            )}
          </section>

          <Separator />

          {/* Links */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <LinkIcon className="h-3.5 w-3.5" /> Links
              </Label>
              <Button variant="ghost" size="sm" onClick={addLink} className="h-7 gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            {editedJob.links.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => updateLink(i, e.target.value)}
                  className="h-8 flex-1 text-sm"
                />
                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLink(i)}
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {editedJob.links.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No links yet</p>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default JobDetailPanel;
