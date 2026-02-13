import { useState, useCallback } from "react";
import CVUploadSection from "@/components/CVUploadSection";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { JobApplication } from "@/types/job";
import ReactMarkdown from "react-markdown";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;

interface DetailCVTabProps {
  job: JobApplication;
}

interface SuitabilityResult {
  score: number;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
}

const ScoreRing = ({ score }: { score: number }) => {
  const color = score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-red-500";
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative h-24 w-24 flex items-center justify-center">
      <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
        <circle
          cx="40" cy="40" r="36" fill="none"
          className={color}
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <span className={`text-2xl font-display font-bold ${color}`}>{score}</span>
    </div>
  );
};

const DetailCVTab = ({ job }: DetailCVTabProps) => {
  const [cvText, setCvText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuitabilityResult | null>(null);
  const { toast } = useToast();

  const handleCVText = useCallback((text: string | null) => {
    setCvText(text);
  }, []);

  const reviewSuitability = async () => {
    if (!cvText) {
      toast({ title: "No CV found", description: "Upload your CV first", variant: "destructive" });
      return;
    }
    if (!job.description && !job.role) {
      toast({ title: "No job description", description: "Add a description to this job first", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: "cv_suitability",
          job: {
            company: job.company,
            role: job.role,
            salary: job.salary,
            location: job.location,
            description: job.description,
            notes: job.notes,
          },
          cvText,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        toast({ title: "AI Error", description: err.error, variant: "destructive" });
        return;
      }

      const data = await resp.json();
      setResult(data);
    } catch (e) {
      toast({ title: "Error", description: "Failed to review suitability", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <CVUploadSection onCVTextReady={handleCVText} />

      {/* Review button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={reviewSuitability}
          disabled={loading || !cvText}
          className="gap-2"
          size="sm"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Review Suitability
        </Button>
        {!cvText && (
          <p className="text-xs text-muted-foreground">Upload a CV to enable suitability review</p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 rounded-xl border border-border/50 bg-secondary/10 p-5">
          {/* Score */}
          <div className="flex items-center gap-5">
            <ScoreRing score={result.score} />
            <div>
              <p className="text-lg font-display font-semibold text-foreground">
                Suitability Score
              </p>
              <p className="text-xs text-muted-foreground">
                {result.score >= 75 ? "Strong match!" : result.score >= 50 ? "Moderate match" : "Weak match — review suggestions"}
              </p>
            </div>
          </div>

          {/* Strengths */}
          {result.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-emerald-500 mb-1.5">✓ Strengths</h4>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-foreground pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-emerald-500">{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Gaps */}
          {result.gaps.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-amber-500 mb-1.5">⚠ Gaps</h4>
              <ul className="space-y-1">
                {result.gaps.map((g, i) => (
                  <li key={i} className="text-sm text-foreground pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-amber-500">{g}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-primary mb-1.5">💡 Suggestions</h4>
              <ul className="space-y-1">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-foreground pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary">{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DetailCVTab;
