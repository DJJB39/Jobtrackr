import { useMemo, useRef, useCallback } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { COLUMNS, type JobApplication } from "@/types/job";
import { useToast } from "@/hooks/use-toast";

const ShareStats = ({ jobs }: { jobs: JobApplication[] }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const summary = useMemo(() => {
    const total = jobs.length;
    const active = jobs.filter((j) => !["found", "rejected"].includes(j.columnId)).length;
    const interviews = jobs.filter((j) => ["phone", "interview2", "final"].includes(j.columnId)).length;
    const offers = jobs.filter((j) => j.columnId === "offer" || j.columnId === "accepted").length;
    const stages = COLUMNS.map((c) => ({
      name: c.title,
      count: jobs.filter((j) => j.columnId === c.id).length,
    })).filter((s) => s.count > 0);

    return { total, active, interviews, offers, stages };
  }, [jobs]);

  const shareText = useMemo(() => {
    const lines = [
      `📊 My Job Search Stats (via JobTrackr)`,
      ``,
      `📋 Total Applications: ${summary.total}`,
      `🔥 Active in Pipeline: ${summary.active}`,
      `🎤 Interviews: ${summary.interviews}`,
      `🎁 Offers: ${summary.offers}`,
      ``,
      `Pipeline Breakdown:`,
      ...summary.stages.map((s) => `  ${s.name}: ${s.count}`),
      ``,
      `Track yours free → jobtrackr.app`,
    ];
    return lines.join("\n");
  }, [summary]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({ title: "Copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  }, [shareText, toast]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Job Search Stats", text: shareText });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  }, [shareText, handleCopy]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-border/50 hover:border-border">
          <Share2 className="h-3.5 w-3.5" />
          Share Stats
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Share Your Progress</DialogTitle>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-secondary/30 p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
          {shareText}
        </div>

        <div className="flex gap-2 mt-2">
          <Button onClick={handleCopy} variant="outline" className="flex-1 gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Text"}
          </Button>
          {"share" in navigator && (
            <Button onClick={handleNativeShare} className="flex-1 gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareStats;
