import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "./test-utils";
import Landing from "@/pages/Landing";

// Mock useAuth — keep user signed-out so the redirect to /app doesn't fire
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, session: null, loading: false, signOut: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Landing Page (Cornerman editorial)", () => {
  it("renders the editorial hero headline", () => {
    renderWithProviders(<Landing />);
    expect(screen.getByText(/Walk in having already/i)).toBeInTheDocument();
    expect(screen.getByText(/done the interview\./i)).toBeInTheDocument();
  });

  it("renders the briefing eyebrow label", () => {
    renderWithProviders(<Landing />);
    expect(screen.getByText(/01 \/ Briefing/i)).toBeInTheDocument();
  });

  it("renders both primary CTAs (demo + sign up)", () => {
    renderWithProviders(<Landing />);
    expect(screen.getByText(/Try the interactive demo/i)).toBeInTheDocument();
    const signUpLinks = screen.getAllByText(/Sign up free/i);
    expect(signUpLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the sample CV roast card with score", () => {
    renderWithProviders(<Landing />);
    expect(screen.getByText(/Cornerman · CV Roast/i)).toBeInTheDocument();
    expect(screen.getByText(/Frontend Engineer/i)).toBeInTheDocument();
    expect(screen.getByText("6.2")).toBeInTheDocument();
  });

  it("renders the three pillars (Spar, Roast, Track)", () => {
    renderWithProviders(<Landing />);
    expect(screen.getByText("/ Spar")).toBeInTheDocument();
    expect(screen.getAllByText("/ Roast").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("/ Track")).toBeInTheDocument();
    expect(screen.getByText(/Ruthless mock interviews/i)).toBeInTheDocument();
    expect(screen.getByText(/Brutally honest CV scoring/i)).toBeInTheDocument();
    expect(screen.getByText(/Quietly tracked/i)).toBeInTheDocument();
  });

  it("renders the closing 'Stop guessing' CTA", () => {
    renderWithProviders(<Landing />);
    expect(screen.getByText(/Stop guessing\./i)).toBeInTheDocument();
    expect(screen.getByText(/Start preparing\./i)).toBeInTheDocument();
  });

  it("renders the Cornerman footer line", () => {
    renderWithProviders(<Landing />);
    expect(screen.getByText(/Built for the day the recruiter calls back/i)).toBeInTheDocument();
  });
});
