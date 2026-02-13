import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ExternalLink, FileText } from "lucide-react";
import { Link as LinkIcon } from "lucide-react";
import InlineEdit from "@/components/InlineEdit";
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
  const addLink = () => {
    onUpdate("links", [...job.links, ""]);
  };

  const updateLink = (index: number, value: string) => {
    const updated = [...job.links];
    updated[index] = value;
    onUpdate("links", updated);
  };

  const removeLink = (index: number) => {
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
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder="https://..."
              value={link}
              onChange={(e) => updateLink(i, e.target.value)}
              className="h-8 flex-1 text-sm"
            />
            {link && (
              <a href={link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground shrink-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <Button variant="ghost" size="icon" onClick={() => removeLink(i)} className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
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

export default DetailLinksTab;
