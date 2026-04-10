import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Crown } from "lucide-react";
import { AI_MODELS, type AIModelId, useAIPreferences } from "@/hooks/useAIPreferences";

interface AISettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefs: ReturnType<typeof useAIPreferences>;
}

const TIER_ICON: Record<string, React.ReactNode> = {
  fast: <Zap className="h-3 w-3" />,
  balanced: <Sparkles className="h-3 w-3" />,
  quality: <Crown className="h-3 w-3" />,
};

const AISettings = ({ open, onOpenChange, prefs }: AISettingsProps) => {
  const usagePct = Math.min((prefs.usageCount / prefs.usageLimit) * 100, 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Model selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Preferred Model</label>
            <Select value={prefs.preferredModel} onValueChange={(v) => prefs.updateModel(v as AIModelId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      {TIER_ICON[m.tier]}
                      <span>{m.label}</span>
                      <span className="text-xs text-muted-foreground ml-1">— {m.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This model will be used for all AI features. You can override per-generation.
            </p>
          </div>

          {/* Usage counter */}
          <div className="space-y-3 rounded-lg border border-border/50 bg-secondary/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">AI Usage This Month</span>
              <Badge variant={prefs.isLimitReached ? "destructive" : "secondary"} className="text-xs">
                {prefs.usageCount}/{prefs.usageLimit}
              </Badge>
            </div>
            <Progress value={usagePct} className="h-2" />
            {prefs.isLimitReached ? (
              <p className="text-xs text-destructive font-medium">
                Monthly limit reached. Upgrade to Pro for unlimited generations.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {prefs.usageLimit - prefs.usageCount} generation{prefs.usageLimit - prefs.usageCount !== 1 ? "s" : ""} remaining this month.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AISettings;
