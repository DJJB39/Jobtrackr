import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCcw, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  originalScore: number;
  newScore: number;
  onReassess: () => void;
  onFinish: () => void;
  finishing?: boolean;
}

const OnboardingDone = ({ originalScore, newScore, onReassess, onFinish, finishing }: Props) => {
  const delta = newScore - originalScore;
  const positive = delta >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-display text-foreground">Sharper. Score updated.</h2>
        <p className="mt-1 text-sm text-muted-foreground">Here's how the cleanup moved the needle.</p>
      </div>

      <div className="grid grid-cols-3 items-center gap-2 rounded-2xl glass p-6">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Before</p>
          <p className="mt-1 text-3xl font-display tabular-nums text-muted-foreground">{originalScore}</p>
        </div>
        <div className="flex flex-col items-center">
          <TrendingUp className={`h-6 w-6 ${positive ? "text-emerald-500" : "text-red-500"}`} />
          <span className={`mt-1 text-sm font-mono font-medium ${positive ? "text-emerald-500" : "text-red-500"}`}>
            {positive ? "+" : ""}{delta}
          </span>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">After</p>
          <p className="mt-1 text-3xl font-display tabular-nums text-foreground">{newScore}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onReassess} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Re-assess
        </Button>
        <Button onClick={onFinish} disabled={finishing} size="lg" className="gap-2">
          I'm happy — take me to my jobs
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default OnboardingDone;
