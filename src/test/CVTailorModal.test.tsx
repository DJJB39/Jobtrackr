/**
 * Test: CVTailorModal — rendering, diff view, accept/reject, honesty disclaimers
 */
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, createMockJob } from "./test-utils";
import CVTailorModal from "@/components/CVTailorModal";

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

describe("CVTailorModal", () => {
  const mockJob = createMockJob({ description: "We need a React developer with 5 years experience." });

  it("renders dialog title when open", () => {
    renderWithProviders(
      <CVTailorModal job={mockJob} open={true} onOpenChange={() => {}} onStartRoast={() => {}} />
    );
    expect(screen.getByText(/tailor cv/i)).toBeInTheDocument();
  });

  it("shows honesty disclaimer", () => {
    renderWithProviders(
      <CVTailorModal job={mockJob} open={true} onOpenChange={() => {}} onStartRoast={() => {}} />
    );
    expect(screen.getByText(/nothing is invented/i)).toBeInTheDocument();
  });

  it("shows tailor button", () => {
    renderWithProviders(
      <CVTailorModal job={mockJob} open={true} onOpenChange={() => {}} onStartRoast={() => {}} />
    );
    expect(screen.getByRole("button", { name: /tailor/i })).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const { container } = renderWithProviders(
      <CVTailorModal job={mockJob} open={false} onOpenChange={() => {}} onStartRoast={() => {}} />
    );
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });
});
