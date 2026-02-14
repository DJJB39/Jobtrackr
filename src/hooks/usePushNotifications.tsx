import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const VAPID_PUBLIC_KEY = ""; // Set after generating VAPID keys

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(isSupported);
    if (isSupported) {
      setPermissionState(Notification.permission);
    }
  }, []);

  // Load preference from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("push_notifications")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setEnabled(data.push_notifications);
    };
    load();
  }, [user]);

  const requestPermission = useCallback(async () => {
    if (!supported || !user || !VAPID_PUBLIC_KEY) {
      toast({ title: "Push not available", description: "VAPID keys not configured yet", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission !== "granted") {
        toast({ title: "Permission denied", description: "Enable notifications in your browser settings" });
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = subscription.toJSON();

      // Save to DB
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_preferences")
          .update({ push_notifications: true, push_subscription: subJson as any })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("user_preferences")
          .insert({ user_id: user.id, push_notifications: true, push_subscription: subJson as any });
      }

      setEnabled(true);
      toast({ title: "Push notifications enabled" });
    } catch (err) {
      console.error("Push subscription error:", err);
      toast({ title: "Error", description: "Failed to enable push notifications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [supported, user, toast]);

  const disable = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      await supabase
        .from("user_preferences")
        .update({ push_notifications: false, push_subscription: null as any })
        .eq("user_id", user.id);
      setEnabled(false);

      // Unregister service worker
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        if (reg.active?.scriptURL.includes("sw.js")) {
          await reg.unregister();
        }
      }

      toast({ title: "Push notifications disabled" });
    } catch {
      toast({ title: "Error", description: "Failed to disable push", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const toggle = useCallback(() => {
    if (enabled) {
      disable();
    } else {
      requestPermission();
    }
  }, [enabled, disable, requestPermission]);

  return { supported, enabled, permissionState, loading, toggle };
};
