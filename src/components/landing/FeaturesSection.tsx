const features = [
  {
    label: "/ Coach",
    title: "Ruthless Interview Coach",
    desc: "Live AI interviewer trained on the role and the cracks in your CV. STAR scoring, replays, four intensity levels.",
  },
  {
    label: "/ Roast",
    title: "CV Roast & Suitability",
    desc: "Line-by-line cuts, reframes, rewrites. A 0-10 score against any job description. Honest. Specific. No flattery.",
  },
  {
    label: "/ Capture",
    title: "Screenshot Job Capture",
    desc: "Snap a listing — anywhere. The vision model extracts company, role, salary, and deadline straight onto your board.",
  },
  {
    label: "/ Board",
    title: "Kanban that gets out of the way",
    desc: "Drag and drop across customisable stages. Filter by role, salary, or status. Quietly there when you need it.",
  },
  {
    label: "/ Auto-fill",
    title: "URL auto-fill",
    desc: "Paste a posting link — get company, role, salary, and deadline pre-filled. Works on most major boards.",
  },
  {
    label: "/ Calendar",
    title: "Events & reminders",
    desc: "Schedule interviews, deadlines, and follow-ups. Export to Google Calendar with one click.",
  },
  {
    label: "/ Tailor",
    title: "AI CV Tailor",
    desc: "Per-job rewrites with a side-by-side diff. Strict honesty rules — sharpens your CV, never invents skills.",
  },
  {
    label: "/ Private",
    title: "Encrypted by default",
    desc: "Your data is encrypted and only accessible to you. No tracking, no ads, no third-party access. Ever.",
  },
];

const FeaturesSection = () => (
  <section className="mx-auto max-w-5xl px-6 pb-32">
    <div className="mb-10 flex items-center gap-3">
      <span className="cm-mono cm-text-amber text-[10px] uppercase tracking-[0.22em]">
        02b / Arsenal
      </span>
      <span className="cm-meta-rule flex-1" />
      <span className="cm-mono cm-text-dim text-[10px] uppercase tracking-[0.22em]">
        Eight tools
      </span>
    </div>

    <h2 className="cm-serif text-[28px] sm:text-[36px] leading-[1.1] font-light mb-3">
      Not just a tracker.
      <br />
      <span className="italic cm-text-amber">A whole corner.</span>
    </h2>
    <p className="text-[15px] cm-text-dim mb-12 max-w-xl">
      Preparation, insight, and confidence — wrapped in tools that stay out of the way.
    </p>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {features.map((f) => (
        <div key={f.title} className="cm-roast-card cm-card-hover rounded-2xl p-6">
          <p className="cm-mono cm-text-amber text-[10px] uppercase tracking-[0.22em] mb-4">
            {f.label}
          </p>
          <h3 className="cm-serif text-[18px] leading-[1.25] mb-2">{f.title}</h3>
          <p className="text-[13.5px] leading-[1.6] cm-text-dim">{f.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

export default FeaturesSection;
