import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SparPoint {
  id: string;
  date: string;        // ISO
  score: number;       // 0-100
  mode: string;
}

/**
 * Spar performance history from interview_sessions. Pulls completed sessions
 * with an overall_score, ordered oldest → newest for trend rendering.
 * Returns an empty array until the user has at least one scored session.
 */
export function useSparHistory() {
  const { user } = useAuth();
  const [points, setPoints] = useState<SparPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setPoints([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("id, mode, overall_score, completed_at, created_at")
        .eq("user_id", user.id)
        .not("overall_score", "is", null)
        .order("completed_at", { ascending: true, nullsFirst: false })
        .limit(50);
      if (cancelled) return;
      if (error) {
        console.error("useSparHistory error", error);
        setPoints([]);
      } else {
        setPoints(
          (data ?? []).map((r: any) => ({
            id: r.id,
            date: r.completed_at ?? r.created_at,
            score: Math.round(Number(r.overall_score)),
            mode: r.mode,
          })),
        );
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  return { points, loading };
}