import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { JobApplication, Column, ColumnId } from "@/types/job";
import type { ReactElement } from "react";

const createTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

export const renderWithProviders = (ui: ReactElement) =>
  render(ui, { wrapper: AllTheProviders });

export const createMockJob = (overrides: Partial<JobApplication> = {}): JobApplication => ({
  id: "test-job-1",
  company: "Acme Corp",
  role: "Senior Frontend Engineer",
  columnId: "applied",
  createdAt: "2026-01-15T10:00:00Z",
  notes: "Great opportunity with competitive benefits and remote work options.",
  contacts: [
    { id: "c1", name: "Jane Recruiter", role: "Talent Lead", email: "jane@acme.com" },
    { id: "c2", name: "Bob Hiring", role: "Engineering Manager", email: "bob@acme.com" },
  ],
  nextSteps: [{ id: "ns1", text: "Prepare portfolio", done: false }],
  links: ["https://acme.com/jobs/123"],
  applicationType: "Frontend",
  location: "London, UK",
  description: "Build amazing UIs",
  salary: "$130k-$160k",
  closeDate: "2026-03-01",
  events: [
    {
      id: "ev1",
      title: "Phone Screen",
      date: "2026-03-10T00:00:00Z",
      time: "14:00",
      type: "interview",
      location: "Zoom",
      prepNotes: "Review system design",
      outcome: "pending",
      createdAt: "2026-01-16T00:00:00Z",
    },
  ],
  ...overrides,
});

export const createMockColumn = (overrides: Partial<Column> = {}): Column => ({
  id: "applied" as ColumnId,
  title: "Applied",
  colorClass: "bg-status-applied",
  ...overrides,
});
