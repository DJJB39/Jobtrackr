import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

type CellValue = "yes" | "no" | "limited";

const features: { label: string; jobtrackr: CellValue; huntr: CellValue; teal: CellValue; simplify: CellValue }[] = [
  { label: "Kanban Board", jobtrackr: "yes", huntr: "yes", teal: "yes", simplify: "limited" },
  { label: "URL Auto-Fill", jobtrackr: "yes", huntr: "limited", teal: "yes", simplify: "yes" },
  { label: "Interview Coach with Scoring", jobtrackr: "yes", huntr: "no", teal: "no", simplify: "no" },
  { label: "CV Roast / Suitability Score", jobtrackr: "yes", huntr: "no", teal: "no", simplify: "no" },
  { label: "Screenshot Job Capture", jobtrackr: "yes", huntr: "no", teal: "no", simplify: "no" },
  { label: "AI Resume Tailor", jobtrackr: "yes", huntr: "limited", teal: "limited", simplify: "no" },
  { label: "Calendar & Events", jobtrackr: "yes", huntr: "yes", teal: "limited", simplify: "no" },
  { label: "Email Reminders", jobtrackr: "yes", huntr: "limited", teal: "no", simplify: "no" },
  { label: "Completely Free", jobtrackr: "yes", huntr: "no", teal: "no", simplify: "limited" },
  { label: "Privacy First", jobtrackr: "yes", huntr: "limited", teal: "limited", simplify: "limited" },
];

const CellIcon = ({ value }: { value: CellValue }) => {
  if (value === "yes") return <Check className="h-4 w-4 text-status-accepted mx-auto" />;
  if (value === "no") return <X className="h-4 w-4 text-destructive/60 mx-auto" />;
  return <Minus className="h-4 w-4 text-muted-foreground mx-auto" />;
};

const ComparisonTable = () => (
  <motion.section
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.5 }}
    className="mx-auto max-w-4xl px-6 pb-28"
  >
    <h2 className="text-center text-2xl font-display font-bold text-foreground mb-2">
      Why JobTrackr Wins
    </h2>
    <p className="text-center text-muted-foreground mb-10 text-sm">
      Three features no other free tracker offers — and everything else you'd expect.
    </p>

    <div className="overflow-x-auto rounded-xl border border-border glass">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-4 text-muted-foreground font-medium">Feature</th>
            <th className="p-4 text-center font-semibold text-primary">JobTrackr</th>
            <th className="p-4 text-center font-medium text-muted-foreground">Huntr</th>
            <th className="p-4 text-center font-medium text-muted-foreground">Teal</th>
            <th className="p-4 text-center font-medium text-muted-foreground">Simplify</th>
          </tr>
        </thead>
        <tbody>
          {features.map((f, i) => (
            <tr key={f.label} className={i < features.length - 1 ? "border-b border-border/50" : ""}>
              <td className="p-4 text-foreground font-medium">{f.label}</td>
              <td className="p-4"><CellIcon value={f.jobtrackr} /></td>
              <td className="p-4"><CellIcon value={f.huntr} /></td>
              <td className="p-4"><CellIcon value={f.teal} /></td>
              <td className="p-4"><CellIcon value={f.simplify} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="text-center text-[11px] text-muted-foreground mt-3 font-mono">
      Comparison based on free tiers as of April 2026. <Minus className="inline h-3 w-3 -mt-0.5" /> = limited or paywalled.
    </p>
  </motion.section>
);

export default ComparisonTable;
