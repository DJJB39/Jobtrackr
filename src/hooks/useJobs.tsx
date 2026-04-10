/**
 * Legacy hook — wraps the Zustand jobStore for backward compatibility.
 * New code should use `useJobStore` directly from `@/stores/jobStore`.
 */
import { useEffect, useCallback } from "react";
import { useJobStore } from "@/stores/jobStore";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import type { JobApplication, ColumnId } from "@/types/job";

export const useJobs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const store = useJobStore();

  useEffect(() => {
    if (user) store.fetchJobs(user.id);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const result = await store.addJob(user.id, company, role, columnId, applicationType, extras);
      if (result) {
        toast({ title: "Application added", description: `${company} — ${role} has been added` });
      } else {
        toast({ title: "Error adding job", variant: "destructive" });
      }
    },
    [user, store, toast]
  );

  const updateJob = useCallback(
    async (job: JobApplication) => {
      await store.updateJob(job, user?.id);
    },
    [store, user]
  );

  const deleteJob = useCallback(
    async (id: string) => {
      const jobToDelete = store.jobs.find((j) => j.id === id);
      const { undoFn } = await store.deleteJob(id);
      toast({
        title: "Application deleted",
        description: jobToDelete ? `${jobToDelete.company} — ${jobToDelete.role}` : undefined,
        action: undoFn ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              undoFn();
              toast({ title: "Undo successful", description: "Application restored" });
            }}
          >
            Undo
          </Button>
        ) : undefined,
      });
    },
    [store, toast]
  );

  return {
    jobs: store.jobs,
    setJobs: store.setJobs,
    loading: store.loading,
    addJob,
    updateJob,
    deleteJob,
  };
};
