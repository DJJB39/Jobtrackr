import { differenceInDays, isBefore, parseISO, startOfDay } from "date-fns";
import type { JobApplication, JobEvent } from "@/types/job";
import type { UserCV } from "@/hooks/useUserCV";

export const STALE_THRESHOLD_DAYS = 14;
export const GHOST_THRESHOLD_DAYS = 7;
export const ROAST_STALE_DAYS = 30;
export const INTERVIEW_IMMINENT_HOURS = 48;
export const INTERVIEW_NEAR_DAYS = 7;
export const MIN_ACTIVE_APPLICATIONS = 3;

export interface UpcomingItem {
  id: string;
  title: string;
  company: string;
  role: string;
  date: string;
  time: string | null;
  type: string;
  jobId: string;
}

export interface PastUnloggedEvent {
  job: JobApplication;
  event: JobEvent;
  daysAgo: number;
}

/**
 * Most-recent activity timestamp for a job. Considers:
 *   - createdAt
 *   - latest event date (events[].date)
 *   - latest event outcome (treated as an activity touch via event date)
 *
 * Notes/contacts on JobApplication do not carry per-field timestamps, so they
 * cannot bump activity on their own — any edit that also adds/touches an event
 * will be picked up via the event date.
 */
export function lastActivityDate(job: JobApplication): Date {
  let latest = new Date(job.createdAt).getTime();
  for (const evt of job.events ?? []) {
    try {
      const d = parseISO(evt.date).getTime();
      if (!Number.isNaN(d) && d > latest) latest = d;
    } catch { /* skip */ }
    if (evt.createdAt) {
      const c = new Date(evt.createdAt).getTime();
      if (!Number.isNaN(c) && c > latest) latest = c;
    }
  }
  return new Date(latest);
}

/** Latest event with a non-null outcome (most recent by event date). */
function latestOutcomeEvent(job: JobApplication): JobEvent | null {
  let best: { evt: JobEvent; t: number } | null = null;
  for (const evt of job.events ?? []) {
    if (!evt.outcome) continue;
    try {
      const t = parseISO(evt.date).getTime();
      if (Number.isNaN(t)) continue;
      if (!best || t > best.t) best = { evt, t };
    } catch { /* skip */ }
  }
  return best?.evt ?? null;
}

/** Same-stage 14+ days, not accepted/rejected. */
export function getStaleJobs(jobs: JobApplication[], today: Date = startOfDay(new Date())) {
  return jobs.filter((j) => {
    if (j.columnId === "accepted" || j.columnId === "rejected") return false;
    const days = differenceInDays(today, lastActivityDate(j));
    return days >= STALE_THRESHOLD_DAYS;
  });
}

/** Applied/Phone with no upcoming events, created 7+ days ago. */
export function getGhostJobs(jobs: JobApplication[], today: Date = startOfDay(new Date())) {
  return jobs.filter((j) => {
    if (j.columnId !== "applied" && j.columnId !== "phone") return false;
    const hasUpcoming = (j.events ?? []).some((e) => {
      try { return !isBefore(parseISO(e.date), today); } catch { return false; }
    });
    if (hasUpcoming) return false;
    // Skip if an outcome was logged on any event within the last 7 days.
    const recentOutcome = latestOutcomeEvent(j);
    if (recentOutcome) {
      try {
        const days = differenceInDays(today, parseISO(recentOutcome.date));
        if (days <= GHOST_THRESHOLD_DAYS) return false;
      } catch { /* ignore */ }
    }
    const days = differenceInDays(today, lastActivityDate(j));
    return days >= GHOST_THRESHOLD_DAYS;
  });
}

/** Events in upcoming window (in days). */
export function getUpcomingEvents(jobs: JobApplication[], days = 14, today: Date = startOfDay(new Date())): UpcomingItem[] {
  const cutoff = new Date(today.getTime() + days * 86400000);
  const items: UpcomingItem[] = [];
  for (const job of jobs) {
    for (const evt of job.events ?? []) {
      try {
        const d = parseISO(evt.date);
        if (!isBefore(d, today) && isBefore(d, cutoff)) {
          items.push({ id: evt.id, title: evt.title, company: job.company, role: job.role, date: evt.date, time: evt.time, type: evt.type, jobId: job.id });
        }
      } catch { /* skip */ }
    }
    if (job.closeDate) {
      try {
        const d = parseISO(job.closeDate);
        if (!isBefore(d, today) && isBefore(d, cutoff)) {
          items.push({ id: `deadline-${job.id}`, title: `Deadline: ${job.company}`, company: job.company, role: job.role, date: job.closeDate, time: null, type: "deadline", jobId: job.id });
        }
      } catch { /* skip */ }
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

/** Past events with no outcome logged. */
export function getPastUnloggedEvents(jobs: JobApplication[], today: Date = startOfDay(new Date())): PastUnloggedEvent[] {
  const out: PastUnloggedEvent[] = [];
  for (const job of jobs) {
    for (const evt of job.events ?? []) {
      if (evt.outcome) continue;
      try {
        const d = parseISO(evt.date);
        if (isBefore(d, today)) {
          out.push({ job, event: evt, daysAgo: differenceInDays(today, d) });
        }
      } catch { /* skip */ }
    }
  }
  return out.sort((a, b) => a.daysAgo - b.daysAgo);
}

// ─── Corner orders ──────────────────────────────────────────────────────────

export type CornerActionTool =
  | "coach"
  | "bootcamp"
  | "tailor"
  | "cover_letter"
  | "roast"
  | "add_job"
  | "log_outcome"
  | "move_rejected"
  | "open_job"
  | "view";

export interface CornerAction {
  label: string;
  tool: CornerActionTool;
  jobId?: string;
  eventId?: string;
  targetView?: string;
}

export interface CornerOrder {
  id: string;
  priority: number;
  headline: string;
  detail: string;
  primary: CornerAction;
  secondary?: CornerAction;
}

export interface RoastHistoryHint {
  /** Latest roast score (cleaned if available, else original). */
  lastScore: number | null;
  /** Previous roast score, for delta. */
  prevScore: number | null;
  /** ISO date string of last roast (cv.updated_at when assessment exists). */
  lastRoastAt: string | null;
  /** Whether CV has been edited since the last roast. */
  cvEditedSinceRoast: boolean;
}

function nearestInterview(job: JobApplication, today: Date): JobEvent | null {
  let best: { evt: JobEvent; hours: number } | null = null;
  for (const evt of job.events ?? []) {
    if (evt.type !== "interview") continue;
    if (evt.outcome) continue;
    try {
      const d = parseISO(evt.date);
      const hours = (d.getTime() - today.getTime()) / 3600000;
      if (hours < 0) continue;
      if (!best || hours < best.hours) best = { evt, hours };
    } catch { /* skip */ }
  }
  return best?.evt ?? null;
}

export function getCornerOrders(
  jobs: JobApplication[],
  cv: UserCV | null,
  roast: RoastHistoryHint | null = null,
  today: Date = new Date(),
): CornerOrder[] {
  const t0 = startOfDay(today);
  const orders: CornerOrder[] = [];

  // Pre-compute interview proximity per job
  const imminent: { job: JobApplication; evt: JobEvent; hours: number }[] = [];
  const near: { job: JobApplication; evt: JobEvent; days: number }[] = [];
  for (const job of jobs) {
    const evt = nearestInterview(job, today);
    if (!evt) continue;
    try {
      const d = parseISO(evt.date);
      const hours = (d.getTime() - today.getTime()) / 3600000;
      if (hours <= INTERVIEW_IMMINENT_HOURS) imminent.push({ job, evt, hours });
      else if (hours <= INTERVIEW_NEAR_DAYS * 24) near.push({ job, evt, days: Math.ceil(hours / 24) });
    } catch { /* skip */ }
  }
  imminent.sort((a, b) => a.hours - b.hours);
  near.sort((a, b) => a.days - b.days);

  // 1. Interview within 48h
  for (const { job, evt, hours } of imminent) {
    const h = Math.max(1, Math.round(hours));
    orders.push({
      id: `imminent-${job.id}-${evt.id}`,
      priority: 1,
      headline: "Fight night is close.",
      detail: `${job.company} — ${job.role} · interview in ${h}h`,
      primary: { label: "Open Bootcamp", tool: "bootcamp", jobId: job.id },
      secondary: { label: "Spar instead", tool: "coach", jobId: job.id },
    });
  }

  // 2. Interview within 7 days
  for (const { job, evt, days } of near) {
    orders.push({
      id: `near-${job.id}-${evt.id}`,
      priority: 2,
      headline: "Time to spar.",
      detail: `${job.company} — ${job.role} · interview in ${days}d`,
      primary: { label: "Open Coach", tool: "coach", jobId: job.id },
    });
  }

  // 3. Past events with no outcome
  const unlogged = getPastUnloggedEvents(jobs, t0);
  for (const { job, event, daysAgo } of unlogged) {
    orders.push({
      id: `unlogged-${job.id}-${event.id}`,
      priority: 3,
      headline: "How did it go? Log it or it didn't happen.",
      detail: `${job.company} — ${event.title} · ${daysAgo}d ago`,
      primary: { label: "Log outcome", tool: "log_outcome", jobId: job.id, eventId: event.id },
    });
  }

  // 4. Quiet applications (ghost)
  const ghosts = getGhostJobs(jobs, t0);
  for (const job of ghosts) {
    orders.push({
      id: `quiet-${job.id}`,
      priority: 4,
      headline: "They've gone quiet. Chase it or cut it.",
      detail: `${job.company} — ${job.role} · quiet ${differenceInDays(t0, lastActivityDate(job))}d`,
      primary: { label: "Draft follow-up", tool: "cover_letter", jobId: job.id },
      secondary: { label: "Move to rejected", tool: "move_rejected", jobId: job.id },
    });
  }

  // 5. Stale jobs (pre-applied)
  const stale = getStaleJobs(jobs, t0).filter((j) => j.columnId === "found");
  for (const job of stale) {
    orders.push({
      id: `stale-${job.id}`,
      priority: 5,
      headline: "Dead weight on the board. Apply or drop it.",
      detail: `${job.company} — ${job.role} · sitting ${differenceInDays(t0, lastActivityDate(job))}d`,
      primary: { label: "Open job", tool: "open_job", jobId: job.id },
      secondary: { label: "Drop it", tool: "move_rejected", jobId: job.id },
    });
  }

  // 6. Roast stale
  const roastStale =
    cv?.original_text &&
    (!roast?.lastRoastAt ||
      differenceInDays(t0, new Date(roast.lastRoastAt)) >= ROAST_STALE_DAYS ||
      roast?.cvEditedSinceRoast);
  if (roastStale) {
    orders.push({
      id: "roast-stale",
      priority: 6,
      headline: "Your CV has changed. Step back on the scales.",
      detail: roast?.lastRoastAt
        ? `Last roast ${differenceInDays(t0, new Date(roast.lastRoastAt))}d ago`
        : "No roast on record yet.",
      primary: { label: "Ruthless Review", tool: "roast" },
    });
  }

  // 7. Thin pipeline
  const active = jobs.filter((j) => j.columnId !== "rejected" && j.columnId !== "accepted");
  if (active.length < MIN_ACTIVE_APPLICATIONS) {
    orders.push({
      id: "thin-pipeline",
      priority: 7,
      headline: "Thin pipeline. A fighter needs fights.",
      detail: `${active.length} active application${active.length === 1 ? "" : "s"}.`,
      primary: { label: "Add application", tool: "add_job" },
    });
  }

  // 8. Fallback
  if (orders.length === 0) {
    orders.push({
      id: "quiet-corner",
      priority: 8,
      headline: "Corner's quiet.",
      detail: "Rest day — or get ahead with a spar.",
      primary: { label: "Open AI Studio", tool: "view", targetView: "ai" },
    });
  }

  return orders.sort((a, b) => a.priority - b.priority);
}

// ─── Fight record ───────────────────────────────────────────────────────────

export interface FightRecord {
  roastScore: number | null;
  roastDelta: number | null;
  interviewsThisMonth: number;
  responseRate: number | null;
}

const RESPONDED_STAGES = new Set<string>(["phone", "interview2", "final", "offer", "accepted"]);
const APPLIED_PLUS_STAGES = new Set<string>(["applied", "phone", "interview2", "final", "offer", "accepted", "rejected"]);

export function getFightRecord(jobs: JobApplication[], roast: RoastHistoryHint | null, today: Date = new Date()): FightRecord {
  const t0 = startOfDay(today);
  const monthStart = new Date(t0.getFullYear(), t0.getMonth(), 1);
  let interviewsThisMonth = 0;
  for (const job of jobs) {
    for (const evt of job.events ?? []) {
      if (evt.type !== "interview") continue;
      try {
        const d = parseISO(evt.date);
        if (d >= monthStart && d < new Date(t0.getFullYear(), t0.getMonth() + 1, 1)) interviewsThisMonth++;
      } catch { /* skip */ }
    }
  }
  const appliedPlus = jobs.filter((j) => APPLIED_PLUS_STAGES.has(j.columnId)).length;
  const responded = jobs.filter((j) => RESPONDED_STAGES.has(j.columnId)).length;
  const responseRate = appliedPlus > 0 ? Math.round((responded / appliedPlus) * 100) : null;
  return {
    roastScore: roast?.lastScore ?? null,
    roastDelta:
      roast?.lastScore != null && roast?.prevScore != null
        ? roast.lastScore - roast.prevScore
        : null,
    interviewsThisMonth,
    responseRate,
  };
}

/** Derive a roast history hint from the lightweight UserCV record. */
export function roastHintFromCV(cv: UserCV | null): RoastHistoryHint | null {
  if (!cv) return null;
  const lastScore = cv.cleaned_score ?? cv.original_score ?? null;
  const prevScore = cv.cleaned_score != null ? cv.original_score : null;
  const lastRoastAt = cv.assessment_jsonb ? cv.updated_at : null;
  // Without a separate roast log we approximate "edited since roast" as false.
  return { lastScore, prevScore, lastRoastAt, cvEditedSinceRoast: false };
}

// ─── Corner talk (deterministic fallback rotation) ──────────────────────────

export const CORNER_TALK_FALLBACKS = [
  "Hands up. Chin down. Work.",
  "Pipeline's a heavy bag. Hit it.",
  "Excuses don't get offers.",
  "Tape never lies. Roll it again.",
  "Sharpen one thing today, not five.",
  "The job's not coming to you. Move.",
  "Quiet weeks are where reps are built.",
  "Read the room before you read the script.",
  "You're one good answer from a yes.",
  "Stand up. Round two.",
];

export function getCornerTalk(today: Date = new Date()): string {
  const start = new Date(today.getFullYear(), 0, 0);
  const day = Math.floor((today.getTime() - start.getTime()) / 86400000);
  return CORNER_TALK_FALLBACKS[day % CORNER_TALK_FALLBACKS.length];
}