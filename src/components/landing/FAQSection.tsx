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
    a: "Yes — 100% free with no hidden fees. Every feature, including AI assist, CV suitability, and email reminders, is available at no cost. We believe job seekers shouldn't have to pay to stay organized.",
  },
  {
    q: "Is my data private?",
    a: "Absolutely. Your data is encrypted and accessible only to you. We never share, sell, or display your information to anyone — no ads, no tracking, no third-party access.",
  },
  {
    q: "Can I import from other tools?",
    a: "Not yet, but it's on our roadmap. For now, you can quickly add applications by pasting a job URL and we'll auto-fill the details for you.",
  },
  {
    q: "How does the AI work?",
    a: "Our AI assistant can generate tailored cover letters, prep interview questions, and score your CV against job descriptions. It uses your uploaded CV and the job details to give you personalized insights.",
  },
  {
    q: "What job boards are supported?",
    a: "Our URL auto-fill works with most major job boards including LinkedIn, Indeed, Glassdoor, and company career pages. If a page has structured job data, we can usually extract it.",
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
