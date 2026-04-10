/**
 * Test: DayBeforeBootcamp — rendering, schedule view, integration states
 */
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, createMockJob } from "./test-utils";
import DayBeforeBootcamp from "@/components/DayBeforeBootcamp";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

vi.mock("@/integrations/lovable/index", () => ({
  lovable: { auth: { signInWithOAuth: vi.fn() } },
}));

describe("DayBeforeBootcamp", () => {
  const jobWithInterview = createMockJob({
    events: [{
      id: "ev1",
      title: "Interview",
      date: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      time: "10:00",
      type: "interview",
      location: "Zoom",
      prepNotes: "",
      outcome: "pending",
      createdAt: new Date().toISOString(),
    }],
  });

  it("renders when open", () => {
    renderWithProviders(
      <DayBeforeBootcamp job={jobWithInterview} open={true} onOpenChange={() => {}} onStartRoast={() => {}} />
    );
    expect(screen.getByText(/day before bootcamp/i)).toBeInTheDocument();
  });

  it("shows generate button initially", () => {
    renderWithProviders(
      <DayBeforeBootcamp job={jobWithInterview} open={true} onOpenChange={() => {}} onStartRoast={() => {}} />
    );
    expect(screen.getByRole("button", { name: /generate/i })).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const { container } = renderWithProviders(
      <DayBeforeBootcamp job={jobWithInterview} open={false} onOpenChange={() => {}} onStartRoast={() => {}} />
    );
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });
});
