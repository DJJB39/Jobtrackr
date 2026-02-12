import { useState, useEffect, useRef } from "react";
import type { ColumnId } from "@/types/job";

const ONBOARDED_KEY = "jobtrackr-onboarded";

interface UseOnboardingProps {
  jobCount: number;
  loading: boolean;
  addJob: (
    company: string,
    role: string,
    columnId: ColumnId,
    applicationType: string,
    extras?: { location?: string; description?: string; links?: string[]; salary?: string; closeDate?: string }
  ) => Promise<void>;
}

export const useOnboarding = ({ jobCount, loading, addJob }: UseOnboardingProps) => {
  const [showBanner, setShowBanner] = useState(false);
  const seeded = useRef(false);

  useEffect(() => {
    if (loading || seeded.current) return;
    if (jobCount !== 0) return;
    if (localStorage.getItem(ONBOARDED_KEY)) return;

    seeded.current = true;
    const seed = async () => {
      await addJob("Acme Corp", "Frontend Engineer", "found", "Other", {
        location: "San Francisco, CA",
        description: "Build modern web applications using React and TypeScript. Collaborate with designers and backend engineers.",
        salary: "$130k-$160k",
      });
      await addJob("TechCo", "Senior Developer", "applied", "Other", {
        location: "Remote",
        description: "Lead frontend architecture decisions and mentor junior developers. Full-stack TypeScript environment.",
        salary: "$150k-$180k",
      });
      await addJob("StartupXYZ", "Full Stack Engineer", "phone", "Other", {
        location: "New York, NY",
        description: "Join an early-stage startup building AI-powered analytics tools. Greenfield development.",
        salary: "$120k-$150k",
      });
      localStorage.setItem(ONBOARDED_KEY, "1");
      setShowBanner(true);
    };

    seed();
  }, [jobCount, loading, addJob]);

  return { showBanner, dismissBanner: () => setShowBanner(false) };
};
