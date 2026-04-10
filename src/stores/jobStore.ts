import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { JobApplication, Contact, NextStep, JobEvent } from "@/types/job";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

/* ── DB row → domain model ─────────────────────────────── */

const rowToJob = (row: Record<string, unknown>): JobApplication => ({
  id: row.id as string,
  company: row.company as string,
  role: row.role as string,
  columnId: row.column_id as string,
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

/* ── Store types ───────────────────────────────────────── */

interface UndoState {
  job: JobApplication;
  timeout: ReturnType<typeof setTimeout>;
}

interface JobStore {
  // State
  jobs: JobApplication[];
  loading: boolean;
  searchQuery: string;

  // Actions
  fetchJobs: (userId: string) => Promise<void>;
  addJob: (
    userId: string,
    company: string,
    role: string,
    columnId: string,
    applicationType?: string,
    extras?: {
      location?: string;
      description?: string;
      links?: string[];
      salary?: string;
      closeDate?: string;
    }
  ) => Promise<JobApplication | null>;
  updateJob: (job: JobApplication, userId?: string) => Promise<void>;
  deleteJob: (id: string) => Promise<{ undoFn: (() => void) | null }>;
  setJobs: (updater: JobApplication[] | ((prev: JobApplication[]) => JobApplication[])) => void;
  setSearchQuery: (q: string) => void;
}

export const useJobStore = create<JobStore>((set, get) => {
  let undoRef: UndoState | null = null;

  return {
    jobs: [],
    loading: true,
    searchQuery: "",

    fetchJobs: async (userId: string) => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading jobs:", error.message);
      } else if (data) {
        set({ jobs: data.map((r) => rowToJob(r as Record<string, unknown>)) });
      }
      set({ loading: false });
    },

    addJob: async (userId, company, role, columnId, applicationType = "Other", extras) => {
      const insertPayload: TablesInsert<"job_applications"> = {
        user_id: userId,
        company,
        role,
        column_id: columnId,
        application_type: applicationType,
        ...(extras?.location ? { location: extras.location } : {}),
        ...(extras?.description ? { description: extras.description } : {}),
        ...(extras?.links ? { links: extras.links } : {}),
        ...(extras?.salary ? { salary: extras.salary } : {}),
        ...(extras?.closeDate ? { close_date: extras.closeDate } : {}),
      };

      const { data, error } = await supabase
        .from("job_applications")
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error("Error adding job:", error.message);
        return null;
      }
      if (data) {
        const newJob = rowToJob(data as Record<string, unknown>);
        set((state) => ({ jobs: [...state.jobs, newJob] }));
        return newJob;
      }
      return null;
    },

    updateJob: async (job, userId) => {
      const oldJob = get().jobs.find((j) => j.id === job.id);
      set((state) => ({ jobs: state.jobs.map((j) => (j.id === job.id ? job : j)) }));

      const updatePayload: TablesUpdate<"job_applications"> = {
        company: job.company,
        role: job.role,
        column_id: job.columnId,
        notes: job.notes,
        contacts: job.contacts as unknown as TablesUpdate<"job_applications">["contacts"],
        next_steps: job.nextSteps as unknown as TablesUpdate<"job_applications">["next_steps"],
        links: job.links as unknown as TablesUpdate<"job_applications">["links"],
        application_type: job.applicationType,
        location: job.location ?? null,
        description: job.description ?? null,
        salary: job.salary ?? null,
        close_date: job.closeDate ?? null,
        events: job.events as unknown as TablesUpdate<"job_applications">["events"],
      };

      const { error } = await supabase
        .from("job_applications")
        .update(updatePayload)
        .eq("id", job.id);

      if (error) {
        console.error("Error saving:", error.message);
        // Re-fetch on error
        const { data } = await supabase
          .from("job_applications")
          .select("*")
          .order("created_at", { ascending: true });
        if (data) {
          set({ jobs: data.map((r) => rowToJob(r as Record<string, unknown>)) });
        }
      }

      // Log activity
      if (userId && oldJob) {
        const logs = diffActivityLogs(oldJob, job);
        if (logs.length > 0) {
          await supabase
            .from("job_activity_log")
            .insert(logs.map((l) => ({ job_id: job.id, user_id: userId, action: l.action, details: l.details })));
        }
      }
    },

    deleteJob: async (id) => {
      const jobToDelete = get().jobs.find((j) => j.id === id);
      if (!jobToDelete) return { undoFn: null };

      // Flush any pending undo
      if (undoRef) {
        clearTimeout(undoRef.timeout);
        supabase.from("job_applications").delete().eq("id", undoRef.job.id).then();
        undoRef = null;
      }

      set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) }));

      const timeout = setTimeout(async () => {
        const { error } = await supabase.from("job_applications").delete().eq("id", id);
        if (error) {
          console.error("Error deleting:", error.message);
          // Re-fetch on error
          const { data } = await supabase
            .from("job_applications")
            .select("*")
            .order("created_at", { ascending: true });
          if (data) {
            set({ jobs: data.map((r) => rowToJob(r as Record<string, unknown>)) });
          }
        }
        undoRef = null;
      }, 5000);

      undoRef = { job: jobToDelete, timeout };

      const undoFn = () => {
        if (undoRef && undoRef.job.id === id) {
          clearTimeout(undoRef.timeout);
          set((state) => ({ jobs: [...state.jobs, undoRef!.job] }));
          undoRef = null;
        }
      };

      return { undoFn };
    },

    setJobs: (updater) => {
      set((state) => ({
        jobs: typeof updater === "function" ? updater(state.jobs) : updater,
      }));
    },

    setSearchQuery: (q) => set({ searchQuery: q }),
  };
});
