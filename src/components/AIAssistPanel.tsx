import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSSEStream } from "@/hooks/useSSEStream";
import { useAIPreferences, AI_MODELS, type AIModelId } from "@/hooks/useAIPreferences";
import type { JobApplication } from "@/types/job";
import ReactMarkdown from "react-markdown";
import { useEffect } from "react";

type Mode = "cover_letter" | "interview_prep" | "summarize";

const MODE_LABELS: Record<Mode, string> = {
  cover_letter: "Cover Letter",
  interview_prep: "Interview Prep",
  summarize: "Summary",
};

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;

interface AIAssistPanelProps {
  job: JobApplication;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AIAssistPanel = ({ job, open, onOpenChange }: AIAssistPanelProps) => {
  const [mode, setMode] = useState<Mode>("cover_letter");
  const { toast } = useToast();
  const { user } = useAuth();
  const { content, loading, stream, reset } = useSSEStream();
  const [cvText, setCvText] = useState<string | null>(null);
  const [lastModel, setLastModel] = useState<string | null>(null);
  const aiPrefs = useAIPreferences();
  const [modelOverride, setModelOverride] = useState<AIModelId | "">("");

  useEffect(() => {
    if (user) {
      const cached = localStorage.getItem(`cv-text-${user.id}`);
      setCvText(cached || null);
    }
  }, [user]);

  const generate = useCallback(async (selectedMode?: Mode) => {
    const m = selectedMode ?? mode;
    reset();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast({ title: "Please log in", description: "Authentication required for AI", variant: "destructive" });
      return;
    }

    const model = modelOverride || aiPrefs.preferredModel;
    setLastModel(model);

    await stream(
      AI_URL,
      {
        mode: m,
        model,
        job: {
          company: job.company,
          role: job.role,
          salary: job.salary,
          location: job.location,
          description: job.description,
          notes: job.notes,
          applicationType: job.applicationType,
        },
        ...(cvText ? { cvText } : {}),
      },
      session.access_token,
      (msg) => {
        if (msg.includes("LIMIT_REACHED")) {
          toast({ title: "Monthly AI limit reached", description: "Upgrade to Pro for unlimited generations.", variant: "destructive" });
        } else {
          toast({ title: "AI Error", description: msg, variant: "destructive" });
        }
      },
      () => aiPrefs.incrementUsage()
    );
  }, [mode, job, toast, cvText, stream, reset, aiPrefs.preferredModel, modelOverride, aiPrefs.incrementUsage]);

  const handleModeChange = (newMode: string) => {
    setMode(newMode as Mode);
    reset();
    setLastModel(null);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard" });
  };

  const modelLabel = lastModel ? AI_MODELS.find((m) => m.id === lastModel)?.label : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <SheetTitle className="text-lg">AI Assistant</SheetTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {job.company} — {job.role}
          </p>
        </SheetHeader>

        <div className="px-6 py-3 border-b border-border">
          <Tabs value={mode} onValueChange={handleModeChange}>
            <TabsList className="w-full">
              {(Object.entries(MODE_LABELS) as [Mode, string][]).map(([key, label]) => (
                <TabsTrigger key={key} value={key} className="flex-1 text-xs">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="px-6 py-3 flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => generate()}
            disabled={loading || aiPrefs.isLimitReached}
            className="gap-2"
            size="sm"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {content ? "Regenerate" : "Generate"}
          </Button>
          {content && (
            <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2">
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
          )}
          <Select value={modelOverride} onValueChange={(v) => setModelOverride(v as AIModelId)}>
            <SelectTrigger className="w-auto h-8 text-xs gap-1 min-w-[120px]">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Default ({AI_MODELS.find((m) => m.id === aiPrefs.preferredModel)?.label})</SelectItem>
              {AI_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {aiPrefs.isLimitReached && (
            <p className="text-xs text-destructive w-full">Monthly limit reached ({aiPrefs.usageCount}/{aiPrefs.usageLimit})</p>
          )}
        </div>

        <ScrollArea className="flex-1 px-6 pb-6">
          {loading && !content && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Generating {MODE_LABELS[mode].toLowerCase()}…</p>
            </div>
          )}
          {content && (
            <div className="space-y-2">
              {modelLabel && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  {modelLabel}
                </Badge>
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          )}
          {!loading && !content && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Sparkles className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">Select a mode and click Generate</p>
              <p className="text-xs mt-1">AI will use the job details to create tailored content</p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default AIAssistPanel;
