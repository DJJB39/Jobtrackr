import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "./test-utils";
import Auth from "@/pages/Auth";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  },
}));

vi.mock("@/integrations/lovable/index", () => ({
  lovable: {
    auth: { signInWithOAuth: vi.fn(() => Promise.resolve({ error: null })) },
  },
}));

describe("Auth Page", () => {
  it("AF-05: renders login form with email, password and Sign In", () => {
    renderWithProviders(<Auth />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("AF-03/04: renders OAuth buttons", () => {
    renderWithProviders(<Auth />);
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
    expect(screen.getByText(/continue with apple/i)).toBeInTheDocument();
  });

  it("AF-01: switches to signup mode", () => {
    renderWithProviders(<Auth />);
    fireEvent.click(screen.getByText(/sign up/i, { selector: "button" }));
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
  });

  it("AF-07: switches to forgot password mode", () => {
    renderWithProviders(<Auth />);
    fireEvent.click(screen.getByText(/forgot password/i));
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("AF-07: back to sign in from forgot mode", () => {
    renderWithProviders(<Auth />);
    fireEvent.click(screen.getByText(/forgot password/i));
    fireEvent.click(screen.getByText(/back to sign in/i));
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });
});
