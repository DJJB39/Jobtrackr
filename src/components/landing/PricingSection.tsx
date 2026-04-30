import { Link } from "react-router-dom";

/**
 * Cornerman pricing — two-card editorial layout (Free + Pro).
 * Designed to live inside the .cornerman wrapper.
 */
const freeFeatures = [
  "Unlimited applications",
  "Kanban with custom stages",
  "URL auto-fill + screenshot capture",
  "10 AI calls / month",
  "Calendar & reminders",
  "CSV import / export",
];

const proFeatures = [
  "Everything in Free",
  "Unlimited AI calls",
  "Ruthless Interview Coach with scoring",
  "Ruthless CV Roast (all 4 levels)",
  "One-click CV Tailor",
  "Day Before Bootcamp",
  "Weekly pipeline digest",
  "Priority support",
];

const PricingSection = () => (
  <section id="pricing" className="mx-auto max-w-4xl px-6 pb-28">
    <div className="mb-10 flex items-center gap-3">
      <span className="cm-mono cm-text-amber text-[10px] uppercase tracking-[0.22em]">
        04 / Pricing
      </span>
      <span className="cm-meta-rule flex-1" />
      <span className="cm-mono cm-text-dim text-[10px] uppercase tracking-[0.22em]">
        Free or Pro
      </span>
    </div>

    <h2 className="cm-serif text-[28px] sm:text-[36px] leading-[1.1] font-light mb-3">
      Free is generous.
      <br />
      <span className="italic cm-text-amber">Pro is for the obsessed.</span>
    </h2>
    <p className="text-[15px] cm-text-dim mb-10 max-w-xl">
      Start free. Upgrade when you want unlimited reps with the coach.
    </p>

    <div className="grid gap-5 sm:grid-cols-2">
      {/* Free */}
      <div className="cm-roast-card rounded-2xl p-7">
        <p className="cm-mono cm-text-dim text-[10px] uppercase tracking-[0.22em] mb-4">
          / Free
        </p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="cm-serif text-[44px] leading-none font-light">£0</span>
          <span className="cm-text-dim text-sm">forever</span>
        </div>
        <p className="cm-text-dim text-sm mb-7">Generous free tier.</p>

        <ul className="space-y-3 mb-8">
          {freeFeatures.map((label) => (
            <li key={label} className="flex items-start gap-3 text-[14px]">
              <span className="cm-text-amber select-none mt-0.5">›</span>
              <span>{label}</span>
            </li>
          ))}
        </ul>

        <Link
          to="/auth?tab=signup"
          className="cm-cta-ghost inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm"
        >
          Get started free
        </Link>
      </div>

      {/* Pro */}
      <div className="cm-roast-card rounded-2xl p-7 relative cm-border-strong" style={{ borderColor: "var(--cm-line-strong)" }}>
        <div className="absolute top-7 right-7">
          <span className="cm-mono cm-text-amber text-[10px] uppercase tracking-[0.22em]">
            Most popular
          </span>
        </div>
        <p className="cm-mono cm-text-amber text-[10px] uppercase tracking-[0.22em] mb-4">
          / Pro
        </p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="cm-serif text-[44px] leading-none font-light">£9</span>
          <span className="cm-text-dim text-sm">/ month</span>
        </div>
        <p className="cm-text-dim text-sm mb-7">£69 / year · for serious job seekers.</p>

        <ul className="space-y-3 mb-8">
          {proFeatures.map((label) => (
            <li key={label} className="flex items-start gap-3 text-[14px]">
              <span className="cm-text-amber select-none mt-0.5">›</span>
              <span>{label}</span>
            </li>
          ))}
        </ul>

        <Link
          to="/pricing"
          className="cm-cta-primary inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm"
        >
          Upgrade to Pro →
        </Link>
      </div>
    </div>
  </section>
);

export default PricingSection;
