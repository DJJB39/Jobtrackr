import { useState, useEffect, useCallback } from "react";

const TOUR_COMPLETE_KEY = "jobtrackr-tour-complete";
const TOUR_NEVER_KEY = "jobtrackr-tour-never";

export interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: "kanban-column",
    title: "Your Pipeline",
    description: "This is your pipeline. Drag jobs between stages as you progress.",
  },
  {
    target: "add-button",
    title: "Add Applications",
    description: "Add a new application — paste a job URL to auto-fill details.",
  },
  {
    target: "job-card",
    title: "Job Details",
    description: "Click any card for full details, notes, events, and AI tools.",
  },
  {
    target: "view-switcher",
    title: "Multiple Views",
    description: "Switch between Board, List, Insights, Calendar, and CV views.",
  },
  {
    target: "search-input",
    title: "Quick Search",
    description: "Search all your applications instantly. Try ⌘K too.",
  },
];

interface UseOnboardingTourProps {
  tourReady: boolean;
}

export const useOnboardingTour = ({ tourReady }: UseOnboardingTourProps) => {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!tourReady) return;
    if (localStorage.getItem(TOUR_COMPLETE_KEY)) return;
    if (localStorage.getItem(TOUR_NEVER_KEY)) return;
    // Small delay so elements are mounted
    const timer = setTimeout(() => setActive(true), 800);
    return () => clearTimeout(timer);
  }, [tourReady]);

  const advance = useCallback(() => {
    if (step >= TOUR_STEPS.length - 1) {
      setActive(false);
      localStorage.setItem(TOUR_COMPLETE_KEY, "1");
    } else {
      setStep((s) => s + 1);
    }
  }, [step]);

  const skip = useCallback((neverShow: boolean) => {
    setActive(false);
    localStorage.setItem(TOUR_COMPLETE_KEY, "1");
    if (neverShow) {
      localStorage.setItem(TOUR_NEVER_KEY, "1");
    }
  }, []);

  return { active, step, currentStep: TOUR_STEPS[step], totalSteps: TOUR_STEPS.length, advance, skip };
};
