import { useState, useCallback, useEffect } from "react";
import { useSSEStream } from "./useSSEStream";
import { useToast } from "./use-toast";
import { useAuth } from "./useAuth";
import type { JobApplication } from "@/types/job";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;

export type GenMode = "cover_letter" | "interview_prep" | "summarize";

export const useAIGeneration = (cvText: string | null, activeJobs: JobApplication[]) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const { content: genContent, loading: genLoading, stream, reset } = useSSEStream();
  const [genOpen, setGenOpen] = useState(false);
  const [genMode, setGenMode] = useState<GenMode | null>(null);
  const [genJobId, setGenJobId] = useState<string | null>(null);

  // Pre-select most recent job
  const sortedActiveJobs = [...activeJobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  useEffect(() => {
    if (!genJobId && sortedActiveJobs.length > 0) {
      setGenJobId(sortedActiveJobs[0].id);
    }
  }, [sortedActiveJobs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const startGeneration = useCallback(
    async (mode: GenMode) => {
      if (!cvText || !genJobId) return;
      const job = activeJobs.find((j) => j.id === genJobId);
      if (!job) return;
      if (!session?.access_token) {
        toast({ title: "Please log in", variant: "destructive" });
        return;
      }

      setGenMode(mode);

      await stream(
        AI_URL,
        {
          mode,
          job: {
            company: job.company,
            role: job.role,
            salary: job.salary,
            location: job.location,
            description: job.description,
            notes: job.notes,
          },
          cvText,
        },
        session.access_token,
        (msg) => toast({ title: "Generation failed", description: msg, variant: "destructive" })
      );
    },
    [cvText, genJobId, activeJobs, session, toast, stream]
  );

  const copyGenContent = useCallback(() => {
    navigator.clipboard.writeText(genContent);
    toast({ title: "Copied to clipboard" });
  }, [genContent, toast]);

  return {
    genOpen,
    setGenOpen,
    genMode,
    genJobId,
    setGenJobId,
    genContent,
    genLoading,
    sortedActiveJobs,
    startGeneration,
    copyGenContent,
    resetGeneration: reset,
  };
};
