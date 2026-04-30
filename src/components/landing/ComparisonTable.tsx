import { motion } from "framer-motion";

type CellValue = "yes" | "no" | "limited";

const features: { label: string; jobtrackr: CellValue; huntr: CellValue; teal: CellValue; simplify: CellValue }[] = [
  { label: "Kanban with custom stages", jobtrackr: "yes", huntr: "yes", teal: "yes", simplify: "limited" },
  { label: "URL auto-fill", jobtrackr: "yes", huntr: "limited", teal: "yes", simplify: "yes" },
  { label: "Screenshot job capture", jobtrackr: "yes", huntr: "no", teal: "no", simplify: "no" },
  { label: "Ruthless Interview Coach with scoring", jobtrackr: "yes", huntr: "no", teal: "no", simplify: "no" },
  { label: "Ruthless CV Roast (4 levels)", jobtrackr: "yes", huntr: "no", teal: "no", simplify: "no" },
  { label: "AI CV Tailor (per job)", jobtrackr: "yes", huntr: "limited", teal: "limited", simplify: "no" },
  { label: "Day Before Bootcamp", jobtrackr: "yes", huntr: "no", teal: "no", simplify: "no" },
  { label: "Calendar & reminders", jobtrackr: "yes", huntr: "yes", teal: "limited", simplify: "no" },
  { label: "Weekly pipeline digest", jobtrackr: "yes", huntr: "limited", teal: "no", simplify: "no" },
  { label: "CSV import / export", jobtrackr: "yes", huntr: "yes", teal: "limited", simplify: "no" },
  { label: "Generous free tier", jobtrackr: "yes", huntr: "no", teal: "limited", simplify: "limited" },
  { label: "Privacy first (encrypted)", jobtrackr: "yes", huntr: "limited", teal: "limited", simplify: "limited" },
];

const CellLabel = ({ value, highlight = false }: { value: CellValue; highlight?: boolean }) => {
  const text = value === "yes" ? "Yes" : value === "no" ? "No" : "Limited";
  const cls =
    value === "yes"
      ? highlight
        ? "text-primary font-semibold"
        : "text-status-accepted font-medium"
      : value === "no"
        ? "text-destructive/70"
        : "text-muted-foreground";
  return <span className={`text-xs ${cls}`}>{text}</span>;
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
      The only tracker with a Ruthless Coach, CV Roast, and screenshot capture — plus everything else you'd expect.
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
              <td className="p-4 text-center"><CellLabel value={f.jobtrackr} highlight /></td>
              <td className="p-4 text-center"><CellLabel value={f.huntr} /></td>
              <td className="p-4 text-center"><CellLabel value={f.teal} /></td>
              <td className="p-4 text-center"><CellLabel value={f.simplify} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="text-center text-[11px] text-muted-foreground mt-3 font-mono">
      Feature comparison accurate as of April 2026. Some features require Pro.
    </p>
  </motion.section>
);

export default ComparisonTable;
