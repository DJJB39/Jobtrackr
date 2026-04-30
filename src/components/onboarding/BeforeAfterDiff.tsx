import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Pencil, Sparkles } from "lucide-react";
import type { CVCleanupSection } from "@/hooks/useUserCV";

interface Props {
  section: CVCleanupSection & { accepted: boolean };
  onChange: (next: CVCleanupSection & { accepted: boolean }) => void;
}

const BeforeAfterDiff = ({ section, onChange }: Props) => {
  const [editing, setEditing] = useState(false);

  return (
    <div className={`rounded-xl border p-4 transition-colors ${section.accepted ? "border-primary/40 bg-primary/5" : "border-border/50 bg-card/40"}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{section.type}</p>
          <p className="text-sm font-medium text-foreground truncate">{section.label}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button size="sm" variant={section.accepted ? "default" : "outline"} className="h-8 gap-1.5" onClick={() => onChange({ ...section, accepted: !section.accepted })}>
            {section.accepted ? <><Check className="h-3.5 w-3.5" /> Accepted</> : <><X className="h-3.5 w-3.5" /> Rejected</>}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing((v) => !v)} aria-label="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Before</p>
          <p className="rounded-lg border border-border/40 bg-secondary/20 p-3 text-xs text-muted-foreground line-through">{section.before}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" /> After</p>
          {editing ? (
            <Textarea value={section.after} onChange={(e) => onChange({ ...section, after: e.target.value })} rows={3} className="text-xs" autoFocus />
          ) : (
            <p className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-foreground">{section.after}</p>
          )}
        </div>
      </div>

      {section.reason && (
        <p className="mt-2 text-[11px] text-muted-foreground">Why: {section.reason}</p>
      )}
    </div>
  );
};

export default BeforeAfterDiff;
