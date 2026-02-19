import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { COLUMNS, type Column } from "@/types/job";

export interface UserStage {
  id: string;
  user_id: string;
  stage_id: string;
  title: string;
  color_class: string;
  position: number;
}

const PRESET_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-orange-500",
  "bg-emerald-500",
  "bg-green-600",
  "bg-red-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-yellow-500",
];

export { PRESET_COLORS };

export const useStages = () => {
  const { user } = useAuth();
  const [rawStages, setRawStages] = useState<UserStage[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch stages
  useEffect(() => {
    if (!user) {
      setRawStages([]);
      setLoading(false);
      return;
    }

    const fetchStages = async () => {
      const { data, error } = await supabase
        .from("user_stages")
        .select("*")
        .eq("user_id", user.id)
        .order("position", { ascending: true });

      if (!error && data && data.length > 0) {
        setRawStages(data as unknown as UserStage[]);
      }
      setLoading(false);
    };

    fetchStages();
  }, [user]);

  // Convert to Column[] format for compatibility
  const stages: Column[] = useMemo(() => {
    if (rawStages.length === 0) return COLUMNS;
    return rawStages.map((s) => ({
      id: s.stage_id as Column["id"],
      title: s.title,
      colorClass: s.color_class,
    }));
  }, [rawStages]);

  const addStage = useCallback(
    async (title: string, colorClass: string) => {
      if (!user) return;
      const stageId = title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
      const position = rawStages.length;
      const { data, error } = await supabase
        .from("user_stages")
        .insert({
          user_id: user.id,
          stage_id: stageId,
          title,
          color_class: colorClass,
          position,
        } as any)
        .select()
        .single();

      if (!error && data) {
        setRawStages((prev) => [...prev, data as unknown as UserStage]);
      }
      return { error };
    },
    [user, rawStages.length]
  );

  const deleteStage = useCallback(
    async (stageId: string) => {
      if (!user) return;
      if (rawStages.length <= 2) return;

      await supabase
        .from("user_stages")
        .delete()
        .eq("user_id", user.id)
        .eq("stage_id", stageId);

      setRawStages((prev) => {
        const filtered = prev.filter((s) => s.stage_id !== stageId);
        return filtered.map((s, i) => ({ ...s, position: i }));
      });

      // Reorder remaining
      const remaining = rawStages
        .filter((s) => s.stage_id !== stageId)
        .map((s, i) => ({ ...s, position: i }));

      for (const s of remaining) {
        await supabase
          .from("user_stages")
          .update({ position: s.position } as any)
          .eq("id", s.id);
      }
    },
    [user, rawStages]
  );

  const reorderStages = useCallback(
    async (reordered: UserStage[]) => {
      if (!user) return;
      setRawStages(reordered);

      for (let i = 0; i < reordered.length; i++) {
        await supabase
          .from("user_stages")
          .update({ position: i } as any)
          .eq("id", reordered[i].id);
      }
    },
    [user]
  );

  const updateStage = useCallback(
    async (stageId: string, updates: { title?: string; color_class?: string }) => {
      if (!user) return;
      await supabase
        .from("user_stages")
        .update(updates as any)
        .eq("user_id", user.id)
        .eq("stage_id", stageId);

      setRawStages((prev) =>
        prev.map((s) =>
          s.stage_id === stageId
            ? { ...s, ...(updates.title ? { title: updates.title } : {}), ...(updates.color_class ? { color_class: updates.color_class } : {}) }
            : s
        )
      );
    },
    [user]
  );

  return { stages, rawStages, loading, addStage, deleteStage, reorderStages, updateStage };
};
