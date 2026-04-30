import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CVAssessment {
  intensity: "soft" | "medium" | "hard" | "nuclear";
  score: number;
  feedback_md: string;
  strengths: string[];
  gaps: string[];
  quick_wins: string[];
}

export interface CVCleanupSection {
  type: "summary" | "bullet" | "skill";
  label: string;
  before: string;
  after: string;
  reason: string;
  accepted?: boolean;
}

export interface CVCleanupDiff {
  cleaned_text: string;
  sections: CVCleanupSection[];
  risk_notes: string[];
}

export interface UserCV {
  user_id: string;
  original_text: string | null;
  cleaned_text: string | null;
  original_score: number | null;
  cleaned_score: number | null;
  assessment_jsonb: CVAssessment | null;
  cleanup_diff_jsonb: CVCleanupDiff | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserCV = () => {
  const { user } = useAuth();
  const [cv, setCv] = useState<UserCV | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setCv(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("user_cvs")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      console.error("useUserCV load error", error);
    }
    setCv((data as unknown as UserCV) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const upsert = useCallback(async (patch: Partial<UserCV>) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("user_cvs")
      .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" })
      .select()
      .maybeSingle();
    if (error) {
      console.error("useUserCV upsert error", error);
      throw error;
    }
    setCv((data as unknown as UserCV) ?? null);
    return data as unknown as UserCV;
  }, [user]);

  const saveOriginal = useCallback((text: string) => upsert({
    original_text: text,
    cleaned_text: null,
    original_score: null,
    cleaned_score: null,
    assessment_jsonb: null,
    cleanup_diff_jsonb: null,
    onboarding_completed: false,
  }), [upsert]);

  const saveAssessment = useCallback((score: number, assessment: CVAssessment, target: "original" | "cleaned" = "original") =>
    upsert(
      target === "original"
        ? { original_score: score, assessment_jsonb: assessment }
        : { cleaned_score: score, assessment_jsonb: assessment }
    ),
  [upsert]);

  const saveCleanup = useCallback((cleanedText: string, diff: CVCleanupDiff) =>
    upsert({ cleaned_text: cleanedText, cleanup_diff_jsonb: diff }),
  [upsert]);

  const completeOnboarding = useCallback(() => upsert({ onboarding_completed: true }), [upsert]);

  return { cv, loading, reload: load, saveOriginal, saveAssessment, saveCleanup, completeOnboarding, upsert };
};
