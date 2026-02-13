import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ExternalLink, FileText } from "lucide-react";
import { Link as LinkIcon } from "lucide-react";
import ResumeAnalysis from "@/components/ResumeAnalysis";
import type { JobApplication } from "@/types/job";

const SECTION_ICON_COLORS = {
  links: "hsl(190, 75%, 42%)",
};

interface DetailLinksTabProps {
  job: JobApplication;
  onUpdate: <K extends keyof JobApplication>(key: K, value: JobApplication[K]) => void;
}

const DetailLinksTab = ({ job, onUpdate }: DetailLinksTabProps) => {
  const debounceRefs = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const addLink = () => {
    onUpdate("links", [...job.links, ""]);
  };

  const updateLink = useCallback(
    (index: number, value: string) => {
      // Update local display immediately via parent
      const updated = [...job.links];
      updated[index] = value;
      // Debounce the save — clear previous timer for this index
      if (debounceRefs.current[index]) clearTimeout(debounceRefs.current[index]);
      debounceRefs.current[index] = setTimeout(() => {
        onUpdate("links", updated);
        delete debounceRefs.current[index];
      }, 500);
    },
    [job.links, onUpdate]
  );

  const removeLink = (index: number) => {
    if (debounceRefs.current[index]) {
      clearTimeout(debounceRefs.current[index]);
      delete debounceRefs.current[index];
    }
    onUpdate("links", job.links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
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
        {job.links.map((link, i) => (
          <LinkRow key={i} index={i} link={link} onChange={updateLink} onRemove={removeLink} />
        ))}
        {job.links.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No links yet</p>
        )}
      </section>

      {/* Resume ATS Analysis */}
      <section className="rounded-xl border border-border bg-card/50 p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: "hsl(262, 60%, 55%, 0.2)" }}>
            <FileText className="h-3.5 w-3.5" style={{ color: "hsl(262, 60%, 55%)" }} />
          </div>
          <span className="text-sm font-semibold text-foreground">Resume ATS Match</span>
        </div>
        <ResumeAnalysis
          jobDescription={job.description}
          company={job.company}
          role={job.role}
        />
      </section>
    </div>
  );
};

/* ── Uncontrolled link row to avoid cursor jumps ─────── */

const LinkRow = ({
  index,
  link,
  onChange,
  onRemove,
}: {
  index: number;
  link: string;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}) => {
  const [draft, setDraft] = useState(link);
  const committed = useRef(link);

  // Sync when parent link changes (e.g. undo)
  if (link !== committed.current) {
    committed.current = link;
    // Don't call setDraft during render — use effect instead
  }

  const handleChange = (value: string) => {
    setDraft(value);
    onChange(index, value);
  };

  const handleBlur = () => {
    committed.current = draft;
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="https://..."
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className="h-8 flex-1 text-sm"
      />
      {draft && (
        <a href={draft} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground shrink-0">
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      <Button variant="ghost" size="icon" onClick={() => onRemove(index)} className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive">
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default DetailLinksTab;
