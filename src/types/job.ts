/** Default stage IDs. Custom stages may use any string. */
export type DefaultColumnId =
  | "found"
  | "applied"
  | "phone"
  | "interview2"
  | "final"
  | "offer"
  | "accepted"
  | "rejected";

/** ColumnId accepts default stages AND custom user-created stage IDs. */
export type ColumnId = DefaultColumnId | (string & {});

export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
}

export interface NextStep {
  id: string;
  text: string;
  done: boolean;
}

export const APPLICATION_TYPES = [
  "Frontend",
  "Backend",
  "Full Stack",
  "Design",
  "Product",
  "Other",
] as const;

export type ApplicationType = (typeof APPLICATION_TYPES)[number];

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  columnId: ColumnId;
  createdAt: string;
  notes: string;
  contacts: Contact[];
  nextSteps: NextStep[];
  links: string[];
  applicationType: string;
  location?: string;
  description?: string;
  salary?: string;
  closeDate?: string;
  events: JobEvent[];
}

export type EventType = "interview" | "follow_up" | "deadline";
export type EventOutcome = "passed" | "rejected" | "pending" | "rescheduled" | null;

export interface JobEvent {
  id: string;
  title: string;
  date: string;
  time: string | null;
  type: EventType;
  location: string | null;
  prepNotes: string | null;
  outcome: EventOutcome;
  createdAt: string;
}

export interface Column {
  id: ColumnId;
  title: string;
  colorClass: string;
}

export const COLUMNS: Column[] = [
  { id: "found", title: "Found", colorClass: "bg-status-found" },
  { id: "applied", title: "Applied", colorClass: "bg-status-applied" },
  { id: "phone", title: "Phone Screen", colorClass: "bg-status-phone" },
  { id: "interview2", title: "2nd Interview", colorClass: "bg-status-interview2" },
  { id: "final", title: "Final Interview", colorClass: "bg-status-final" },
  { id: "offer", title: "Offer", colorClass: "bg-status-offer" },
  { id: "accepted", title: "Accepted", colorClass: "bg-status-accepted" },
  { id: "rejected", title: "Rejected", colorClass: "bg-status-rejected" },
];
