import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Download, Link as LinkIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateShareCardBlob } from "@/lib/shareCard";

interface Props {
  score: number | null;
  line: string;
  shareUrl?: string;
  label?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
}

const ShareScoreButton = ({ score, line, shareUrl, label = "Share my score", variant = "outline", size = "sm" }: Props) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const url = shareUrl || `${window.location.origin}/roast`;

  const make = async () => {
    setBusy(true);
    try {
      const blob = await generateShareCardBlob({ score, line, url: url.replace(/^https?:\/\//, "") });
      const file = new File([blob], "cornerman-roast.png", { type: "image/png" });
      const text = score != null ? `My CV scored ${score}/100 on Cornerman. Roast yours free →` : "I got roasted by Cornerman. Roast yours free →";
      const nav: any = navigator;
      const canShareFiles = typeof nav.canShare === "function" && nav.canShare({ files: [file] });
      if (nav.share && canShareFiles) {
        try {
          await nav.share({ files: [file], text, url });
          return;
        } catch (e: any) {
          if (e?.name !== "AbortError") console.warn("share failed", e);
        }
      }
      // Desktop fallback: download + copy link
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "cornerman-roast.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
      try { await navigator.clipboard.writeText(url); } catch {}
      toast({ title: "Card downloaded", description: "Link copied to clipboard." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Couldn't generate card", description: e?.message || "Try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant={variant} size={size} className="gap-2" onClick={make} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
        {label}
      </Button>
      <Button variant="ghost" size={size} className="gap-2 hidden sm:inline-flex" onClick={copyLink} disabled={busy}>
        <LinkIcon className="h-4 w-4" /> Copy link
      </Button>
    </div>
  );
};

export default ShareScoreButton;