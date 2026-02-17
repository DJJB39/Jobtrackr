import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, createMockJob, createMockColumn } from "./test-utils";
import KanbanColumn from "@/components/KanbanColumn";

// Mock dnd-kit
vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}));

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  SortableContext: ({ children }: any) => <>{children}</>,
  verticalListSortingStrategy: {},
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const safe: Record<string, any> = {};
      for (const [k, v] of Object.entries(props)) {
        if (["className", "style", "onClick", "ref", "id", "title"].includes(k)) safe[k] = v;
      }
      return <div {...safe}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "test-user" }, session: null, loading: false, signOut: vi.fn() }),
}));

describe("KanbanColumn", () => {
  const baseProps = {
    onDeleteJob: vi.fn(),
    onClickJob: vi.fn(),
  };

  it("renders column title and job count", () => {
    const column = createMockColumn({ id: "applied", title: "Applied" });
    renderWithProviders(<KanbanColumn column={column} jobs={[createMockJob()]} {...baseProps} />);
    expect(screen.getByText("Applied")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows empty state when no jobs", () => {
    const column = createMockColumn();
    renderWithProviders(<KanbanColumn column={column} jobs={[]} {...baseProps} />);
    expect(screen.getByText("Drop here")).toBeInTheDocument();
  });

  it("renders correct number of job cards", () => {
    const column = createMockColumn();
    const jobs = [
      createMockJob({ id: "j1", company: "Alpha" }),
      createMockJob({ id: "j2", company: "Beta" }),
    ];
    renderWithProviders(<KanbanColumn column={column} jobs={jobs} {...baseProps} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
