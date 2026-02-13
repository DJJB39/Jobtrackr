import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  ExternalLink,
  MapPin,
  DollarSign,
  Sparkles,
  FileText,
  Users,
  Link as LinkIcon,
} from "lucide-react";
import InlineEdit from "./InlineEdit";
import DetailOverviewTab from "./detail/DetailOverviewTab";
import DetailEventsTab from "./detail/DetailEventsTab";
import DetailLinksTab from "./detail/DetailLinksTab";
import type { JobApplication } from "@/types/job";
import { COLUMNS, APPLICATION_TYPES } from "@/types/job";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface JobDetailPanelProps {
  job: JobApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (job: JobApplication) => void;
  onOpenAI?: () => void;
}

const JobDetailPanel = ({ job, open, onOpenChange, onSave, onOpenAI }: JobDetailPanelProps) => {
  const [editedJob, setEditedJob] = useState<JobApplication | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const savedFadeRef = useRef<ReturnType<typeof setTimeout>>();
  const editedJobRef = useRef<JobApplication | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (job) {
      setEditedJob({ ...job });
      editedJobRef.current = { ...job };
      dirtyRef.current = false;
    }
  }, [job]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        if (editedJobRef.current && dirtyRef.current) {
          onSave(editedJobRef.current);
        }
      }
      if (savedFadeRef.current) clearTimeout(savedFadeRef.current);
    };
  }, [onSave]);

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
    editedJobRef.current = updated;
    dirtyRef.current = true;
    debouncedSave(updated);
  };

  const handleDirectSave = (updatedJob: JobApplication) => {
    setEditedJob(updatedJob);
    editedJobRef.current = updatedJob;
    onSave(updatedJob);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
        {/* Hero Header */}
        <SheetHeader className="sticky top-0 z-10 bg-gradient-to-r from-card to-secondary/30 backdrop-blur-sm border-b border-border px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1 min-w-0 flex-1">
              {/* Stage + save status */}
              <div className="flex items-center gap-2">
                {column && <div className={`h-2.5 w-2.5 rounded-full ${column.colorClass}`} />}
                <Select value={editedJob.columnId} onValueChange={(v) => update("columnId", v as JobApplication["columnId"])}>
                  <SelectTrigger className="h-6 w-auto border-none bg-transparent p-0 text-xs font-medium uppercase tracking-wider text-muted-foreground shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((col) => (
                      <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {saveStatus !== "idle" && (
                  <span className={`text-[10px] font-medium transition-opacity ${saveStatus === "saving" ? "text-muted-foreground animate-pulse" : "text-emerald-500"}`}>
                    {saveStatus === "saving" ? "Saving…" : "Saved"}
                  </span>
                )}
              </div>

              {/* Company - inline editable */}
              <SheetTitle className="text-2xl font-bold text-foreground p-0">
                <InlineEdit
                  value={editedJob.company}
                  onChange={(v) => update("company", v)}
                  placeholder="Company name"
                  className="text-2xl font-bold text-foreground"
                />
              </SheetTitle>

              {/* Role - inline editable */}
              <SheetDescription className="text-lg text-muted-foreground p-0 m-0">
                <InlineEdit
                  value={editedJob.role}
                  onChange={(v) => update("role", v)}
                  placeholder="Job title"
                  className="text-lg text-muted-foreground"
                />
              </SheetDescription>

              {/* Salary + Location - inline editable */}
              <div className="flex items-center gap-3 flex-wrap pt-1">
                <span className="inline-flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-primary" />
                  <InlineEdit
                    value={editedJob.salary ?? ""}
                    onChange={(v) => update("salary", v || undefined)}
                    placeholder="Salary"
                    className="text-sm font-semibold font-mono text-primary"
                  />
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  <InlineEdit
                    value={editedJob.location ?? ""}
                    onChange={(v) => update("location", v || undefined)}
                    placeholder="Location"
                    className="text-sm text-muted-foreground"
                  />
                </span>
              </div>

              {/* Applied date */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                <CalendarDays className="h-3 w-3" />
                <span>Applied {format(new Date(editedJob.createdAt), "PPP")}</span>
              </div>
            </div>

            {/* AI button */}
            <div className="flex items-center gap-1 shrink-0 ml-3">
              {onOpenAI && (
                <Button variant="ghost" size="sm" onClick={onOpenAI} className="gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> AI
                </Button>
              )}
            </div>
          </div>

          {/* View posting link */}
          {editedJob.links?.[0] && (
            <a
              href={editedJob.links[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-2"
            >
              <ExternalLink className="h-3 w-3" /> View Original Posting
            </a>
          )}
        </SheetHeader>

        {/* Tabbed body */}
        <div className="px-6 py-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="overview" className="text-xs gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="events" className="text-xs gap-1.5">
                <Users className="h-3.5 w-3.5" /> Events
              </TabsTrigger>
              <TabsTrigger value="links" className="text-xs gap-1.5">
                <LinkIcon className="h-3.5 w-3.5" /> Links
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <DetailOverviewTab job={editedJob} onUpdate={update} />
            </TabsContent>
            <TabsContent value="events">
              <DetailEventsTab job={editedJob} onUpdate={update} onSave={handleDirectSave} />
            </TabsContent>
            <TabsContent value="links">
              <DetailLinksTab job={editedJob} onUpdate={update} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default JobDetailPanel;
