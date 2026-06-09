import { describe, it, expect } from "vitest";
import {
  getCornerOrders,
  getGhostJobs,
  GHOST_THRESHOLD_DAYS,
  STALE_THRESHOLD_DAYS,
  INTERVIEW_IMMINENT_HOURS,
} from "@/lib/cornerLogic";
import type { JobApplication, JobEvent } from "@/types/job";
import type { UserCV } from "@/hooks/useUserCV";

const TODAY = new Date("2026-06-09T12:00:00Z");
const daysAgo = (n: number) => new Date(TODAY.getTime() - n * 86400000).toISOString();
const hoursFromNow = (n: number) => new Date(TODAY.getTime() + n * 3600000).toISOString();

const baseJob = (overrides: Partial<JobApplication> = {}): JobApplication => ({
  id: overrides.id ?? "j1",
  company: "Acme",
  role: "Engineer",
  columnId: "applied",
  createdAt: daysAgo(2),
  notes: "",
  contacts: [],
  nextSteps: [],
  links: [],
  applicationType: "Engineering",
  events: [],
  ...overrides,
});

const event = (overrides: Partial<JobEvent> = {}): JobEvent => ({
  id: overrides.id ?? "e1",
  title: "Interview",
  date: overrides.date ?? hoursFromNow(72),
  time: null,
  type: "interview",
  location: null,
  prepNotes: null,
  outcome: null,
  createdAt: daysAgo(1),
  ...overrides,
});

describe("cornerLogic", () => {
  describe("getCornerOrders priority ordering", () => {
    it("orders all 8 rules by ascending priority", () => {
      const jobs: JobApplication[] = [
        // p1: imminent interview (<48h)
        baseJob({ id: "imminent", columnId: "interview2", events: [event({ id: "e-imm", date: hoursFromNow(12) })] }),
        // p2: near interview (<7d)
        baseJob({ id: "near", columnId: "interview2", events: [event({ id: "e-near", date: hoursFromNow(72) })] }),
        // p3: past unlogged outcome
        baseJob({ id: "past", columnId: "phone", events: [event({ id: "e-past", date: daysAgo(3), outcome: null })] }),
        // p4: ghost (applied 10d ago, no events, no outcomes)
        baseJob({ id: "ghost", columnId: "applied", createdAt: daysAgo(10), events: [] }),
        // p5: stale found (sitting 20d)
        baseJob({ id: "stale", columnId: "found", createdAt: daysAgo(20), events: [] }),
      ];
      const orders = getCornerOrders(jobs, null, null, TODAY);
      const priorities = orders.map((o) => o.priority);
      const sorted = [...priorities].sort((a, b) => a - b);
      expect(priorities).toEqual(sorted);
      expect(priorities[0]).toBe(1);
      expect(priorities).toContain(2);
      expect(priorities).toContain(3);
      expect(priorities).toContain(4);
      expect(priorities).toContain(5);
    });

    it("includes roast-stale (p6) when CV has no roast yet", () => {
      const cv = { original_text: "hi", updated_at: daysAgo(60) } as unknown as UserCV;
      const orders = getCornerOrders([baseJob({ columnId: "found", createdAt: daysAgo(1) })], cv, null, TODAY);
      expect(orders.some((o) => o.priority === 6)).toBe(true);
    });

    it("includes thin-pipeline (p7) when fewer than 3 active applications", () => {
      const orders = getCornerOrders([baseJob({ columnId: "applied", createdAt: daysAgo(1) })], null, null, TODAY);
      expect(orders.some((o) => o.priority === 7)).toBe(true);
    });
  });

  describe("imminent vs near boundary (48h)", () => {
    it("treats interview at 47h as imminent (p1)", () => {
      const jobs = [baseJob({ columnId: "interview2", events: [event({ date: hoursFromNow(47) })] })];
      const orders = getCornerOrders(jobs, null, null, TODAY);
      const ints = orders.filter((o) => o.priority === 1 || o.priority === 2);
      expect(ints[0].priority).toBe(1);
    });

    it("treats interview at 49h as near (p2)", () => {
      const jobs = [baseJob({ columnId: "interview2", events: [event({ date: hoursFromNow(49) })] })];
      const orders = getCornerOrders(jobs, null, null, TODAY);
      const ints = orders.filter((o) => o.priority === 1 || o.priority === 2);
      expect(ints[0].priority).toBe(2);
    });

    it("exact 48h falls into imminent", () => {
      const jobs = [baseJob({ columnId: "interview2", events: [event({ date: hoursFromNow(INTERVIEW_IMMINENT_HOURS) })] })];
      const orders = getCornerOrders(jobs, null, null, TODAY);
      const ints = orders.filter((o) => o.priority === 1 || o.priority === 2);
      expect(ints[0].priority).toBe(1);
    });
  });

  describe("ghost exclusion when outcome recently logged", () => {
    it("excludes a job whose latest event has an outcome within the last 7 days", () => {
      const job = baseJob({
        id: "recent-outcome",
        columnId: "applied",
        createdAt: daysAgo(20),
        events: [event({ id: "e-out", date: daysAgo(3), outcome: "rejected" })],
      });
      expect(getGhostJobs([job], TODAY)).toEqual([]);
    });

    it("still flags a job whose only outcome event is older than 7 days", () => {
      const job = baseJob({
        id: "old-outcome",
        columnId: "applied",
        createdAt: daysAgo(30),
        events: [event({ id: "e-old", date: daysAgo(20), outcome: "passed" })],
      });
      const ghosts = getGhostJobs([job], TODAY);
      expect(ghosts).toHaveLength(1);
    });

    it("still flags a plain ghost with no events at all", () => {
      const job = baseJob({ id: "ghost", columnId: "applied", createdAt: daysAgo(GHOST_THRESHOLD_DAYS + 1), events: [] });
      const ghosts = getGhostJobs([job], TODAY);
      expect(ghosts).toHaveLength(1);
    });
  });

  describe("empty-state fallback", () => {
    it("returns the 'Corner's quiet' fallback (p8) when nothing else applies", () => {
      // Three active applications with no events and recent createdAt — nothing triggers.
      const jobs: JobApplication[] = [
        baseJob({ id: "a", columnId: "applied", createdAt: daysAgo(1) }),
        baseJob({ id: "b", columnId: "applied", createdAt: daysAgo(1) }),
        baseJob({ id: "c", columnId: "applied", createdAt: daysAgo(1) }),
      ];
      const orders = getCornerOrders(jobs, null, null, TODAY);
      expect(orders).toHaveLength(1);
      expect(orders[0].priority).toBe(8);
      expect(orders[0].id).toBe("quiet-corner");
      expect(orders[0].primary.tool).toBe("view");
    });

    it("STALE_THRESHOLD_DAYS guard: a found job younger than threshold does not produce p5", () => {
      const jobs = [
        baseJob({ id: "fresh", columnId: "found", createdAt: daysAgo(STALE_THRESHOLD_DAYS - 1) }),
        baseJob({ id: "a", columnId: "applied", createdAt: daysAgo(1) }),
        baseJob({ id: "b", columnId: "applied", createdAt: daysAgo(1) }),
      ];
      const orders = getCornerOrders(jobs, null, null, TODAY);
      expect(orders.some((o) => o.priority === 5)).toBe(false);
    });
  });
});