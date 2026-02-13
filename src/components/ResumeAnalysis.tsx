import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, RefreshCw, Loader2, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ATSResult {
  ats_score: number;
  matching_keywords: string[];
  missing_keywords: string[];
  suggestions: string[];
}

interface ResumeAnalysisProps {
  jobDescription?: string;
  company: string;
  role: string;
}

const ResumeAnalysis = ({ jobDescription, company, role }: ResumeAnalysisProps) => {
  const [resumeText, setResumeText] = useState("");
  const [result, setResult] = useState<ATSResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const analyze = useCallback(async () => {
    if (!resumeText.trim()) {
      toast({ title: "Paste your resume", description: "Please paste your resume text to analyze", variant: "destructive" });
      return;
    }
    if (!jobDescription?.trim()) {
      toast({ title: "No job description", description: "This job needs a description for ATS analysis", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-resume", {
        body: { resume_text: resumeText, job_description: jobDescription },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as ATSResult);
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [resumeText, jobDescription, toast]);

  const scoreColor = result
    ? result.ats_score >= 80 ? "text-emerald-500" : result.ats_score >= 60 ? "text-amber-500" : "text-destructive"
    : "";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Paste your resume text</label>
        <Textarea
          placeholder="Paste your resume content here…"
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          className="min-h-[120px] resize-none text-sm"
        />
      </div>

      <Button onClick={analyze} disabled={loading} className="w-full gap-2" size="sm">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : result ? <RefreshCw className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
        {result ? "Re-analyze" : "Analyze ATS Match"}
      </Button>

      {result && (
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4">
            {/* Score */}
            <div className="text-center space-y-2 py-3">
              <p className={`text-4xl font-bold font-mono ${scoreColor}`}>{result.ats_score}</p>
              <p className="text-xs text-muted-foreground">ATS Match Score</p>
              <Progress value={result.ats_score} className="h-2" />
            </div>

            {/* Matching Keywords */}
            {result.matching_keywords.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Matching Keywords ({result.matching_keywords.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.matching_keywords.map((kw) => (
                    <Badge key={kw} variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Keywords */}
            {result.missing_keywords.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                  <XCircle className="h-3.5 w-3.5" /> Missing Keywords ({result.missing_keywords.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.missing_keywords.map((kw) => (
                    <Badge key={kw} variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Lightbulb className="h-3.5 w-3.5" /> Suggestions
                </div>
                <ul className="space-y-1.5">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-primary">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground italic text-center">
              ATS scores are approximate and may vary between tracking systems.
            </p>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default ResumeAnalysis;
