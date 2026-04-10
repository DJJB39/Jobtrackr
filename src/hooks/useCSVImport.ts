import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { TablesInsert } from "@/integrations/supabase/types";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;
const MAX_IMPORT = 500;

/* ── Types ─────────────────────────────────────────────── */

export interface ParsedCSVFile {
  name: string;
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

export interface ColumnMapping {
  source: string;
  target: string | null;
}

export interface StageMapping {
  sourceValue: string;
  targetStageId: string;
}

export interface ImportAnalysis {
  source: "huntr" | "teal" | "generic";
  confidence: number;
  suggestedMappings: ColumnMapping[];
  stageMappings: StageMapping[];
  warnings: string[];
}

export interface ImportResult {
  imported: number;
  duplicates: number;
  errors: number;
}

export type ImportStep = "upload" | "analyzing" | "mapping" | "importing" | "complete" | "error";

const TARGET_FIELDS = [
  { key: "company", label: "Company", required: true },
  { key: "role", label: "Role / Title", required: true },
  { key: "location", label: "Location" },
  { key: "salary", label: "Salary" },
  { key: "url", label: "Job URL" },
  { key: "stage", label: "Stage / Status" },
  { key: "applied_date", label: "Applied Date" },
  { key: "notes", label: "Notes" },
  { key: "description", label: "Description" },
  { key: "application_type", label: "Application Type" },
] as const;

export { TARGET_FIELDS };

/* ── Clean helpers ─────────────────────────────────────── */

function clean(val: string | undefined | null): string {
  if (!val) return "";
  return val.replace(/<[^>]*>/g, "").trim();
}

function normalizeDate(val: string): string | undefined {
  if (!val) return undefined;
  const cleaned = val.trim();
  // Try ISO
  const iso = Date.parse(cleaned);
  if (!isNaN(iso)) return new Date(iso).toISOString();
  // Try DD/MM/YYYY
  const parts = cleaned.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (parts) {
    const [, a, b, y] = parts;
    const year = y.length === 2 ? `20${y}` : y;
    // Try both orderings
    const d1 = new Date(`${year}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`);
    if (!isNaN(d1.getTime())) return d1.toISOString();
    const d2 = new Date(`${year}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`);
    if (!isNaN(d2.getTime())) return d2.toISOString();
  }
  return undefined;
}

/* ── Hook ──────────────────────────────────────────────── */

export const useCSVImport = () => {
  const { session, user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<ImportStep>("upload");
  const [files, setFiles] = useState<ParsedCSVFile[]>([]);
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [stageMappings, setStageMappings] = useState<StageMapping[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(false);

  /* ── Parse uploaded files ────────────────────────────── */

  const parseFiles = useCallback(async (inputFiles: File[]) => {
    const parsed: ParsedCSVFile[] = [];

    for (const file of inputFiles) {
      if (file.name.endsWith(".zip")) {
        const zip = await JSZip.loadAsync(file);
        const csvFiles = Object.values(zip.files).filter(
          (f) => !f.dir && f.name.endsWith(".csv") && !f.name.startsWith("__MACOSX")
        );
        for (const zf of csvFiles) {
          const text = await zf.async("text");
          const result = Papa.parse<Record<string, string>>(text, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.trim(),
          });
          if (result.data.length > 0) {
            parsed.push({
              name: zf.name.split("/").pop() || zf.name,
              headers: result.meta.fields || [],
              rows: result.data.slice(0, MAX_IMPORT),
              rowCount: result.data.length,
            });
          }
        }
      } else {
        const text = await file.text();
        const result = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
        });
        if (result.data.length > 0) {
          parsed.push({
            name: file.name,
            headers: result.meta.fields || [],
            rows: result.data.slice(0, MAX_IMPORT),
            rowCount: result.data.length,
          });
        }
      }
    }

    if (parsed.length === 0) {
      setError("No valid CSV data found in uploaded files.");
      setStep("error");
      return;
    }

    setFiles(parsed);
    setStep("analyzing");

    // Call AI to analyze
    await analyzeFiles(parsed);
  }, []);

  /* ── AI analysis ─────────────────────────────────────── */

  const analyzeFiles = useCallback(async (parsedFiles: ParsedCSVFile[]) => {
    const token = session?.access_token;
    if (!token) {
      setError("Please log in to import data.");
      setStep("error");
      return;
    }

    // Send sample data to AI for analysis
    const sampleData = parsedFiles.map((f) => ({
      filename: f.name,
      headers: f.headers,
      sampleRows: f.rows.slice(0, 3),
      totalRows: f.rowCount,
    }));

    try {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: "csv_import_analyze",
          csvData: sampleData,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: "Analysis failed" }));
        if (errData.code === "LIMIT_REACHED") {
          setError("Monthly AI limit reached. You can still import manually by mapping columns yourself.");
          // Fall back to smart guessing
          const fallback = smartGuess(parsedFiles);
          setAnalysis(fallback);
          setMappings(fallback.suggestedMappings);
          setStageMappings(fallback.stageMappings);
          setStep("mapping");
          return;
        }
        throw new Error(errData.error || "Analysis failed");
      }

      const data = await resp.json();
      const analysisResult: ImportAnalysis = {
        source: data.source || "generic",
        confidence: data.confidence || 0.5,
        suggestedMappings: data.mappings || [],
        stageMappings: data.stageMappings || [],
        warnings: data.warnings || [],
      };

      setAnalysis(analysisResult);
      setMappings(analysisResult.suggestedMappings);
      setStageMappings(analysisResult.stageMappings);
      setStep("mapping");
    } catch (err) {
      console.error("Analysis error:", err);
      // Fall back to smart guessing
      const fallback = smartGuess(parsedFiles);
      setAnalysis(fallback);
      setMappings(fallback.suggestedMappings);
      setStageMappings(fallback.stageMappings);
      setStep("mapping");
    }
  }, [session]);

  /* ── Smart guess fallback ────────────────────────────── */

  const smartGuess = (parsedFiles: ParsedCSVFile[]): ImportAnalysis => {
    const allHeaders = [...new Set(parsedFiles.flatMap((f) => f.headers))];
    const lower = allHeaders.map((h) => h.toLowerCase());

    const guess = (targets: string[]): string | null => {
      for (const t of targets) {
        const idx = lower.findIndex((h) => h.includes(t));
        if (idx >= 0) return allHeaders[idx];
      }
      return null;
    };

    const isHuntr = lower.some((h) => h.includes("job title") || h.includes("employer"));
    const isTeal = lower.some((h) => h.includes("company name") && h.includes("job title"));

    const mappings: ColumnMapping[] = [
      { source: guess(["company", "employer", "company name", "organization"]) || "", target: "company" },
      { source: guess(["title", "role", "position", "job title"]) || "", target: "role" },
      { source: guess(["location", "city", "job location"]) || "", target: "location" },
      { source: guess(["salary", "compensation", "pay"]) || "", target: "salary" },
      { source: guess(["url", "link", "job url", "posting url", "job link"]) || "", target: "url" },
      { source: guess(["status", "stage", "category", "list"]) || "", target: "stage" },
      { source: guess(["date", "applied", "created", "added", "date saved"]) || "", target: "applied_date" },
      { source: guess(["note", "comment", "description"]) || "", target: "notes" },
    ].filter((m) => m.source);

    return {
      source: isHuntr ? "huntr" : isTeal ? "teal" : "generic",
      confidence: 0.6,
      suggestedMappings: mappings,
      stageMappings: [],
      warnings: [],
    };
  };

  /* ── Update mapping ──────────────────────────────────── */

  const updateMapping = useCallback((sourceCol: string, targetField: string | null) => {
    setMappings((prev) => {
      const existing = prev.find((m) => m.source === sourceCol);
      if (existing) {
        return prev.map((m) => (m.source === sourceCol ? { ...m, target: targetField } : m));
      }
      return [...prev, { source: sourceCol, target: targetField }];
    });
  }, []);

  const updateStageMapping = useCallback((sourceValue: string, targetStageId: string) => {
    setStageMappings((prev) => {
      const existing = prev.find((m) => m.sourceValue === sourceValue);
      if (existing) {
        return prev.map((m) => (m.sourceValue === sourceValue ? { ...m, targetStageId } : m));
      }
      return [...prev, { sourceValue, targetStageId }];
    });
  }, []);

  /* ── Execute import ──────────────────────────────────── */

  const executeImport = useCallback(async (existingJobs: { company: string; role: string; links: string[] }[]) => {
    if (!user) return;
    abortRef.current = false;
    setStep("importing");
    setProgress(0);

    // Build mapping lookup
    const mapLookup: Record<string, string> = {};
    for (const m of mappings) {
      if (m.target) mapLookup[m.target] = m.source;
    }

    const stageMap: Record<string, string> = {};
    for (const sm of stageMappings) {
      stageMap[sm.sourceValue.toLowerCase()] = sm.targetStageId;
    }

    // Merge all rows from all files
    const allRows = files.flatMap((f) => f.rows);
    const total = Math.min(allRows.length, MAX_IMPORT);

    let imported = 0;
    let duplicates = 0;
    let errors = 0;
    const batchSize = 25;

    for (let i = 0; i < total; i += batchSize) {
      if (abortRef.current) break;
      const batch = allRows.slice(i, i + batchSize);
      const inserts: TablesInsert<"job_applications">[] = [];

      for (const row of batch) {
        const company = clean(row[mapLookup["company"]]);
        const role = clean(row[mapLookup["role"]]);
        if (!company || !role) {
          errors++;
          continue;
        }

        // Dedup check: by URL first, then company+role
        const url = clean(row[mapLookup["url"]]);
        const isDupe = existingJobs.some((ej) => {
          if (url && ej.links.some((l) => l === url)) return true;
          return ej.company.toLowerCase() === company.toLowerCase() &&
                 ej.role.toLowerCase() === role.toLowerCase();
        });

        if (isDupe) {
          duplicates++;
          continue;
        }

        // Map stage
        const rawStage = clean(row[mapLookup["stage"]]).toLowerCase();
        const columnId = stageMap[rawStage] || guessStage(rawStage);

        const appliedDate = normalizeDate(clean(row[mapLookup["applied_date"]]));

        inserts.push({
          user_id: user.id,
          company,
          role,
          column_id: columnId,
          location: clean(row[mapLookup["location"]]) || null,
          salary: clean(row[mapLookup["salary"]]) || null,
          description: clean(row[mapLookup["description"]]) || null,
          notes: clean(row[mapLookup["notes"]]) || "",
          links: url ? [url] : [],
          imported_from: analysis?.source || "csv",
          ...(appliedDate ? { created_at: appliedDate } : {}),
        });

        // Track for further dedup within batch
        existingJobs.push({ company, role, links: url ? [url] : [] });
      }

      if (inserts.length > 0) {
        const { error: insertError } = await supabase
          .from("job_applications")
          .insert(inserts);

        if (insertError) {
          console.error("Batch insert error:", insertError);
          errors += inserts.length;
        } else {
          imported += inserts.length;
        }
      }

      setProgress(Math.min(100, Math.round(((i + batch.length) / total) * 100)));
    }

    setResult({ imported, duplicates, errors });
    setStep("complete");
  }, [user, files, mappings, stageMappings, analysis]);

  /* ── Stage guessing ──────────────────────────────────── */

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

  /* ── Reset ───────────────────────────────────────────── */

  const reset = useCallback(() => {
    abortRef.current = true;
    setStep("upload");
    setFiles([]);
    setAnalysis(null);
    setMappings([]);
    setStageMappings([]);
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    step,
    files,
    analysis,
    mappings,
    stageMappings,
    result,
    error,
    progress,
    parseFiles,
    updateMapping,
    updateStageMapping,
    executeImport,
    reset,
  };
};
