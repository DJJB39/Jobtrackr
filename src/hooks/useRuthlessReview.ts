import { useState, useCallback, useEffect } from "react";
import { useSSEStream } from "./useSSEStream";
import { useToast } from "./use-toast";
import { useAuth } from "./useAuth";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;

export type Intensity = "soft" | "medium" | "hard" | "nuclear";

export const INTENSITY_OPTIONS: { value: Intensity; label: string; color: string }[] = [
  { value: "soft", label: "Soft", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 data-[state=on]:bg-emerald-500 data-[state=on]:text-white" },
  { value: "medium", label: "Medium", color: "bg-amber-500/15 text-amber-600 border-amber-500/30 data-[state=on]:bg-amber-500 data-[state=on]:text-white" },
  { value: "hard", label: "Hard", color: "bg-red-500/15 text-red-600 border-red-500/30 data-[state=on]:bg-red-500 data-[state=on]:text-white" },
  { value: "nuclear", label: "Nuclear ☢️", color: "bg-purple-500/15 text-purple-600 border-purple-500/30 data-[state=on]:bg-purple-500 data-[state=on]:text-white" },
];

export const useRuthlessReview = (cvText: string | null) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const { content: ruthlessText, loading: ruthlessLoading, stream, reset, setContent: setRuthlessText } = useSSEStream();
  const [ruthlessOpen, setRuthlessOpen] = useState(false);
  const [ruthlessCooldown, setRuthlessCooldown] = useState(false);
  const [ruthlessIntensity, setRuthlessIntensity] = useState<Intensity>("hard");
  const [autoRoast, setAutoRoast] = useState(() => localStorage.getItem("auto_roast_new_uploads") !== "false");

  // Cooldown logic
  useEffect(() => {
    const ts = localStorage.getItem("ruthless-cooldown");
    if (!ts) return;
    const elapsed = Date.now() - parseInt(ts, 10);
    if (elapsed < 30000) {
      setRuthlessCooldown(true);
      const timer = setTimeout(() => setRuthlessCooldown(false), 30000 - elapsed);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAutoRoastToggle = useCallback((val: boolean) => {
    setAutoRoast(val);
    localStorage.setItem("auto_roast_new_uploads", val ? "true" : "false");
  }, []);

  const startRuthlessReview = useCallback(async (intensityOverride?: Intensity, skipCooldown?: boolean) => {
    if (!cvText) {
      toast({ title: "No CV uploaded", description: "Upload your CV first", variant: "destructive" });
      return;
    }
    if (!session?.access_token) {
      toast({ title: "Please log in", description: "Authentication required", variant: "destructive" });
      return;
    }
    if (cvText.length > 6000) {
      toast({ title: "CV truncated", description: "CV truncated to 6000 chars for review" });
    }

    if (!skipCooldown) {
      localStorage.setItem("ruthless-cooldown", Date.now().toString());
      setRuthlessCooldown(true);
      setTimeout(() => setRuthlessCooldown(false), 30000);
    }

    const intensity = intensityOverride || ruthlessIntensity;
    setRuthlessOpen(true);

    await stream(
      AI_URL,
      { mode: "ruthless_review", job: {}, cvText, intensity },
      session.access_token,
      (msg) => toast({ title: "Review unavailable", description: msg, variant: "destructive" })
    );
  }, [cvText, session, ruthlessIntensity, toast, stream]);

  return {
    ruthlessText,
    setRuthlessText,
    ruthlessLoading,
    ruthlessOpen,
    setRuthlessOpen,
    ruthlessCooldown,
    ruthlessIntensity,
    setRuthlessIntensity,
    autoRoast,
    handleAutoRoastToggle,
    startRuthlessReview,
    resetRuthless: reset,
  };
};
