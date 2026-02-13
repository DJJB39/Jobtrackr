import { useState, useCallback, useMemo } from "react";
import type { JobApplication, ColumnId } from "@/types/job";

const DEMO_JOBS: JobApplication[] = [
  {
    id: "demo-1",
    company: "Stripe",
    role: "Senior Frontend Engineer",
    columnId: "interview2",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    notes: "Great culture fit. Team uses React + TypeScript.",
    contacts: [{ id: "c1", name: "Lisa Chen", role: "Hiring Manager", email: "lisa@stripe.com" }],
    nextSteps: [{ id: "ns1", text: "Prepare system design examples", done: true }, { id: "ns2", text: "Research Stripe's payment APIs", done: false }],
    links: ["https://stripe.com/jobs"],
    applicationType: "Frontend",
    location: "San Francisco, CA (Hybrid)",
    salary: "$180k – $220k",
    description: "Build and maintain Stripe's merchant-facing dashboard. Work closely with design and product teams.",
    events: [
      { id: "e1", title: "Technical Interview", date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), time: "14:00", type: "interview", location: "Zoom", prepNotes: "Review React performance patterns", outcome: null, createdAt: new Date().toISOString() },
    ],
  },
  {
    id: "demo-2",
    company: "Figma",
    role: "Product Designer",
    columnId: "applied",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    notes: "Applied via referral from Alex.",
    contacts: [],
    nextSteps: [{ id: "ns3", text: "Follow up in 5 days", done: false }],
    links: ["https://figma.com/careers"],
    applicationType: "Design",
    location: "Remote (US)",
    salary: "$140k – $175k",
    events: [],
  },
  {
    id: "demo-3",
    company: "Vercel",
    role: "Full Stack Engineer",
    columnId: "phone",
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    notes: "Recruiter reached out on LinkedIn. Next.js team.",
    contacts: [{ id: "c2", name: "Sam Park", role: "Recruiter", email: "sam@vercel.com" }],
    nextSteps: [],
    links: [],
    applicationType: "Full Stack",
    location: "Remote",
    salary: "$160k – $200k",
    events: [
      { id: "e2", title: "Phone Screen with Recruiter", date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10), time: "10:00", type: "interview", location: "Phone", prepNotes: null, outcome: "passed", createdAt: new Date().toISOString() },
    ],
  },
  {
    id: "demo-4",
    company: "Linear",
    role: "Frontend Engineer",
    columnId: "found",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    notes: "",
    contacts: [],
    nextSteps: [{ id: "ns4", text: "Tailor resume for this role", done: false }],
    links: ["https://linear.app/careers"],
    applicationType: "Frontend",
    location: "Remote (EU/US)",
    salary: "$150k – $190k",
    events: [],
  },
  {
    id: "demo-5",
    company: "Notion",
    role: "Software Engineer",
    columnId: "offer",
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    notes: "Offer received! Negotiating equity.",
    contacts: [{ id: "c3", name: "Maria Lopez", role: "VP Engineering", email: "maria@notion.so" }],
    nextSteps: [{ id: "ns5", text: "Counter-offer by Friday", done: false }],
    links: [],
    applicationType: "Full Stack",
    location: "New York, NY",
    salary: "$195k + equity",
    description: "Work on core editor experience. Small, high-impact team.",
    events: [],
  },
  {
    id: "demo-6",
    company: "Airbnb",
    role: "Frontend Engineer",
    columnId: "rejected",
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    notes: "Rejected after final round. Feedback: wanted more backend experience.",
    contacts: [],
    nextSteps: [],
    links: [],
    applicationType: "Frontend",
    location: "San Francisco, CA",
    salary: "$170k – $210k",
    events: [],
  },
];

export function useGuestMode() {
  const [jobs, setJobs] = useState<JobApplication[]>(DEMO_JOBS);

  const addJob = useCallback((company: string, role: string, columnId: ColumnId, applicationType: string, extras?: { location?: string; description?: string; links?: string[]; salary?: string; closeDate?: string }) => {
    const newJob: JobApplication = {
      id: `demo-${Date.now()}`,
      company,
      role,
      columnId,
      applicationType,
      createdAt: new Date().toISOString(),
      notes: "",
      contacts: [],
      nextSteps: [],
      links: extras?.links ?? [],
      events: [],
      location: extras?.location,
      description: extras?.description,
      salary: extras?.salary,
      closeDate: extras?.closeDate,
    };
    setJobs((prev) => [newJob, ...prev]);
  }, []);

  const updateJob = useCallback((updated: JobApplication) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  }, []);

  const deleteJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  return { jobs, setJobs, loading: false, addJob, updateJob, deleteJob };
}
