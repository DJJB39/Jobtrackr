import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserCV } from "@/hooks/useUserCV";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

/**
 * Guard for protected routes that require the user to have completed
 * the AI-first onboarding (uploaded a CV + ran assessment + chosen to enter the app).
 * Auth must be checked by an outer ProtectedRoute first.
 */
const RequireOnboarding = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { cv, loading } = useUserCV();
  const location = useLocation();
  const [jobCount, setJobCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { setJobCount(0); return; }
    supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      .then(({ count }) => setJobCount(count ?? 0));
  }, [user]);

  if (authLoading || loading || jobCount === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Hard gate only for users with no CV AND no existing jobs (true new users).
  // Legacy users with jobs get through and see a soft banner inside AppPage.
  if (!cv?.onboarding_completed && jobCount === 0) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

export default RequireOnboarding;
