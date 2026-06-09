import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserCV } from "@/hooks/useUserCV";
import { useAuth } from "@/hooks/useAuth";
import CVUploadStep from "@/components/onboarding/CVUploadStep";
import CVAssessmentStep from "@/components/onboarding/CVAssessmentStep";
import CVCleanupStep from "@/components/onboarding/CVCleanupStep";
import OnboardingDone from "@/components/onboarding/OnboardingDone";
import { Briefcase, Loader2 } from "lucide-react";

const PENDING_ROAST_KEY = "cornerman:pending-roast";

type Step = "upload" | "assess" | "cleanup" | "done";
const STEP_ORDER: Step[] = ["upload", "assess", "cleanup", "done"];
const STEP_LABELS: Record<Step, string> = {
  upload: "Upload CV",
  assess: "Assessment",
  cleanup: "Strengthen",
  done: "Done",
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const force = searchParams.get("force") === "1";
  const { user, loading: authLoading } = useAuth();
  const { cv, loading, saveOriginal, saveAssessment, saveCleanup, completeOnboarding } = useUserCV();
  const [step, setStep] = useState<Step>("upload");
  const [finishing, setFinishing] = useState(false);

  // Hydrate pending /roast result captured pre-signup
  useEffect(() => {
    if (loading || authLoading || !user) return;
    if (cv?.original_text) return;
    let raw: string | null = null;
    try { raw = localStorage.getItem(PENDING_ROAST_KEY); } catch { /* ignore */ }
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const cvText: string | undefined = parsed?.cvText;
      const r = parsed?.result;
      if (!cvText || typeof cvText !== "string" || cvText.trim().length < 100) return;
      (async () => {
        await saveOriginal(cvText);
        if (r && typeof r.score === "number" && typeof r.feedback_md === "string") {
          await saveAssessment(Math.round(r.score), {
            intensity: "hard",
            score: Math.round(r.score),
            feedback_md: r.feedback_md,
            strengths: Array.isArray(r.strengths) ? r.strengths : [],
            gaps: Array.isArray(r.gaps) ? r.gaps : [],
            quick_wins: Array.isArray(r.quick_wins) ? r.quick_wins : [],
          }, "original");
          setStep("assess");
        } else {
          setStep("assess");
        }
        try { localStorage.removeItem(PENDING_ROAST_KEY); } catch { /* ignore */ }
      })();
    } catch {
      try { localStorage.removeItem(PENDING_ROAST_KEY); } catch { /* ignore */ }
    }
  }, [user, authLoading, loading, cv?.original_text, saveOriginal, saveAssessment]);

  // Skip-through if already completed (unless force=1)
  useEffect(() => {
    if (loading || authLoading) return;
    if (cv?.onboarding_completed && !force) {
      navigate("/app", { replace: true });
    }
  }, [cv, loading, authLoading, force, navigate]);

  // Resume to the right step on load
  useEffect(() => {
    if (loading) return;
    if (!cv?.original_text) setStep("upload");
    else if (!cv.assessment_jsonb) setStep("assess");
    else if (!cv.cleaned_text) setStep("assess"); // awaiting cleanup CTA
    else if (cv.cleaned_score == null) setStep("assess"); // awaiting re-assessment
    else setStep("done");
  }, [loading, cv?.original_text, cv?.assessment_jsonb, cv?.cleaned_text]);

  const stepIndex = STEP_ORDER.indexOf(step);

  const masterText = useMemo(() => cv?.original_text ?? "", [cv?.original_text]);

  if (loading || authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[hsl(var(--gradient-start))] via-background to-[hsl(var(--gradient-end))] mesh-gradient">
      <div className="noise pointer-events-none fixed inset-0" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-glow">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-base text-foreground">Cornerman</span>
          </div>
          <button
            onClick={async () => {
              if (cv?.original_text) await completeOnboarding();
              navigate("/app");
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Skip for now
          </button>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            {STEP_ORDER.map((s, i) => {
              const active = i === stepIndex;
              const done = i < stepIndex;
              return (
                <div key={s} className="flex flex-1 items-center gap-2">
                  <div className={`h-2 flex-1 rounded-full transition-colors ${done ? "bg-primary" : active ? "bg-primary/60" : "bg-border/40"}`} />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            {STEP_ORDER.map((s, i) => (
              <span key={s} className={i === stepIndex ? "text-foreground font-medium" : ""}>{STEP_LABELS[s]}</span>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1">
          {step === "upload" && (
            <CVUploadStep
              initialText={masterText}
              onSubmit={async (text) => {
                await saveOriginal(text);
                setStep("assess");
              }}
            />
          )}

          {step === "assess" && (
            <CVAssessmentStep
              cvText={cv?.cleaned_text ?? cv?.original_text ?? ""}
              initialAssessment={cv?.assessment_jsonb ?? null}
              initialScore={(cv?.cleaned_text ? cv?.cleaned_score : cv?.original_score) ?? null}
              label={cv?.cleaned_text ? "Re-assessed" : "Original"}
              onComplete={async (score, assessment) => {
                await saveAssessment(score, assessment, cv?.cleaned_text ? "cleaned" : "original");
                if (cv?.cleaned_text) setStep("done");
              }}
              onCleanupRequest={cv?.cleaned_text ? undefined : () => setStep("cleanup")}
              ctaLabel={cv?.cleaned_text ? undefined : "Clean & Strengthen my CV"}
            />
          )}

          {step === "cleanup" && cv?.original_text && (
            <CVCleanupStep
              originalText={cv.original_text}
              assessment={cv.assessment_jsonb}
              onApply={async (cleanedText, diff) => {
                await saveCleanup(cleanedText, diff);
                setStep("assess"); // re-assessment loop
              }}
              onSkip={async () => {
                setFinishing(true);
                await completeOnboarding();
                navigate("/app", { replace: true });
              }}
            />
          )}

          {step === "done" && cv?.cleaned_text && (
            <OnboardingDone
              originalScore={cv.original_score ?? 0}
              newScore={cv.cleaned_score ?? cv.original_score ?? 0}
              onReassess={() => setStep("assess")}
              onFinish={async () => {
                setFinishing(true);
                await completeOnboarding();
                navigate("/app", { replace: true });
              }}
              finishing={finishing}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
