import { useState } from "react";
import { motion } from "framer-motion";
import { Chrome, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ChromeExtensionCTA = () => {
  const [open, setOpen] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-3xl px-6 pb-28"
    >
      <div className="rounded-2xl border border-border glass p-8 sm:p-10 relative overflow-hidden text-center">
        {/* Glow */}
        <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-status-found/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary border border-border">
            <Chrome className="h-7 w-7 text-foreground" />
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">
            Chrome Extension — Now in Beta
          </h2>
          <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
            Save jobs directly from LinkedIn, Indeed, Reed, and Greenhouse with one click.
            Auto-fill details and add to your board instantly — no tab switching.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {["LinkedIn", "Indeed", "Reed", "Greenhouse"].map((site) => (
              <span key={site} className="px-3 py-1 text-xs rounded-full bg-secondary border border-border text-muted-foreground">
                {site}
              </span>
            ))}
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="text-base gap-2">
                <Chrome className="h-4 w-4" />
                Install Extension
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Install JobTrackr Extension</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm text-muted-foreground">
                <ol className="space-y-3 list-decimal list-inside">
                  <li>Download the <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">chrome-extension</code> folder from the project repo</li>
                  <li>Open <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">chrome://extensions</code> in Chrome</li>
                  <li>Enable <strong className="text-foreground">Developer mode</strong> (top-right toggle)</li>
                  <li>Click <strong className="text-foreground">Load unpacked</strong> and select the folder</li>
                  <li>Navigate to a job posting and click <strong className="text-foreground">Save to JobTrackr</strong></li>
                </ol>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    The extension authenticates with your JobTrackr account. Click the extension icon to sign in.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <p className="text-[10px] text-muted-foreground mt-3 font-mono">
            Beta — Load as unpacked extension
          </p>
        </div>
      </div>
    </motion.section>
  );
};

export default ChromeExtensionCTA;
