import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ExtractedJobData {
  job_title: string;
  company: string;
  location?: string;
  salary?: string;
  employment_type?: string;
  description?: string;
  key_requirements?: string[];
  posted_date?: string;
  confidence: number;
  warnings: string[];
  model?: string;
  sourceUrl?: string;
}

export const useScreenshotCapture = () => {
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedJobData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const extractFromImage = useCallback(async (imageBase64: string, sourceUrl?: string) => {
    setExtracting(true);
    setError(null);
    setExtractedData(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please sign in to use screenshot capture");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            mode: "extract_from_screenshot",
            imageBase64,
            sourceUrl,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        if (err.code === "LIMIT_REACHED") {
          throw new Error("Monthly AI limit reached. Upgrade to Pro for unlimited.");
        }
        throw new Error(err.error || "Extraction failed");
      }

      const data: ExtractedJobData = await response.json();
      data.sourceUrl = sourceUrl;
      setExtractedData(data);
      return data;
    } catch (err: any) {
      const msg = err.message || "Screenshot extraction failed";
      setError(msg);
      toast({ title: "Extraction failed", description: msg, variant: "destructive" });
      return null;
    } finally {
      setExtracting(false);
    }
  }, [toast]);

  const reset = useCallback(() => {
    setExtractedData(null);
    setError(null);
  }, []);

  return { extracting, extractedData, error, extractFromImage, reset };
};
