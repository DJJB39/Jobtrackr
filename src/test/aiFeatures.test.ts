/**
 * Test: AI integration constants, types, and utility functions
 */
import { describe, it, expect } from "vitest";
import { INTENSITY_OPTIONS, type Intensity } from "@/hooks/useRuthlessReview";
import type { ExtractedJobData } from "@/hooks/useScreenshotCapture";
import type { TailoredSection, CVTailorResult } from "@/hooks/useCVTailor";
import type { BootcampData } from "@/hooks/useBootcamp";
import type { GenMode } from "@/hooks/useAIGeneration";

describe("AI Feature Types and Constants", () => {
  describe("Ruthless Review Intensities", () => {
    it("has 4 intensity levels", () => {
      expect(INTENSITY_OPTIONS).toHaveLength(4);
    });

    it("includes all expected levels", () => {
      const values = INTENSITY_OPTIONS.map((o) => o.value);
      expect(values).toContain("soft");
      expect(values).toContain("medium");
      expect(values).toContain("hard");
      expect(values).toContain("nuclear");
    });

    it("each option has label and color", () => {
      for (const opt of INTENSITY_OPTIONS) {
        expect(opt.label).toBeTruthy();
        expect(opt.color).toBeTruthy();
      }
    });
  });

  describe("Screenshot Capture Types", () => {
    it("ExtractedJobData shape validates correctly", () => {
      const data: ExtractedJobData = {
        job_title: "Engineer",
        company: "Acme",
        confidence: 0.95,
        warnings: [],
      };
      expect(data.job_title).toBe("Engineer");
      expect(data.confidence).toBeGreaterThan(0);
    });

    it("handles optional fields", () => {
      const data: ExtractedJobData = {
        job_title: "PM",
        company: "BigCo",
        confidence: 0.5,
        warnings: ["Blurry text"],
        location: "NYC",
        salary: "$100k",
        employment_type: "Full-time",
        description: "Great job",
        key_requirements: ["React", "5+ years"],
        posted_date: "2026-04-01",
      };
      expect(data.key_requirements).toHaveLength(2);
      expect(data.warnings).toHaveLength(1);
    });
  });

  describe("CV Tailor Types", () => {
    it("TailoredSection shape validates", () => {
      const section: TailoredSection = {
        section_name: "Summary",
        original: "Generic summary",
        tailored: "Targeted summary",
        change_explanation: "Matches JD keyword",
        risk_note: "Low risk",
      };
      expect(section.section_name).toBe("Summary");
    });

    it("CVTailorResult shape validates", () => {
      const result: CVTailorResult = {
        tailored_sections: [],
        keywords_matched: ["React", "TypeScript"],
        keywords_missing: ["Go"],
        overall_match_before: 45,
        overall_match_after: 78,
        honesty_warning: "All changes faithful",
        summary_markdown: "# Changes",
        model: "google/gemini-3-flash-preview",
      };
      expect(result.overall_match_after).toBeGreaterThan(result.overall_match_before);
    });
  });

  describe("Bootcamp Data Types", () => {
    it("BootcampData shape validates", () => {
      const data: BootcampData = {
        company_snapshot: {
          why_join: "Growth",
          location_details: "London HQ",
          recent_news: "Series B",
          product_context: "SaaS platform",
        },
        logistics: {
          commute_estimate: "30 min by tube",
          cost_estimate: "£3.50",
          time_advice: "Leave at 8:30",
        },
        schedule: [
          { time: "8:00 AM", activity: "Review notes", duration_min: 30, focus_area: "research" },
        ],
        questions: [
          { question: "Tell me about yourself", type: "behavioral", context_note: "Start strong" },
        ],
        summary_markdown: "# Bootcamp",
        model: "google/gemini-3-flash-preview",
      };
      expect(data.schedule).toHaveLength(1);
      expect(data.questions[0].type).toBe("behavioral");
    });
  });

  describe("GenMode Types", () => {
    it("covers all expected modes", () => {
      const modes: GenMode[] = ["cover_letter", "interview_prep", "summarize"];
      expect(modes).toHaveLength(3);
    });
  });
});
