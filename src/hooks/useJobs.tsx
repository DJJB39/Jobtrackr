import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { JobApplication, ColumnId, Contact, NextStep } from "@/types/job";
import { useToast } from "@/hooks/use-toast";

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
});

export const useJobs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

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

  const addJob = useCallback(async (company: string, role: string, columnId: ColumnId, applicationType: string = "Other") => {
    if (!user) return;
    const { data, error } = await supabase
      .from("job_applications")
      .insert({ user_id: user.id, company, role, column_id: columnId, application_type: applicationType })
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
      })
      .eq("id", job.id);

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
      fetchJobs();
    } else {
      toast({ title: "Application saved", description: "Changes saved successfully" });
    }
  }, [toast, fetchJobs]);

  const deleteJob = useCallback(async (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    const { error } = await supabase.from("job_applications").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
      fetchJobs();
    } else {
      toast({ title: "Application deleted", description: "The application has been removed" });
    }
  }, [toast, fetchJobs]);

  const setJobsLocal = useCallback((updater: React.SetStateAction<JobApplication[]>) => {
    setJobs(updater);
  }, []);

  return { jobs, setJobs: setJobsLocal, loading, addJob, updateJob, deleteJob };
};
