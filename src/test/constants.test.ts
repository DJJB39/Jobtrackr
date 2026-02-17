import { describe, it, expect } from "vitest";
import { FEEDBACK_FORM_URL, LOOM_DEMO_URL } from "@/lib/constants";

describe("Constants", () => {
  it("FEEDBACK_FORM_URL is a non-empty string", () => {
    expect(typeof FEEDBACK_FORM_URL).toBe("string");
    expect(FEEDBACK_FORM_URL.length).toBeGreaterThan(0);
  });

  it("LOOM_DEMO_URL is a non-empty string", () => {
    expect(typeof LOOM_DEMO_URL).toBe("string");
    expect(LOOM_DEMO_URL.length).toBeGreaterThan(0);
  });
});
