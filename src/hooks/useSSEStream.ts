import { useState, useCallback, useRef } from "react";

/**
 * Shared hook for Server-Sent Events (SSE) streaming from AI endpoints.
 * Deduplicates the identical streaming pattern used across CVView and AIAssistPanel.
 */
export const useSSEStream = () => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(
    async (
      url: string,
      body: Record<string, unknown>,
      token: string,
      onError?: (msg: string) => void,
      onComplete?: () => void
    ): Promise<string> => {
      // Abort any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setContent("");
      let accumulated = "";

      try {
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Request failed" }));
          onError?.(err.error ?? "Request failed");
          return "";
        }

        const reader = resp.body?.getReader();
        if (!reader) return "";

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                accumulated += delta;
                setContent(accumulated);
              }
            } catch {
              /* skip malformed chunks */
            }
          }
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          onError?.("Failed to generate content");
        }
      } finally {
        setLoading(false);
        abortRef.current = null;
        onComplete?.();
      }

      return accumulated;
    },
    []
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setContent("");
    setLoading(false);
  }, []);

  return { content, loading, stream, reset, setContent };
};
