import { useState, useEffect, useCallback } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Briefcase, LayoutDashboard, Columns3, CalendarDays, Download, Plus, List } from "lucide-react";
import type { JobApplication } from "@/types/job";
import { useStages } from "@/hooks/useStages";

interface CommandPaletteProps {
  jobs: JobApplication[];
  onSelectJob: (job: JobApplication) => void;
  onSwitchView: (view: "board" | "dashboard" | "calendar" | "list") => void;
  onAddJob: () => void;
  onExport: () => void;
}

const CommandPalette = ({ jobs, onSelectJob, onSwitchView, onAddJob, onExport }: CommandPaletteProps) => {
  const { stages } = useStages();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const stageMap = Object.fromEntries(stages.map((c) => [c.id, c.title]));

  const handleSelectJob = useCallback((job: JobApplication) => {
    onSelectJob(job);
    setOpen(false);
  }, [onSelectJob]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search jobs, actions… (⌘K)" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => { onAddJob(); setOpen(false); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Application
          </CommandItem>
          <CommandItem onSelect={() => { onSwitchView("board"); setOpen(false); }}>
            <Columns3 className="mr-2 h-4 w-4" />
            Switch to Board
          </CommandItem>
          <CommandItem onSelect={() => { onSwitchView("dashboard"); setOpen(false); }}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Switch to Dashboard
          </CommandItem>
          <CommandItem onSelect={() => { onSwitchView("calendar"); setOpen(false); }}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Switch to Calendar
          </CommandItem>
          <CommandItem onSelect={() => { onSwitchView("list"); setOpen(false); }}>
            <List className="mr-2 h-4 w-4" />
            Switch to List
          </CommandItem>
          <CommandItem onSelect={() => { onExport(); setOpen(false); }}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </CommandItem>
        </CommandGroup>

        {jobs.length > 0 && (
          <CommandGroup heading="Applications">
            {jobs.map((job) => (
              <CommandItem key={job.id} value={[job.company, job.role, job.notes, job.description, job.location, job.salary].filter(Boolean).join(" ")} onSelect={() => handleSelectJob(job)}>
                <Briefcase className="mr-2 h-4 w-4 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate font-medium">{job.company} — {job.role}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {stageMap[job.columnId]} {job.location ? `· ${job.location}` : ""}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
