import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isTestMode } from "@/lib/paddle";

interface Subscription {
  id: string;
  status: string;
  product_id: string;
  price_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  environment: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const environment = isTestMode() ? "sandbox" : "live";

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("environment", environment)
        .maybeSingle();

      setSubscription(data);
      setLoading(false);
    };

    fetchSubscription();

    // Listen for realtime updates
    const channel = supabase
      .channel("subscription-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as Subscription;
          if (newData.environment === environment) {
            setSubscription(newData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, environment]);

  const isActive =
    subscription &&
    (subscription.status === "active" || subscription.status === "trialing") &&
    (!subscription.current_period_end ||
      new Date(subscription.current_period_end) > new Date());

  const isPro = isActive && subscription?.product_id === "pro_plan";

  return {
    subscription,
    loading,
    isActive: !!isActive,
    isPro: !!isPro,
    isCanceling: subscription?.cancel_at_period_end ?? false,
    periodEnd: subscription?.current_period_end,
  };
}
