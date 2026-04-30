type CellValue = "yes" | "no" | "limited";

const features: { label: string; jobtrackr: CellValue; huntr: CellValue; teal: CellValue; simplify: CellValue }[] = [
  { label: "Kanban with custom stages", jobtrackr: "yes", huntr: "yes", teal: "yes", simplify: "limited" },
  { label: "URL auto-fill", jobtrackr: "yes", huntr: "limited", teal: "yes", simplify: "yes" },
  { label: "Screenshot job capture", jobtrackr: "yes", huntr: "no", teal: "no", simplify: "no" },
  { label: "Ruthless Interview Coach", jobtrackr: "yes", huntr: "no", teal: "no", simplify: "no" },
  { label: "Ruthless CV Roast (4 levels)", jobtrackr: "yes", huntr: "no", teal: "no", simplify: "no" },
  { label: "AI CV Tailor (per job)", jobtrackr: "yes", huntr: "limited", teal: "limited", simplify: "no" },
  { label: "Day Before Bootcamp", jobtrackr: "yes", huntr: "no", teal: "no", simplify: "no" },
  { label: "Calendar & reminders", jobtrackr: "yes", huntr: "yes", teal: "limited", simplify: "no" },
  { label: "Weekly pipeline digest", jobtrackr: "yes", huntr: "limited", teal: "no", simplify: "no" },
  { label: "CSV import / export", jobtrackr: "yes", huntr: "yes", teal: "limited", simplify: "no" },
  { label: "Generous free tier", jobtrackr: "yes", huntr: "no", teal: "limited", simplify: "limited" },
  { label: "Privacy first (encrypted)", jobtrackr: "yes", huntr: "limited", teal: "limited", simplify: "limited" },
];

const Cell = ({ value, accent = false }: { value: CellValue; accent?: boolean }) => {
  const text = value === "yes" ? "Yes" : value === "no" ? "No" : "Limited";
  const cls =
    value === "yes"
      ? accent
        ? "cm-text-amber"
        : "text-[color:var(--cm-text)]"
      : value === "limited"
      ? "cm-text-dim"
      : "cm-text-dim opacity-60";
  return <span className={`cm-mono text-[11px] uppercase tracking-[0.14em] ${cls}`}>{text}</span>;
};

const ComparisonTable = () => (
  <section className="mx-auto max-w-4xl px-6 pb-28">
    <div className="mb-10 flex items-center gap-3">
      <span className="cm-mono cm-text-amber text-[10px] uppercase tracking-[0.22em]">
        03 / Field
      </span>
      <span className="cm-meta-rule flex-1" />
      <span className="cm-mono cm-text-dim text-[10px] uppercase tracking-[0.22em]">
        Comparison
      </span>
    </div>

    <h2 className="cm-serif text-[28px] sm:text-[36px] leading-[1.1] font-light mb-3">
      The others store links.
      <br />
      <span className="italic cm-text-amber">Cornerman trains you.</span>
    </h2>
    <p className="text-[15px] cm-text-dim mb-10 max-w-xl">
      Every tracker has columns. Only one puts you in the ring before the recruiter calls.
    </p>

    <div className="cm-roast-card overflow-x-auto rounded-2xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b cm-border">
            <th className="text-left p-5 cm-mono cm-text-dim text-[10px] uppercase tracking-[0.18em] font-normal">
              Feature
            </th>
            <th className="p-5 cm-mono cm-text-amber text-[10px] uppercase tracking-[0.18em] font-normal">
              Cornerman
            </th>
            <th className="p-5 cm-mono cm-text-dim text-[10px] uppercase tracking-[0.18em] font-normal">
              Huntr
            </th>
            <th className="p-5 cm-mono cm-text-dim text-[10px] uppercase tracking-[0.18em] font-normal">
              Teal
            </th>
            <th className="p-5 cm-mono cm-text-dim text-[10px] uppercase tracking-[0.18em] font-normal">
              Simplify
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((f, i) => (
            <tr key={f.label} className={i < features.length - 1 ? "border-b cm-border" : ""}>
              <td className="p-5 text-[14px]">{f.label}</td>
              <td className="p-5 text-center"><Cell value={f.jobtrackr} accent /></td>
              <td className="p-5 text-center"><Cell value={f.huntr} /></td>
              <td className="p-5 text-center"><Cell value={f.teal} /></td>
              <td className="p-5 text-center"><Cell value={f.simplify} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="cm-mono cm-text-dim text-[10px] uppercase tracking-[0.18em] mt-4 text-center">
      Comparison accurate as of April 2026. Some features require Pro.
    </p>
  </section>
);

export default ComparisonTable;
