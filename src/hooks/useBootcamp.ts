import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { JobApplication } from "@/types/job";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;

export interface BootcampData {
  company_snapshot: {
    why_join: string;
    location_details: string;
    recent_news: string;
    product_context: string;
  };
  logistics: {
    commute_estimate: string;
    cost_estimate: string;
    time_advice: string;
  };
  schedule: Array<{
    time: string;
    activity: string;
    duration_min: number;
    focus_area: string;
  }>;
  questions: Array<{
    question: string;
    type: "behavioral" | "company_specific";
    context_note: string;
  }>;
  summary_markdown: string;
  model: string;
}

export const useBootcamp = (preferredModel?: string, onUsageIncrement?: () => void) => {
  const { session, user } = useAuth();
  const { toast } = useToast();

  const [bootcampData, setBootcampData] = useState<BootcampData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    if (session?.access_token) return session.access_token;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, [session]);

  const generateBootcamp = useCallback(
    async (job: JobApplication, userLocation?: string) => {
      const token = await getToken();
      if (!token) {
        toast({ title: "Please log in", variant: "destructive" });
        return null;
      }

      setLoading(true);
      setBootcampData(null);

      const model = preferredModel || "google/gemini-3-flash-preview";

      try {
        const resp = await fetch(AI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mode: "day_before_bootcamp",
            model,
            job: {
              id: job.id,
              company: job.company,
              role: job.role,
              salary: job.salary,
              location: job.location,
              description: job.description,
              notes: job.notes,
            },
            cvText: user ? localStorage.getItem(`cv-text-${user.id}`) : null,
            userLocation: userLocation || undefined,
          }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Failed" }));
          toast({
            title: err.code === "LIMIT_REACHED" ? "Monthly AI limit reached" : "Bootcamp generation failed",
            description: err.error,
            variant: "destructive",
          });
          setLoading(false);
          return null;
        }

        const data: BootcampData = await resp.json();
        setBootcampData(data);
        onUsageIncrement?.();

        // Save as interview_sessions with mode "bootcamp"
        if (user) {
          const { data: sess } = await supabase
            .from("interview_sessions")
            .insert({
              user_id: user.id,
              job_id: job.id,
              mode: "bootcamp",
              model,
              questions: JSON.stringify(data.questions?.map((q) => q.question) || []),
              status: "completed",
              overall_feedback: data.summary_markdown,
              completed_at: new Date().toISOString(),
            } as never)
            .select("id")
            .single();
          if (sess) setSessionId(sess.id);
        }

        setLoading(false);
        return data;
      } catch {
        toast({ title: "Error generating bootcamp", variant: "destructive" });
        setLoading(false);
        return null;
      }
    },
    [getToken, preferredModel, user, toast, onUsageIncrement]
  );

  const reset = useCallback(() => {
    setBootcampData(null);
    setLoading(false);
    setSessionId(null);
  }, []);

  return {
    bootcampData,
    loading,
    sessionId,
    generateBootcamp,
    reset,
  };
};
