import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "./test-utils";
import ResetPassword from "@/pages/ResetPassword";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      updateUser: vi.fn(),
    },
  },
}));

describe("ResetPassword Page", () => {
  it("AF-07: shows verifying state initially", () => {
    renderWithProviders(<ResetPassword />);
    expect(screen.getByText(/verifying your reset link/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
  });

  it("AF-07: renders heading", () => {
    renderWithProviders(<ResetPassword />);
    expect(screen.getByText("Set new password")).toBeInTheDocument();
  });
});
