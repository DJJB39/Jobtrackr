import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { JobApplication, ColumnId, Contact, NextStep, JobEvent } from "@/types/job";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

/* ── DB row → domain model ─────────────────────────────── */

const rowToJob = (row: Record<string, unknown>): JobApplication => ({
  id: row.id as string,
  company: row.company as string,
  role: row.role as string,
  columnId: row.column_id as ColumnId,
  createdAt: row.created_at as string,
  notes: (row.notes as string) ?? "",
  contacts: (row.contacts ?? []) as Contact[],
  nextSteps: (row.next_steps ?? []) as NextStep[],
  links: (row.links ?? []) as string[],
  applicationType: (row.application_type as string) ?? "Other",
  location: (row.location as string) ?? undefined,
  description: (row.description as string) ?? undefined,
  salary: (row.salary as string) ?? undefined,
  closeDate: (row.close_date as string) ?? undefined,
  events: (row.events ?? []) as JobEvent[],
});

/* ── Activity diff helper ──────────────────────────────── */

function diffActivityLogs(
  oldJob: JobApplication,
  newJob: JobApplication
): { action: string; details: Record<string, string> }[] {
  const logs: { action: string; details: Record<string, string> }[] = [];
  if (oldJob.columnId !== newJob.columnId) {
    logs.push({ action: "stage_change", details: { from: oldJob.columnId, to: newJob.columnId } });
  }
  if (oldJob.notes !== newJob.notes) {
    logs.push({ action: "notes_edited", details: {} });
  }
  if (oldJob.contacts.length !== newJob.contacts.length) {
    logs.push({
      action: oldJob.contacts.length < newJob.contacts.length ? "contact_added" : "contact_removed",
      details: {},
    });
  }
  if ((oldJob.events?.length ?? 0) !== (newJob.events?.length ?? 0)) {
    logs.push({
      action: (oldJob.events?.length ?? 0) < (newJob.events?.length ?? 0) ? "event_added" : "event_removed",
      details: {},
    });
  }
  if (oldJob.links.length !== newJob.links.length) {
    logs.push({ action: "link_changed", details: {} });
  }
  return logs;
}

/* ── Main hook ─────────────────────────────────────────── */

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
    } else if (data) {
      setJobs(data.map((r) => rowToJob(r as Record<string, unknown>)));
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  /* ── Add ───────────────────────────────────────────── */

  const addJob = useCallback(
    async (
      company: string,
      role: string,
      columnId: ColumnId,
      applicationType = "Other",
      extras?: {
        location?: string;
        description?: string;
        links?: string[];
        salary?: string;
        closeDate?: string;
      }
    ) => {
      if (!user) return;

      const insertPayload: Record<string, unknown> = {
        user_id: user.id,
        company,
        role,
        column_id: columnId,
        application_type: applicationType,
      };
      if (extras?.location) insertPayload.location = extras.location;
      if (extras?.description) insertPayload.description = extras.description;
      if (extras?.links) insertPayload.links = extras.links;
      if (extras?.salary) insertPayload.salary = extras.salary;
      if (extras?.closeDate) insertPayload.close_date = extras.closeDate;

      const { data, error } = await supabase
        .from("job_applications")
        .insert(insertPayload as never)
        .select()
        .single();

      if (error) {
        toast({ title: "Error adding job", description: error.message, variant: "destructive" });
      } else if (data) {
        setJobs((prev) => [...prev, rowToJob(data as Record<string, unknown>)]);
        toast({ title: "Application added", description: `${company} — ${role} has been added` });
      }
    },
    [user, toast]
  );

  /* ── Update ────────────────────────────────────────── */

  const updateJob = useCallback(
    async (job: JobApplication) => {
      const oldJob = jobs.find((j) => j.id === job.id);
      setJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));

      const updatePayload: Record<string, unknown> = {
        company: job.company,
        role: job.role,
        column_id: job.columnId,
        notes: job.notes,
        contacts: job.contacts,
        next_steps: job.nextSteps,
        links: job.links,
        application_type: job.applicationType,
        location: job.location ?? null,
        description: job.description ?? null,
        salary: job.salary ?? null,
        close_date: job.closeDate ?? null,
        events: job.events,
      };

      const { error } = await supabase
        .from("job_applications")
        .update(updatePayload as never)
        .eq("id", job.id);

      if (error) {
        toast({ title: "Error saving", description: error.message, variant: "destructive" });
        fetchJobs();
      }

      // Log activity
      if (user && oldJob) {
        const logs = diffActivityLogs(oldJob, job);
        if (logs.length > 0) {
          await supabase
            .from("job_activity_log")
            .insert(logs.map((l) => ({ job_id: job.id, user_id: user.id, action: l.action, details: l.details })));
        }
      }
    },
    [jobs, user, toast, fetchJobs]
  );

  /* ── Delete with undo ──────────────────────────────── */

  const deleteJob = useCallback(
    async (id: string) => {
      const jobToDelete = jobs.find((j) => j.id === id);
      if (!jobToDelete) return;

      // Flush any pending undo
      if (undoRef.current) {
        clearTimeout(undoRef.current.timeout);
        supabase.from("job_applications").delete().eq("id", undoRef.current.job.id).then();
        undoRef.current = null;
      }

      setJobs((prev) => prev.filter((j) => j.id !== id));

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
    },
    [jobs, toast, fetchJobs]
  );

  /* ── Local setter ──────────────────────────────────── */

  const setJobsLocal = useCallback((updater: React.SetStateAction<JobApplication[]>) => {
    setJobs(updater);
  }, []);

  return { jobs, setJobs: setJobsLocal, loading, addJob, updateJob, deleteJob };
};
