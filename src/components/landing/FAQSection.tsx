import { useState } from "react";

const faqs = [
  {
    q: "Is the Ruthless Coach really brutal?",
    a: "It can be. There are four intensity levels — from Helpful to Nuclear. Pick your poison. It will not lie to make you feel good, but it will tell you exactly what to fix and why.",
  },
  {
    q: "How is the Interview Coach different from ChatGPT?",
    a: "It studies the actual job description and your CV, generates role-specific questions, scores each answer in real time on a STAR rubric, and gives you an overall readiness rating. It's purpose-built for interview prep — not a generic chatbot.",
  },
  {
    q: "What does the CV Roast actually do?",
    a: "Upload a CV, paste a job description. The roast returns a 0-10 score plus line-by-line cuts, reframes, and rewrites. It will never invent skills you don't have — only sharpen what's already there.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your data is encrypted and accessible only to you. No ads, no tracking, no third-party access. We never read your applications or CVs.",
  },
  {
    q: "Can I import from other tools?",
    a: "Import via CSV, paste a job URL for auto-fill, or screenshot any listing. Huntr and Teal export formats are auto-mapped.",
  },
  {
    q: "What job boards are supported?",
    a: "URL auto-fill works with LinkedIn, Indeed, Glassdoor, Reed, Greenhouse, and most company career pages. Screenshot capture works on any site.",
  },
];

const FAQSection = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-3xl px-6 pb-28">
      <div className="mb-10 flex items-center gap-3">
        <span className="cm-mono cm-text-amber text-[10px] uppercase tracking-[0.22em]">
          05 / Tape
        </span>
        <span className="cm-meta-rule flex-1" />
        <span className="cm-mono cm-text-dim text-[10px] uppercase tracking-[0.22em]">
          Questions
        </span>
      </div>

      <h2 className="cm-serif text-[28px] sm:text-[36px] leading-[1.1] font-light mb-10">
        Things people ask
        <br />
        <span className="italic cm-text-amber">before they sign up.</span>
      </h2>

      <div className="border-t cm-border">
        {faqs.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="border-b cm-border">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-6 py-5 text-left group"
                aria-expanded={isOpen}
              >
                <span className="cm-serif text-[18px] sm:text-[20px] leading-snug pr-4 group-hover:cm-text-amber transition-colors">
                  {faq.q}
                </span>
                <span
                  className={`cm-text-amber cm-mono text-lg shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="text-[15px] leading-[1.7] cm-text-dim pb-6 max-w-2xl">{faq.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FAQSection;
