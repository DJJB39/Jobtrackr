import { Navigate, useLocation } from "react-router-dom";
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

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!cv?.onboarding_completed) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

export default RequireOnboarding;
