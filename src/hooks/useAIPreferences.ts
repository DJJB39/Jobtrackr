import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const AI_MODELS = [
  { id: "google/gemini-3-flash-preview", label: "Gemini Flash", desc: "Fastest, default", tier: "fast" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Balanced speed & quality", tier: "balanced" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "Best quality, slower", tier: "quality" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", desc: "Fast, good quality", tier: "balanced" },
  { id: "openai/gpt-5", label: "GPT-5", desc: "Highest quality, slowest", tier: "quality" },
] as const;

export type AIModelId = (typeof AI_MODELS)[number]["id"];

const DEFAULT_MODEL: AIModelId = "google/gemini-3-flash-preview";
const FREE_TIER_LIMIT = 10;

export const useAIPreferences = () => {
  const { user } = useAuth();
  const [preferredModel, setPreferredModel] = useState<AIModelId>(DEFAULT_MODEL);
  const [usageCount, setUsageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load preferences + usage count
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const load = async () => {
      // Load model preference
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("preferred_model")
        .eq("user_id", user.id)
        .maybeSingle();

      if (prefs?.preferred_model) {
        setPreferredModel(prefs.preferred_model as AIModelId);
      }

      // Load usage count for current month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count } = await supabase
        .from("ai_usage_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", monthStart);

      setUsageCount(count ?? 0);
      setLoading(false);
    };

    load();
  }, [user]);

  const updateModel = useCallback(async (model: AIModelId) => {
    setPreferredModel(model);
    if (!user) return;

    const { data: existing } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("user_preferences")
        .update({ preferred_model: model })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("user_preferences")
        .insert({ user_id: user.id, preferred_model: model });
    }
  }, [user]);

  const incrementUsage = useCallback(() => {
    setUsageCount((prev) => prev + 1);
  }, []);

  const refreshUsage = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count } = await supabase
      .from("ai_usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStart);
    setUsageCount(count ?? 0);
  }, [user]);

  return {
    preferredModel,
    updateModel,
    usageCount,
    usageLimit: FREE_TIER_LIMIT,
    isLimitReached: usageCount >= FREE_TIER_LIMIT,
    loading,
    incrementUsage,
    refreshUsage,
  };
};
