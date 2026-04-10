/**
 * Test: useSSEStream hook — SSE parsing, abort, error handling
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSSEStream } from "@/hooks/useSSEStream";

describe("useSSEStream", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("starts with empty state", () => {
    const { result } = renderHook(() => useSSEStream());
    expect(result.current.content).toBe("");
    expect(result.current.loading).toBe(false);
  });

  it("streams SSE tokens and accumulates content", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":" World"}}]}\n\n'));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } })
    );

    const { result } = renderHook(() => useSSEStream());

    let finalContent: string;
    await act(async () => {
      finalContent = await result.current.stream(
        "https://test.com/ai",
        { mode: "test" },
        "test-token"
      );
    });

    expect(finalContent!).toBe("Hello World");
    expect(result.current.loading).toBe(false);
  });

  it("handles HTTP errors and calls onError", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Rate limit" }), { status: 429 })
    );

    const onError = vi.fn();
    const { result } = renderHook(() => useSSEStream());

    await act(async () => {
      await result.current.stream("https://test.com/ai", {}, "token", onError);
    });

    expect(onError).toHaveBeenCalledWith("Rate limit");
    expect(result.current.loading).toBe(false);
  });

  it("handles network errors gracefully", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

    const onError = vi.fn();
    const { result } = renderHook(() => useSSEStream());

    await act(async () => {
      await result.current.stream("https://test.com/ai", {}, "token", onError);
    });

    expect(onError).toHaveBeenCalledWith("Failed to generate content");
  });

  it("skips malformed SSE chunks without crashing", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("data: {malformed json\n\n"));
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"OK"}}]}\n\n'));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } })
    );

    const { result } = renderHook(() => useSSEStream());

    let content: string;
    await act(async () => {
      content = await result.current.stream("https://test.com/ai", {}, "token");
    });

    expect(content!).toBe("OK");
  });

  it("reset clears content and loading", async () => {
    const { result } = renderHook(() => useSSEStream());

    act(() => {
      result.current.setContent("Some content");
    });
    expect(result.current.content).toBe("Some content");

    act(() => {
      result.current.reset();
    });
    expect(result.current.content).toBe("");
    expect(result.current.loading).toBe(false);
  });

  it("ignores SSE comment lines (starting with :)", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(": keepalive\n"));
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Token"}}]}\n\n'));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(stream, { status: 200 })
    );

    const { result } = renderHook(() => useSSEStream());

    let content: string;
    await act(async () => {
      content = await result.current.stream("https://test.com/ai", {}, "token");
    });

    expect(content!).toBe("Token");
  });
});
