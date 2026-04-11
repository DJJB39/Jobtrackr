import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is it really free?",
    a: "Yes — 100 % free with no hidden fees. Every feature, including AI interview coaching, CV roast, screenshot capture, and email reminders, is available at no cost. We believe job seekers shouldn't have to pay to stay organised.",
  },
  {
    q: "How is the Interview Coach different from ChatGPT?",
    a: "The Interview Coach generates role-specific questions based on the actual job description you're applying for, scores each answer in real time, and gives you an overall readiness rating. It's purpose-built for interview prep — not a generic chatbot.",
  },
  {
    q: "What does the CV Roast actually do?",
    a: "Upload your CV and paste a job description. Our AI compares them and returns a suitability score with specific, actionable feedback — what's missing, what's strong, and what to change before you hit apply.",
  },
  {
    q: "Is my data private?",
    a: "Absolutely. Your data is encrypted and accessible only to you. We never share, sell, or display your information to anyone — no ads, no tracking, no third-party access.",
  },
  {
    q: "Can I import from other tools?",
    a: "You can import applications via CSV, paste a job URL for auto-fill, or use our screenshot capture to snap a listing from any site. Bulk import from other trackers is on our roadmap.",
  },
  {
    q: "What job boards are supported?",
    a: "Our URL auto-fill works with most major boards including LinkedIn, Indeed, Glassdoor, Reed, Greenhouse, and company career pages. The screenshot capture feature works with any site.",
  },
];

const FAQSection = () => (
  <motion.section
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.5 }}
    className="mx-auto max-w-2xl px-6 pb-28"
  >
    <h2 className="text-center text-2xl font-display font-bold text-foreground mb-2">
      Frequently Asked Questions
    </h2>
    <p className="text-center text-muted-foreground mb-10 text-sm">
      Everything you need to know about JobTrackr.
    </p>

    <Accordion type="single" collapsible className="space-y-2">
      {faqs.map((faq, i) => (
        <AccordionItem
          key={i}
          value={`faq-${i}`}
          className="rounded-xl border border-border glass px-5 data-[state=open]:shadow-glow/20"
        >
          <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline">
            {faq.q}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
            {faq.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </motion.section>
);

export default FAQSection;
