import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { JobApplication, ColumnId, Contact, NextStep } from "@/types/job";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface DbRow {
  id: string;
  user_id: string;
  company: string;
  role: string;
  column_id: string;
  notes: string;
  contacts: any;
  next_steps: any;
  links: any;
  application_type: string;
  created_at: string;
  updated_at: string;
}

const rowToJob = (row: DbRow): JobApplication => ({
  id: row.id,
  company: row.company,
  role: row.role,
  columnId: row.column_id as ColumnId,
  createdAt: row.created_at,
  notes: row.notes ?? "",
  contacts: (row.contacts ?? []) as Contact[],
  nextSteps: (row.next_steps ?? []) as NextStep[],
  links: (row.links ?? []) as string[],
  applicationType: row.application_type ?? "Other",
  location: (row as any).location ?? undefined,
  description: (row as any).description ?? undefined,
  salary: (row as any).salary ?? undefined,
  closeDate: (row as any).close_date ?? undefined,
  events: (row as any).events ?? [],
});

export const useJobs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const undoRef = useRef<{ job: JobApplication; timeout: ReturnType<typeof setTimeout> } | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Error loading jobs", description: error.message, variant: "destructive" });
    } else {
      setJobs((data as DbRow[]).map(rowToJob));
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const addJob = useCallback(async (
    company: string,
    role: string,
    columnId: ColumnId,
    applicationType: string = "Other",
    extras?: { location?: string; description?: string; links?: string[]; salary?: string; closeDate?: string }
  ) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("job_applications")
      .insert({
        user_id: user.id,
        company,
        role,
        column_id: columnId,
        application_type: applicationType,
        ...(extras?.location ? { location: extras.location } : {}),
        ...(extras?.description ? { description: extras.description } : {}),
        ...(extras?.links ? { links: extras.links } : {}),
        ...(extras?.salary ? { salary: extras.salary } : {}),
        ...(extras?.closeDate ? { close_date: extras.closeDate } : {}),
      } as any)
      .select()
      .single();

    if (error) {
      toast({ title: "Error adding job", description: error.message, variant: "destructive" });
    } else {
      setJobs((prev) => [...prev, rowToJob(data as DbRow)]);
      toast({ title: "Application added", description: `${company} — ${role} has been added` });
    }
  }, [user, toast]);

  const updateJob = useCallback(async (job: JobApplication) => {
    const oldJob = jobs.find((j) => j.id === job.id);
    setJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));

    const { error } = await supabase
      .from("job_applications")
      .update({
        company: job.company,
        role: job.role,
        column_id: job.columnId,
        notes: job.notes,
        contacts: job.contacts as any,
        next_steps: job.nextSteps as any,
        links: job.links as any,
        application_type: job.applicationType,
        location: job.location ?? null,
        description: job.description ?? null,
        salary: job.salary ?? null,
        close_date: job.closeDate ?? null,
        events: job.events as any,
        resume_url: (job as any).resumeUrl ?? null,
        ats_score: (job as any).atsScore ?? null,
      } as any)
      .eq("id", job.id);

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
      fetchJobs();
    }

    // Log activity changes
    if (user && oldJob) {
      const logs: { action: string; details: any }[] = [];
      if (oldJob.columnId !== job.columnId) {
        logs.push({ action: "stage_change", details: { from: oldJob.columnId, to: job.columnId } });
      }
      if (oldJob.notes !== job.notes) {
        logs.push({ action: "notes_edited", details: {} });
      }
      if (oldJob.contacts.length !== job.contacts.length) {
        logs.push({ action: oldJob.contacts.length < job.contacts.length ? "contact_added" : "contact_removed", details: {} });
      }
      if ((oldJob.events?.length ?? 0) !== (job.events?.length ?? 0)) {
        logs.push({ action: (oldJob.events?.length ?? 0) < (job.events?.length ?? 0) ? "event_added" : "event_removed", details: {} });
      }
      if (oldJob.links.length !== job.links.length) {
        logs.push({ action: "link_changed", details: {} });
      }
      if (logs.length > 0) {
        await supabase.from("job_activity_log").insert(
          logs.map((l) => ({ job_id: job.id, user_id: user.id, action: l.action, details: l.details }))
        );
      }
    }
  }, [jobs, user, toast, fetchJobs]);

  const deleteJob = useCallback(async (id: string) => {
    const jobToDelete = jobs.find((j) => j.id === id);
    if (!jobToDelete) return;

    // Cancel any previous pending delete
    if (undoRef.current) {
      clearTimeout(undoRef.current.timeout);
      // Execute the previous pending delete immediately
      const prev = undoRef.current.job;
      supabase.from("job_applications").delete().eq("id", prev.id).then();
      undoRef.current = null;
    }

    // Optimistically remove from UI
    setJobs((prev) => prev.filter((j) => j.id !== id));

    // Set up undo window
    const timeout = setTimeout(async () => {
      const { error } = await supabase.from("job_applications").delete().eq("id", id);
      if (error) {
        toast({ title: "Error deleting", description: error.message, variant: "destructive" });
        fetchJobs();
      }
      undoRef.current = null;
    }, 5000);

    undoRef.current = { job: jobToDelete, timeout };

    toast({
      title: "Application deleted",
      description: `${jobToDelete.company} — ${jobToDelete.role}`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (undoRef.current && undoRef.current.job.id === id) {
              clearTimeout(undoRef.current.timeout);
              setJobs((prev) => [...prev, undoRef.current!.job]);
              undoRef.current = null;
              toast({ title: "Undo successful", description: "Application restored" });
            }
          }}
        >
          Undo
        </Button>
      ),
    });
  }, [jobs, toast, fetchJobs]);

  const setJobsLocal = useCallback((updater: React.SetStateAction<JobApplication[]>) => {
    setJobs(updater);
  }, []);

  return { jobs, setJobs: setJobsLocal, loading, addJob, updateJob, deleteJob };
};
