/**
 * Test: useScreenshotCapture hook — extraction flow, error handling, usage limits
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { SAMPLE_EXTRACTED_JOB } from "./mocks";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() =>
        Promise.resolve({
          data: { session: { access_token: "test-token", user: { id: "u1" } } },
        })
      ),
    },
  },
}));

vi.mock("@/integrations/lovable/index", () => ({
  lovable: { auth: { signInWithOAuth: vi.fn() } },
}));

// Must import after mocks
import { useScreenshotCapture } from "@/hooks/useScreenshotCapture";

describe("useScreenshotCapture", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("starts with idle state", () => {
    const { result } = renderHook(() => useScreenshotCapture());
    expect(result.current.extracting).toBe(false);
    expect(result.current.extractedData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("extracts job data from base64 image", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(SAMPLE_EXTRACTED_JOB), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { result } = renderHook(() => useScreenshotCapture());

    let extracted: any;
    await act(async () => {
      extracted = await result.current.extractFromImage("base64data", "https://linkedin.com/job/123");
    });

    expect(extracted).toBeDefined();
    expect(extracted!.company).toBe("TechGiant Inc");
    expect(extracted!.job_title).toBe("Senior Frontend Engineer");
    expect(extracted!.confidence).toBeGreaterThan(0.5);
    expect(result.current.extractedData).not.toBeNull();
  });

  it("handles rate limit (LIMIT_REACHED)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Monthly limit reached", code: "LIMIT_REACHED" }), {
        status: 403,
      })
    );

    const { result } = renderHook(() => useScreenshotCapture());

    await act(async () => {
      await result.current.extractFromImage("base64data");
    });

    expect(result.current.error).toContain("Monthly AI limit");
    expect(result.current.extractedData).toBeNull();
  });

  it("handles server errors gracefully", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Internal error" }), { status: 500 })
    );

    const { result } = renderHook(() => useScreenshotCapture());

    await act(async () => {
      await result.current.extractFromImage("base64data");
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.extractedData).toBeNull();
  });

  it("handles network failures", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useScreenshotCapture());

    await act(async () => {
      await result.current.extractFromImage("base64data");
    });

    expect(result.current.error).toBeDefined();
  });

  it("reset clears state", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(SAMPLE_EXTRACTED_JOB), { status: 200 })
    );

    const { result } = renderHook(() => useScreenshotCapture());

    await act(async () => {
      await result.current.extractFromImage("base64data");
    });
    expect(result.current.extractedData).not.toBeNull();

    act(() => {
      result.current.reset();
    });
    expect(result.current.extractedData).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
