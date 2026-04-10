/**
 * Test: Zustand jobStore — state management, CRUD, activity diffing
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase before importing store
vi.mock("@/integrations/supabase/client", () => {
  const mockFrom = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));

  return {
    supabase: {
      from: mockFrom,
      auth: {
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      },
    },
  };
});

import { useJobStore } from "@/stores/jobStore";

describe("jobStore", () => {
  beforeEach(() => {
    // Reset store state between tests
    useJobStore.setState({ jobs: [], loading: true, searchQuery: "" });
  });

  it("initializes with empty jobs and loading true", () => {
    const state = useJobStore.getState();
    expect(state.jobs).toEqual([]);
    expect(state.loading).toBe(true);
  });

  it("setSearchQuery updates search state", () => {
    useJobStore.getState().setSearchQuery("react");
    expect(useJobStore.getState().searchQuery).toBe("react");
  });

  it("setJobs with array replaces jobs", () => {
    const mockJobs = [
      { id: "1", company: "Acme", role: "Dev", columnId: "applied", createdAt: "2026-01-01", notes: "", contacts: [], nextSteps: [], links: [], applicationType: "Other", events: [] },
    ] as any;

    useJobStore.getState().setJobs(mockJobs);
    expect(useJobStore.getState().jobs).toHaveLength(1);
    expect(useJobStore.getState().jobs[0].company).toBe("Acme");
  });

  it("setJobs with updater function works", () => {
    const initial = { id: "1", company: "A", role: "R", columnId: "found", createdAt: "", notes: "", contacts: [], nextSteps: [], links: [], applicationType: "Other", events: [] } as any;
    useJobStore.setState({ jobs: [initial] });

    useJobStore.getState().setJobs((prev) => [...prev, { ...initial, id: "2", company: "B" }]);
    expect(useJobStore.getState().jobs).toHaveLength(2);
  });

  it("deleteJob removes job from state and returns undoFn", async () => {
    const job = { id: "del-1", company: "DeleteMe", role: "Role", columnId: "applied", createdAt: "", notes: "", contacts: [], nextSteps: [], links: [], applicationType: "Other", events: [] } as any;
    useJobStore.setState({ jobs: [job] });

    const { undoFn } = await useJobStore.getState().deleteJob("del-1");
    expect(useJobStore.getState().jobs).toHaveLength(0);
    expect(undoFn).toBeDefined();
  });

  it("deleteJob undoFn restores job", async () => {
    const job = { id: "undo-1", company: "UndoMe", role: "Role", columnId: "applied", createdAt: "", notes: "", contacts: [], nextSteps: [], links: [], applicationType: "Other", events: [] } as any;
    useJobStore.setState({ jobs: [job] });

    const { undoFn } = await useJobStore.getState().deleteJob("undo-1");
    expect(useJobStore.getState().jobs).toHaveLength(0);

    undoFn?.();
    expect(useJobStore.getState().jobs).toHaveLength(1);
    expect(useJobStore.getState().jobs[0].company).toBe("UndoMe");
  });

  it("deleteJob returns null undoFn for non-existent job", async () => {
    const { undoFn } = await useJobStore.getState().deleteJob("nonexistent");
    expect(undoFn).toBeNull();
  });
});

// --- Activity diff logic (extracted for testability) ---
describe("Activity Diff Logic", () => {
  function diffActivityLogs(
    oldJob: any,
    newJob: any
  ): { action: string; details: Record<string, string> }[] {
    const logs: { action: string; details: Record<string, string> }[] = [];
    if (oldJob.columnId !== newJob.columnId) {
      logs.push({ action: "stage_change", details: { from: oldJob.columnId, to: newJob.columnId } });
    }
    if (oldJob.notes !== newJob.notes) {
      logs.push({ action: "notes_edited", details: {} });
    }
    if (oldJob.contacts.length !== newJob.contacts.length) {
      logs.push({
        action: oldJob.contacts.length < newJob.contacts.length ? "contact_added" : "contact_removed",
        details: {},
      });
    }
    if ((oldJob.events?.length ?? 0) !== (newJob.events?.length ?? 0)) {
      logs.push({
        action: (oldJob.events?.length ?? 0) < (newJob.events?.length ?? 0) ? "event_added" : "event_removed",
        details: {},
      });
    }
    return logs;
  }

  const baseJob = { columnId: "applied", notes: "test", contacts: [{ id: "1" }], events: [{ id: "1" }], links: [] };

  it("detects stage change", () => {
    const logs = diffActivityLogs(baseJob, { ...baseJob, columnId: "interview2" });
    expect(logs).toContainEqual({ action: "stage_change", details: { from: "applied", to: "interview2" } });
  });

  it("detects notes edited", () => {
    const logs = diffActivityLogs(baseJob, { ...baseJob, notes: "updated" });
    expect(logs).toContainEqual({ action: "notes_edited", details: {} });
  });

  it("detects contact added", () => {
    const logs = diffActivityLogs(baseJob, { ...baseJob, contacts: [{ id: "1" }, { id: "2" }] });
    expect(logs).toContainEqual({ action: "contact_added", details: {} });
  });

  it("detects event removed", () => {
    const logs = diffActivityLogs(baseJob, { ...baseJob, events: [] });
    expect(logs).toContainEqual({ action: "event_removed", details: {} });
  });

  it("returns empty for no changes", () => {
    const logs = diffActivityLogs(baseJob, { ...baseJob });
    expect(logs).toHaveLength(0);
  });
});
