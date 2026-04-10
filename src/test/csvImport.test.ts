/**
 * Test: useCSVImport — file parsing, smart guess, stage guessing, dedup
 * Tests the pure logic functions without Supabase calls.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import Papa from "papaparse";

// We test the internal logic by extracting testable patterns
// Since useCSVImport is a hook with side effects, we test the pure logic separately

describe("CSV Import Logic", () => {
  // --- Stage guessing logic (mirrors guessStage from useCSVImport) ---
  function guessStage(raw: string): string {
    if (!raw) return "found";
    const l = raw.toLowerCase();
    if (l.includes("offer")) return "offer";
    if (l.includes("accept")) return "accepted";
    if (l.includes("reject") || l.includes("declined") || l.includes("closed")) return "rejected";
    if (l.includes("final")) return "final";
    if (l.includes("interview") || l.includes("onsite") || l.includes("on-site")) return "interview2";
    if (l.includes("phone") || l.includes("screen") || l.includes("call")) return "phone";
    if (l.includes("applied") || l.includes("submitted")) return "applied";
    if (l.includes("wishlist") || l.includes("saved") || l.includes("bookmarked")) return "found";
    return "applied";
  }

  describe("guessStage", () => {
    it("maps 'Offer' to offer", () => expect(guessStage("Offer")).toBe("offer"));
    it("maps 'Accepted' to accepted", () => expect(guessStage("Accepted")).toBe("accepted"));
    it("maps 'Rejected' to rejected", () => expect(guessStage("Rejected")).toBe("rejected"));
    it("maps 'Declined' to rejected", () => expect(guessStage("Declined")).toBe("rejected"));
    it("maps 'Final Interview' to final", () => expect(guessStage("Final Interview")).toBe("final"));
    it("maps 'Phone Screen' to phone", () => expect(guessStage("Phone Screen")).toBe("phone"));
    it("maps 'Applied' to applied", () => expect(guessStage("Applied")).toBe("applied"));
    it("maps 'Wishlist' to found", () => expect(guessStage("Wishlist")).toBe("found"));
    it("maps 'Saved' to found", () => expect(guessStage("Saved")).toBe("found"));
    it("maps empty string to found", () => expect(guessStage("")).toBe("found"));
    it("maps unknown value to applied", () => expect(guessStage("CustomStage")).toBe("applied"));
    it("is case-insensitive", () => expect(guessStage("OFFER RECEIVED")).toBe("offer"));
    it("maps 'On-Site Interview' to interview2", () => expect(guessStage("On-Site Interview")).toBe("interview2"));
  });

  // --- CSV parsing with PapaParse ---
  describe("CSV Parsing", () => {
    it("parses standard Huntr CSV headers", () => {
      const csv = `Employer,Job Title,List,URL,Location,Salary,Date Saved,Notes
Acme Corp,Senior Dev,Applied,https://acme.com/j/1,London,£80k,2026-01-15,Great fit`;

      const result = Papa.parse<Record<string, string>>(csv, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
      });

      expect(result.meta.fields).toContain("Employer");
      expect(result.meta.fields).toContain("Job Title");
      expect(result.meta.fields).toContain("List");
      expect(result.data).toHaveLength(1);
      expect(result.data[0]["Employer"]).toBe("Acme Corp");
    });

    it("parses Teal CSV headers", () => {
      const csv = `Company Name,Job Title,Status,Job URL,Location,Salary
TealCo,PM,Applied,https://tealco.com/pm,SF,$130k`;

      const result = Papa.parse<Record<string, string>>(csv, {
        header: true,
        skipEmptyLines: true,
      });

      expect(result.meta.fields).toContain("Company Name");
      expect(result.meta.fields).toContain("Status");
      expect(result.data[0]["Company Name"]).toBe("TealCo");
    });

    it("handles empty rows gracefully", () => {
      const csv = `Company,Role
Acme,Dev

,
BigCo,PM`;

      const result = Papa.parse<Record<string, string>>(csv, {
        header: true,
        skipEmptyLines: true,
      });

      // skipEmptyLines should filter blanks
      expect(result.data.length).toBeGreaterThanOrEqual(2);
    });

    it("handles CSV with special characters in fields", () => {
      const csv = `Company,Role,Notes
"Acme, Inc.",Senior Dev,"Has ""great"" culture"
O'Reilly,PM,Notes with 'quotes'`;

      const result = Papa.parse<Record<string, string>>(csv, {
        header: true,
        skipEmptyLines: true,
      });

      expect(result.data[0]["Company"]).toBe("Acme, Inc.");
      expect(result.data[0]["Notes"]).toContain('great');
    });
  });

  // --- Smart guess logic ---
  describe("Smart Guess (column detection)", () => {
    function smartGuess(headers: string[]): Record<string, string | null> {
      const lower = headers.map((h) => h.toLowerCase());
      const guess = (targets: string[]): string | null => {
        for (const t of targets) {
          const idx = lower.findIndex((h) => h.includes(t));
          if (idx >= 0) return headers[idx];
        }
        return null;
      };

      return {
        company: guess(["company", "employer", "company name", "organization"]),
        role: guess(["title", "role", "position", "job title"]),
        location: guess(["location", "city", "job location"]),
        salary: guess(["salary", "compensation", "pay"]),
        url: guess(["url", "link", "job url", "posting url", "job link"]),
        stage: guess(["status", "stage", "category", "list"]),
      };
    }

    it("detects Huntr columns", () => {
      const result = smartGuess(["Employer", "Job Title", "List", "URL", "Location", "Salary"]);
      expect(result.company).toBe("Employer");
      expect(result.role).toBe("Job Title");
      expect(result.stage).toBe("List");
      expect(result.url).toBe("URL");
    });

    it("detects Teal columns", () => {
      const result = smartGuess(["Company Name", "Job Title", "Status", "Job URL", "Location"]);
      expect(result.company).toBe("Company Name");
      expect(result.role).toBe("Job Title");
      expect(result.stage).toBe("Status");
      expect(result.url).toBe("Job URL");
    });

    it("detects generic columns", () => {
      const result = smartGuess(["Organization", "Position", "City", "Pay"]);
      expect(result.company).toBe("Organization");
      expect(result.role).toBe("Position");
      expect(result.location).toBe("City");
      expect(result.salary).toBe("Pay");
    });

    it("returns null for unrecognized columns", () => {
      const result = smartGuess(["FooBar", "BazQux"]);
      expect(result.company).toBeNull();
      expect(result.role).toBeNull();
    });
  });

  // --- Dedup logic ---
  describe("Deduplication", () => {
    const existingJobs = [
      { company: "Acme Corp", role: "Senior Dev", links: ["https://acme.com/j/1"] },
      { company: "BigCo", role: "PM", links: [] },
    ];

    function isDupe(company: string, role: string, url: string, existing: typeof existingJobs): boolean {
      return existing.some((ej) => {
        if (url && ej.links.some((l) => l === url)) return true;
        return ej.company.toLowerCase() === company.toLowerCase() &&
               ej.role.toLowerCase() === role.toLowerCase();
      });
    }

    it("detects duplicate by URL", () => {
      expect(isDupe("Different", "Different", "https://acme.com/j/1", existingJobs)).toBe(true);
    });

    it("detects duplicate by company+role (case-insensitive)", () => {
      expect(isDupe("acme corp", "senior dev", "", existingJobs)).toBe(true);
    });

    it("does not flag non-duplicates", () => {
      expect(isDupe("NewCo", "New Role", "https://new.com/j/99", existingJobs)).toBe(false);
    });
  });

  // --- Date normalization ---
  describe("Date Normalization", () => {
    function normalizeDate(val: string): string | undefined {
      if (!val) return undefined;
      const cleaned = val.trim();
      const iso = Date.parse(cleaned);
      if (!isNaN(iso)) return new Date(iso).toISOString();
      const parts = cleaned.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
      if (parts) {
        const [, a, b, y] = parts;
        const year = y.length === 2 ? `20${y}` : y;
        const d1 = new Date(`${year}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`);
        if (!isNaN(d1.getTime())) return d1.toISOString();
        const d2 = new Date(`${year}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`);
        if (!isNaN(d2.getTime())) return d2.toISOString();
      }
      return undefined;
    }

    it("parses ISO dates", () => {
      expect(normalizeDate("2026-01-15")).toBeDefined();
    });

    it("parses DD/MM/YYYY", () => {
      expect(normalizeDate("15/01/2026")).toBeDefined();
    });

    it("parses DD-MM-YY", () => {
      expect(normalizeDate("15-01-26")).toBeDefined();
    });

    it("returns undefined for empty", () => {
      expect(normalizeDate("")).toBeUndefined();
    });

    it("returns undefined for garbage", () => {
      expect(normalizeDate("not-a-date")).toBeUndefined();
    });
  });
});
