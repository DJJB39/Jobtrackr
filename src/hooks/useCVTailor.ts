import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { JobApplication } from "@/types/job";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;

export interface TailoredSection {
  section_name: string;
  original: string;
  tailored: string;
  change_explanation: string;
  risk_note: string;
}

export interface CVTailorResult {
  tailored_sections: TailoredSection[];
  keywords_matched: string[];
  keywords_missing: string[];
  overall_match_before: number;
  overall_match_after: number;
  honesty_warning: string;
  summary_markdown: string;
  model: string;
}

export const useCVTailor = (preferredModel?: string, onUsageIncrement?: () => void) => {
  const { session, user } = useAuth();
  const { toast } = useToast();

  const [result, setResult] = useState<CVTailorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedSections, setAcceptedSections] = useState<Set<number>>(new Set());

  const getToken = useCallback(async () => {
    if (session?.access_token) return session.access_token;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, [session]);

  const tailorCV = useCallback(
    async (job: JobApplication) => {
      const token = await getToken();
      if (!token) {
        toast({ title: "Please log in", variant: "destructive" });
        return null;
      }

      const cvText = user ? localStorage.getItem(`cv-text-${user.id}`) : null;
      if (!cvText) {
        toast({ title: "No CV found", description: "Upload your CV in the CV tab first", variant: "destructive" });
        return null;
      }

      if (!job.description) {
        toast({ title: "No job description", description: "Add a job description to tailor your CV against", variant: "destructive" });
        return null;
      }

      setLoading(true);
      setResult(null);
      setAcceptedSections(new Set());

      const model = preferredModel || "google/gemini-3-flash-preview";

      try {
        const resp = await fetch(AI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mode: "tailor_cv",
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
            cvText,
          }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Failed" }));
          toast({
            title: err.code === "LIMIT_REACHED" ? "Monthly AI limit reached" : "CV tailoring failed",
            description: err.error,
            variant: "destructive",
          });
          setLoading(false);
          return null;
        }

        const data: CVTailorResult = await resp.json();
        setResult(data);
        onUsageIncrement?.();
        setLoading(false);
        return data;
      } catch {
        toast({ title: "Error tailoring CV", variant: "destructive" });
        setLoading(false);
        return null;
      }
    },
    [getToken, preferredModel, user, toast, onUsageIncrement]
  );

  const toggleSection = useCallback((index: number) => {
    setAcceptedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const acceptAll = useCallback(() => {
    if (!result) return;
    setAcceptedSections(new Set(result.tailored_sections.map((_, i) => i)));
  }, [result]);

  const getTailoredText = useCallback(() => {
    if (!result || !user) return null;
    const cvText = localStorage.getItem(`cv-text-${user.id}`);
    if (!cvText) return null;

    let tailored = cvText;
    for (const idx of Array.from(acceptedSections).sort((a, b) => b - a)) {
      const section = result.tailored_sections[idx];
      if (section && tailored.includes(section.original)) {
        tailored = tailored.replace(section.original, section.tailored);
      }
    }
    return tailored;
  }, [result, acceptedSections, user]);

  const reset = useCallback(() => {
    setResult(null);
    setLoading(false);
    setAcceptedSections(new Set());
  }, []);

  return {
    result,
    loading,
    acceptedSections,
    tailorCV,
    toggleSection,
    acceptAll,
    getTailoredText,
    reset,
  };
};
