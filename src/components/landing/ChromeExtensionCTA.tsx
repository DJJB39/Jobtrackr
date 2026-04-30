const ChromeExtensionCTA = () => (
  <section className="mx-auto max-w-3xl px-6 pb-28">
    <div className="cm-roast-card rounded-2xl p-8 sm:p-10">
      <div className="flex items-center gap-3 mb-5">
        <span className="cm-mono cm-text-amber text-[10px] uppercase tracking-[0.22em]">
          / Extension
        </span>
        <span className="cm-meta-rule flex-1" />
      </div>

      <h3 className="cm-serif text-[24px] sm:text-[28px] leading-[1.15] font-light mb-3">
        Capture jobs from
        <span className="italic cm-text-amber"> any tab.</span>
      </h3>
      <p className="text-[15px] leading-[1.65] cm-text-dim max-w-xl mb-6">
        Save listings directly from LinkedIn, Indeed, Reed, and Greenhouse with one click.
        Auto-fill details and add to your board instantly — no tab switching required.
      </p>

      <div className="flex flex-wrap gap-2 mb-7">
        {["LinkedIn", "Indeed", "Reed", "Greenhouse"].map((site) => (
          <span
            key={site}
            className="cm-mono text-[10px] uppercase tracking-[0.18em] cm-text-dim border cm-border rounded-full px-3 py-1"
          >
            {site}
          </span>
        ))}
      </div>

      <p className="cm-mono cm-text-dim text-[10px] uppercase tracking-[0.18em]">
        Source in /chrome-extension · load unpacked at chrome://extensions
      </p>
    </div>
  </section>
);

export default ChromeExtensionCTA;
