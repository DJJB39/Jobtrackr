import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Link as LinkIcon, Loader2, DollarSign, CalendarDays, Undo2 } from "lucide-react";
import { COLUMNS, APPLICATION_TYPES, type ColumnId } from "@/types/job";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddJobDialogProps {
  onAdd: (
    company: string,
    role: string,
    columnId: ColumnId,
    applicationType: string,
    extras?: { location?: string; description?: string; links?: string[]; salary?: string; closeDate?: string }
  ) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AddJobDialog = ({ onAdd, open: externalOpen, onOpenChange: externalOnOpenChange }: AddJobDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [columnId, setColumnId] = useState<ColumnId>("found");
  const [applicationType, setApplicationType] = useState("Other");
  const [jobUrl, setJobUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchedLocation, setFetchedLocation] = useState("");
  const [fetchedDescription, setFetchedDescription] = useState("");
  const [fetchedSalary, setFetchedSalary] = useState("");
  const [fetchedCloseDate, setFetchedCloseDate] = useState("");
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const companyRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedUrl = useRef("");

  const handleFetch = async (urlOverride?: string) => {
    const targetUrl = (urlOverride ?? jobUrl).trim();
    if (!targetUrl || fetching) return;
    lastFetchedUrl.current = targetUrl;
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-job-url", {
        body: { url: targetUrl },
      });
      if (error || !data?.success) {
        toast({ title: "Couldn't fetch details", description: "Enter manually", variant: "destructive" });
        return;
      }
      const d = data.data;
      const filled = new Set<string>();
      if (d.company && !company) { setCompany(d.company); filled.add("company"); }
      if (d.title && !role) { setRole(d.title); filled.add("role"); }
      if (d.location) { setFetchedLocation(d.location); filled.add("location"); }
      if (d.description) { setFetchedDescription(d.description); filled.add("description"); }
      if (d.salary) { setFetchedSalary(d.salary); filled.add("salary"); }
      if (d.close_date) { setFetchedCloseDate(d.close_date); filled.add("closeDate"); }
      setAutoFilled(filled);

      if (data.partial) {
        toast({ title: "Partial data loaded", description: data.hint || "Review and complete manually" });
      } else {
        toast({ title: "Job details loaded!", description: d.salary ? "Salary info found" : undefined });
      }

      setTimeout(() => {
        if (!d.company && !company) companyRef.current?.focus();
        else if (!d.title && !role) roleRef.current?.focus();
      }, 100);
    } catch {
      toast({ title: "Couldn't fetch details", description: "Enter manually", variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  const triggerDebouncedFetch = (url: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleFetch(url), 600);
  };

  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted) triggerDebouncedFetch(pasted);
  };

  const handleUrlBlur = () => {
    const url = jobUrl.trim();
    if (url && url !== lastFetchedUrl.current && !fetching) {
      triggerDebouncedFetch(url);
    }
  };

  const undoAutoFill = () => {
    setCompany("");
    setRole("");
    setFetchedLocation("");
    setFetchedDescription("");
    setFetchedSalary("");
    setFetchedCloseDate("");
    setAutoFilled(new Set());
  };

  const clearAutoFill = (field: string) => {
    setAutoFilled((prev) => { const s = new Set(prev); s.delete(field); return s; });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    const links = jobUrl.trim() ? [jobUrl.trim()] : undefined;
    onAdd(company.trim(), role.trim(), columnId, applicationType, {
      location: fetchedLocation || undefined,
      description: fetchedDescription || undefined,
      links,
      salary: fetchedSalary || undefined,
      closeDate: fetchedCloseDate || undefined,
    });
    setCompany("");
    setRole("");
    setColumnId("found");
    setApplicationType("Other");
    setJobUrl("");
    setFetchedLocation("");
    setFetchedDescription("");
    setFetchedSalary("");
    setFetchedCloseDate("");
    setAutoFilled(new Set());
    lastFetchedUrl.current = "";
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {externalOpen === undefined && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Application
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Job Application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Job URL */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5" /> Job Posting URL
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://..."
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                onPaste={handleUrlPaste}
                onBlur={handleUrlBlur}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleFetch()}
                disabled={fetching || !jobUrl.trim()}
                className="shrink-0"
              >
                {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
              </Button>
            </div>
            {autoFilled.size > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={undoAutoFill} className="h-7 gap-1.5 text-xs text-muted-foreground">
                <Undo2 className="h-3 w-3" /> Undo Auto-Fill
              </Button>
            )}
          </div>

          {/* Company */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="company">Company</Label>
              {autoFilled.has("company") && (
                <span className="text-[10px] text-muted-foreground">Auto-filled</span>
              )}
            </div>
            <Input
              id="company"
              ref={companyRef}
              placeholder="e.g. Google"
              value={company}
              onChange={(e) => { setCompany(e.target.value); clearAutoFill("company"); }}
              autoFocus
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="role">Role</Label>
              {autoFilled.has("role") && (
                <span className="text-[10px] text-muted-foreground">Auto-filled</span>
              )}
            </div>
            <Input
              id="role"
              ref={roleRef}
              placeholder="e.g. Senior Frontend Engineer"
              value={role}
              onChange={(e) => { setRole(e.target.value); clearAutoFill("role"); }}
            />
          </div>

          {/* Stage */}
          <div className="space-y-2">
            <Label>Stage</Label>
            <Select value={columnId} onValueChange={(v) => setColumnId(v as ColumnId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLUMNS.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Application Type */}
          <div className="space-y-2">
            <Label>Application Type</Label>
            <Select value={applicationType} onValueChange={setApplicationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPLICATION_TYPES.filter((t) => t !== "All").map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Salary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" /> Salary / Range
              </Label>
              {autoFilled.has("salary") && (
                <span className="text-[10px] text-muted-foreground">Auto-filled</span>
              )}
            </div>
            <Input
              placeholder="e.g. $120k-$150k"
              value={fetchedSalary}
              onChange={(e) => { setFetchedSalary(e.target.value); clearAutoFill("salary"); }}
            />
          </div>

          {/* Application Deadline */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" /> Application Deadline
              </Label>
              {autoFilled.has("closeDate") && (
                <span className="text-[10px] text-muted-foreground">Auto-filled</span>
              )}
            </div>
            <Input
              type="date"
              value={fetchedCloseDate}
              onChange={(e) => { setFetchedCloseDate(e.target.value); clearAutoFill("closeDate"); }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!company.trim() || !role.trim()}>
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddJobDialog;
