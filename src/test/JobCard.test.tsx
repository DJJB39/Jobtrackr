import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, createMockJob } from "./test-utils";
import JobCard from "@/components/JobCard";

// Mock dnd-kit
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(({ children, ...props }: any) => {
      const safe: Record<string, any> = {};
      for (const [k, v] of Object.entries(props)) {
        if (["className", "style", "onClick", "ref", "id", "title"].includes(k)) safe[k] = v;
      }
      return <div data-testid="job-card" {...safe}>{children}</div>;
    }),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "test-user" }, session: null, loading: false, signOut: vi.fn() }),
}));

const defaultProps = {
  onDelete: vi.fn(),
  onClick: vi.fn(),
  onSchedule: vi.fn(),
};

describe("JobCard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders company name", () => {
    renderWithProviders(<JobCard job={createMockJob()} {...defaultProps} columnId="applied" />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("renders role subtitle", () => {
    renderWithProviders(<JobCard job={createMockJob()} {...defaultProps} columnId="applied" />);
    expect(screen.getByText("Senior Frontend Engineer")).toBeInTheDocument();
  });

  it("renders salary pill when salary exists", () => {
    renderWithProviders(<JobCard job={createMockJob()} {...defaultProps} columnId="applied" />);
    expect(screen.getByText("$130k-$160k")).toBeInTheDocument();
  });

  it("hides salary pill when no salary", () => {
    renderWithProviders(<JobCard job={createMockJob({ salary: undefined })} {...defaultProps} columnId="applied" />);
    expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument();
  });

  it("renders external link when links[0] exists", () => {
    renderWithProviders(<JobCard job={createMockJob()} {...defaultProps} columnId="applied" />);
    const link = document.querySelector('a[href="https://acme.com/jobs/123"]');
    expect(link).toBeInTheDocument();
  });

  it("hides external link when no links", () => {
    renderWithProviders(<JobCard job={createMockJob({ links: [] })} {...defaultProps} columnId="applied" />);
    const link = document.querySelector('a[title="View original posting"]');
    expect(link).not.toBeInTheDocument();
  });

  it("renders location", () => {
    renderWithProviders(<JobCard job={createMockJob()} {...defaultProps} columnId="applied" />);
    expect(screen.getByText("London, UK")).toBeInTheDocument();
  });

  it("renders contacts count", () => {
    renderWithProviders(<JobCard job={createMockJob()} {...defaultProps} columnId="applied" />);
    expect(screen.getByText("2 contacts")).toBeInTheDocument();
  });

  it("renders progress bar with correct width for applied stage", () => {
    renderWithProviders(<JobCard job={createMockJob()} {...defaultProps} columnId="applied" />);
    const bar = document.querySelector('[style*="width: 25%"]');
    expect(bar).toBeInTheDocument();
  });

  it("compact mode shows badge counts instead of details", () => {
    renderWithProviders(<JobCard job={createMockJob()} {...defaultProps} columnId="applied" compact />);
    // Notes should not be visible in compact mode
    expect(screen.queryByText(/Great opportunity/)).not.toBeInTheDocument();
  });
});
