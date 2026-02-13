import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, FileText, StickyNote, ListChecks, Activity } from "lucide-react";
import InlineEdit from "@/components/InlineEdit";
import ActivityTimeline from "@/components/ActivityTimeline";
import type { JobApplication, NextStep } from "@/types/job";

const SECTION_ICON_COLORS = {
  company: "hsl(36, 95%, 54%)",
  notes: "hsl(215, 80%, 55%)",
  steps: "hsl(262, 60%, 55%)",
};

interface DetailOverviewTabProps {
  job: JobApplication;
  onUpdate: <K extends keyof JobApplication>(key: K, value: JobApplication[K]) => void;
}

const DetailOverviewTab = ({ job, onUpdate }: DetailOverviewTabProps) => {
  const addNextStep = () => {
    const step: NextStep = { id: crypto.randomUUID(), text: "", done: false };
    onUpdate("nextSteps", [...job.nextSteps, step]);
  };

  const updateNextStep = (id: string, field: keyof NextStep, value: string | boolean) => {
    onUpdate("nextSteps", job.nextSteps.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const removeNextStep = (id: string) => {
    onUpdate("nextSteps", job.nextSteps.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Description */}
      <section className="rounded-xl border border-border bg-card/50 p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: SECTION_ICON_COLORS.company + "20" }}>
            <FileText className="h-3.5 w-3.5" style={{ color: SECTION_ICON_COLORS.company }} />
          </div>
          <span className="text-sm font-semibold text-foreground">Description</span>
        </div>
        <InlineEdit
          value={job.description ?? ""}
          onChange={(v) => onUpdate("description", v || undefined)}
          placeholder="Add a description…"
          multiline
          maxLength={500}
          className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap"
        />
      </section>

      {/* Notes */}
      <section className="rounded-xl border border-border bg-card/50 p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: SECTION_ICON_COLORS.notes + "20" }}>
            <StickyNote className="h-3.5 w-3.5" style={{ color: SECTION_ICON_COLORS.notes }} />
          </div>
          <span className="text-sm font-semibold text-foreground">Notes</span>
        </div>
        <InlineEdit
          value={job.notes}
          onChange={(v) => onUpdate("notes", v)}
          placeholder="Add notes…"
          multiline
          className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap"
        />
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
        {job.nextSteps.map((step) => (
          <div key={step.id} className="flex items-center gap-2">
            <Checkbox checked={step.done} onCheckedChange={(v) => updateNextStep(step.id, "done", !!v)} />
            <InlineEdit
              value={step.text}
              onChange={(v) => updateNextStep(step.id, "text", v)}
              placeholder="What's next?"
              className={`flex-1 text-sm ${step.done ? "line-through text-muted-foreground" : "text-foreground"}`}
            />
            <Button variant="ghost" size="icon" onClick={() => removeNextStep(step.id)} className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {job.nextSteps.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No next steps</p>
        )}
      </section>

      {/* Activity Timeline */}
      <section className="rounded-xl border border-border bg-card/50 p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20">
            <Activity className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Activity</span>
        </div>
        <ActivityTimeline jobId={job.id} />
      </section>
    </div>
  );
};

export default DetailOverviewTab;
