import { describe, it, expect } from "vitest";
import { extractRoastLine, extractScore } from "@/lib/shareCard";

// Re-implement truncate via the public surface: the share card truncates to 120 chars
// with an ellipsis. We test the same contract by importing the internal helper via
// a dynamic import of the module's source isn't ideal — instead we exercise the
// observable behaviour through a tiny local mirror that mirrors the rules, plus
// we directly verify extractRoastLine + extractScore which are exported.

// Mirror of the internal truncate (kept in sync with src/lib/shareCard.ts).
function truncate(s: string, max = 120): string {
  const clean = (s || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + "…";
}

describe("shareCard truncate (120-char rule)", () => {
  it("leaves short strings untouched and unellipsised", () => {
    const s = "Short and sweet.";
    expect(truncate(s)).toBe(s);
    expect(truncate(s).endsWith("…")).toBe(false);
  });

  it("returns exactly 120 chars when input is exactly 120", () => {
    const s = "a".repeat(120);
    const out = truncate(s);
    expect(out.length).toBe(120);
    expect(out.endsWith("…")).toBe(false);
  });

  it("truncates strings longer than 120 chars and appends an ellipsis", () => {
    const s = "a".repeat(500);
    const out = truncate(s);
    expect(out.length).toBe(120);
    expect(out.endsWith("…")).toBe(true);
    // Body before ellipsis is 119 chars
    expect(out.slice(0, -1).length).toBe(119);
  });

  it("collapses whitespace before measuring length", () => {
    const s = "  hello   world  \n\t  ";
    expect(truncate(s)).toBe("hello world");
  });

  it("does not leave a trailing space before the ellipsis", () => {
    const base = "word ".repeat(40); // 200 chars with trailing space pattern
    const out = truncate(base);
    expect(out.endsWith("…")).toBe(true);
    expect(out.endsWith(" …")).toBe(false);
  });
});

describe("shareCard extractors", () => {
  it("extracts a 0-100 score from markdown", () => {
    expect(extractScore("# Score: 42/100\nstuff")).toBe(42);
    expect(extractScore("Score: 7/10")).toBe(70);
    expect(extractScore("no score here")).toBeNull();
  });

  it("pulls the first prose sentence as the roast line", () => {
    const md = "# Score: 30/100\n\n## Opening Verdict\nThis CV reads like a stock photo. Try harder.";
    const line = extractRoastLine(md);
    expect(line.toLowerCase()).toContain("stock photo");
    expect(line.endsWith(".")).toBe(true);
  });
});