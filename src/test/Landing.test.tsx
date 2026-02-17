import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "./test-utils";
import Landing from "@/pages/Landing";

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, session: null, loading: false, signOut: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock framer-motion to render plain divs
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...filterDomProps(props)}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...filterDomProps(props)}>{children}</section>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

function filterDomProps(props: Record<string, any>) {
  const valid: Record<string, any> = {};
  for (const [k, v] of Object.entries(props)) {
    if (["className", "style", "id", "onClick", "role", "title"].includes(k)) valid[k] = v;
  }
  return valid;
}

// Mock image imports
vi.mock("@/assets/screenshot-kanban.png", () => ({ default: "kanban.png" }));
vi.mock("@/assets/screenshot-detail.png", () => ({ default: "detail.png" }));
vi.mock("@/assets/screenshot-dashboard.png", () => ({ default: "dashboard.png" }));

describe("Landing Page", () => {
  it("LP-01: renders hero headline", () => {
    renderWithProviders(<Landing />);
    expect(screen.getByText(/Stop Losing Track of/i)).toBeInTheDocument();
    const h1 = document.querySelector("h1");
    expect(h1?.textContent).toContain("Applications");
  });

  it("LP-01: renders trust strip badge", () => {
    renderWithProviders(<Landing />);
    expect(screen.getByText(/Free to use/i)).toBeInTheDocument();
  });

  it("LP-01: renders CTA buttons", () => {
    renderWithProviders(<Landing />);
    const signUpButtons = screen.getAllByText("Sign Up Free");
    expect(signUpButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Try Interactive Demo")).toBeInTheDocument();
  });

  it("LP-02: renders 6 feature cards", () => {
    renderWithProviders(<Landing />);
    const titles = ["Kanban Board", "URL Auto-Fill", "Events & Reminders", "CV Upload", "AI Assist", "Private & Secure"];
    titles.forEach((t) => {
      const matches = screen.getAllByText(t);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("LP-04: renders pricing section", () => {
    renderWithProviders(<Landing />);
    expect(screen.getByText(/Free Forever/i)).toBeInTheDocument();
  });

  it("renders Loom demo iframe", () => {
    renderWithProviders(<Landing />);
    const iframe = document.querySelector('iframe[title="JobTrackr demo video"]');
    expect(iframe).toBeInTheDocument();
  });
});
