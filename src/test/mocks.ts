/**
 * Shared mock factory for Supabase client.
 * Import in test files: vi.mock("@/integrations/supabase/client", () => supabaseMock())
 */
import { vi } from "vitest";

/** Creates a chainable supabase query builder mock */
export const createQueryBuilder = (data: any = null, error: any = null) => {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: vi.fn((cb: any) => cb({ data, error })),
  };
  // Make final calls resolve
  builder.select.mockImplementation((...args: any[]) => {
    if (args.length > 0 && typeof args[0] === "string" && args[0].includes("count")) {
      return { ...builder, eq: vi.fn().mockReturnValue({ ...builder, gte: vi.fn().mockResolvedValue({ count: 0, error: null }) }) };
    }
    return builder;
  });
  return builder;
};

export const supabaseMock = (overrides?: Partial<{ auth: any; from: any }>) => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      ...overrides?.auth,
    },
    from: overrides?.from ?? vi.fn(() => createQueryBuilder()),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: { path: "test.pdf" }, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://test.com/file.pdf" } })),
      })),
    },
  },
});

/** Creates a mock for fetch with a streaming SSE response */
export const createSSEResponse = (chunks: string[]) => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
};

/** Creates a mock for fetch with a JSON tool call response */
export const createToolCallResponse = (functionName: string, args: Record<string, any>) => {
  return new Response(
    JSON.stringify({
      choices: [{
        message: {
          tool_calls: [{
            function: { name: functionName, arguments: JSON.stringify(args) },
          }],
        },
      }],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

/** Standard mock session */
export const mockSession = {
  access_token: "test-token-123",
  refresh_token: "test-refresh",
  user: {
    id: "user-123",
    email: "test@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01",
  },
};

/** Sample Huntr CSV content */
export const SAMPLE_HUNTR_CSV = `Employer,Job Title,List,URL,Location,Salary,Date Saved,Notes
Acme Corp,Senior Dev,Applied,https://acme.com/jobs/1,London,£80k,2026-01-15,Great fit
BigCo,Junior Dev,Interview,https://bigco.com/jobs/2,Remote,$60k,2026-01-20,Phone screen done
StartupX,Full Stack,Wishlist,https://startupx.io/jobs/3,NYC,$120k,2026-02-01,`;

/** Sample Teal CSV content */
export const SAMPLE_TEAL_CSV = `Company Name,Job Title,Status,Job URL,Location,Salary
TealCo,Product Manager,Applied,https://tealco.com/pm,SF,$130k
AnotherCo,Designer,Saved,https://anotherco.com/d,Remote,$90k`;

/** Sample CV text for testing */
export const SAMPLE_CV_TEXT = `John Doe — Senior Software Engineer
5+ years building scalable web applications with React, TypeScript, and Node.js.

EXPERIENCE
Senior Developer, TechCorp (2023–Present)
- Built a real-time analytics dashboard serving 10k daily users
- Led migration from JavaScript to TypeScript, reducing bugs by 40%
- Mentored 3 junior developers through structured code reviews

Developer, WebAgency (2021–2023)
- Developed e-commerce platform handling $2M monthly transactions
- Implemented CI/CD pipeline reducing deployment time by 60%

SKILLS
React, TypeScript, Node.js, PostgreSQL, AWS, Docker, GraphQL`;

/** Sample extracted job data from screenshot */
export const SAMPLE_EXTRACTED_JOB = {
  job_title: "Senior Frontend Engineer",
  company: "TechGiant Inc",
  location: "San Francisco, CA",
  salary: "$150k - $200k",
  employment_type: "Full-time",
  description: "Join our team to build next-gen web experiences...",
  key_requirements: ["React", "TypeScript", "5+ years experience", "System Design"],
  posted_date: "2026-04-01",
  confidence: 0.92,
  warnings: [],
  model: "google/gemini-2.5-flash",
};
