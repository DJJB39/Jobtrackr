import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Loader2,
  X,
  FileArchive,
  Mic,
} from "lucide-react";
import { useCSVImport, TARGET_FIELDS } from "@/hooks/useCSVImport";
import { useStages } from "@/hooks/useStages";
import { useJobStore } from "@/stores/jobStore";
import type { JobApplication } from "@/types/job";

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
  onOpenCoach?: (job: JobApplication) => void;
}

const CSVImportModal = ({ open, onOpenChange, onImportComplete, onOpenCoach }: CSVImportModalProps) => {
  const { stages } = useStages();
  const { jobs, fetchJobs } = useJobStore();
  const {
    step, files, analysis, mappings, stageMappings, result, error, progress,
    parseFiles, updateMapping, updateStageMapping, executeImport, reset,
  } = useCSVImport();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const accepted = Array.from(fileList).filter(
      (f) => f.name.endsWith(".csv") || f.name.endsWith(".zip")
    );
    if (accepted.length === 0) return;
    parseFiles(accepted);
  }, [parseFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleConfirmImport = useCallback(() => {
    const existingJobs = jobs.map((j) => ({
      company: j.company,
      role: j.role,
      links: j.links,
    }));
    executeImport(existingJobs);
  }, [jobs, executeImport]);

  const handleClose = useCallback(() => {
    reset();
    onOpenChange(false);
    if (result && result.imported > 0) {
      onImportComplete?.();
    }
  }, [reset, onOpenChange, result, onImportComplete]);

  // Collect unique stage values from data
  const uniqueStageValues = (() => {
    const stageCol = mappings.find((m) => m.target === "stage")?.source;
    if (!stageCol) return [];
    const vals = new Set<string>();
    files.forEach((f) => f.rows.forEach((r) => {
      const v = r[stageCol]?.trim();
      if (v) vals.add(v);
    }));
    return Array.from(vals).sort();
  })();

  const totalRows = files.reduce((sum, f) => sum + f.rowCount, 0);
  const companyMapped = mappings.some((m) => m.target === "company" && m.source);
  const roleMapped = mappings.some((m) => m.target === "role" && m.source);
  const canImport = companyMapped && roleMapped;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-display flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Import Applications
          </DialogTitle>
          <DialogDescription>
            Import from Huntr, Teal, or any CSV export. We'll handle the mapping.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ── Upload Step ─────────────────────────────── */}
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                  dragOver
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <FileSpreadsheet className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Drop your CSV or ZIP file here
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports Huntr ZIP exports, Teal CSVs, or any spreadsheet
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="gap-1">
                      <FileSpreadsheet className="h-3 w-3" /> .csv
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <FileArchive className="h-3 w-3" /> .zip
                    </Badge>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.zip"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Up to 500 applications per import • All data stays private
              </p>
            </motion.div>
          )}

          {/* ── Analyzing Step ─────────────────────────── */}
          {step === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4 py-10"
            >
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-primary/40"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Analyzing your data…</p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI is detecting the source and mapping columns
                </p>
              </div>
              <div className="flex gap-2">
                {files.map((f) => (
                  <Badge key={f.name} variant="outline" className="text-xs">
                    {f.name} ({f.rowCount} rows)
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Mapping Step ───────────────────────────── */}
          {step === "mapping" && (
            <motion.div
              key="mapping"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Source detected */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {analysis?.source && analysis.source !== "generic" && (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {analysis.source === "huntr" ? "Huntr Export" : "Teal Export"} detected
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {totalRows} row{totalRows !== 1 ? "s" : ""} found
                    {totalRows > 500 && " (first 500 will be imported)"}
                  </span>
                </div>
              </div>

              {/* Warnings */}
              {analysis?.warnings && analysis.warnings.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium text-yellow-500">Heads up</span>
                  </div>
                  <ul className="text-muted-foreground space-y-0.5">
                    {analysis.warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Column mappings */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Column Mapping</h3>
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/30">
                        <TableHead className="text-xs">Your Column</TableHead>
                        <TableHead className="text-xs w-8 text-center">→</TableHead>
                        <TableHead className="text-xs">JobTrackr Field</TableHead>
                        <TableHead className="text-xs">Preview</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getAllHeaders().map((header) => {
                        const mapping = mappings.find((m) => m.source === header);
                        const preview = files[0]?.rows[0]?.[header] || "";
                        return (
                          <TableRow key={header} className="hover:bg-secondary/10">
                            <TableCell className="text-sm font-mono py-2">{header}</TableCell>
                            <TableCell className="text-center py-2">
                              <ArrowRight className="h-3 w-3 text-muted-foreground mx-auto" />
                            </TableCell>
                            <TableCell className="py-2">
                              <Select
                                value={mapping?.target || "skip"}
                                onValueChange={(v) => updateMapping(header, v === "skip" ? null : v)}
                              >
                                <SelectTrigger className="h-8 text-xs w-40 border-border/50">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="skip">
                                    <span className="text-muted-foreground">Skip</span>
                                  </SelectItem>
                                  {TARGET_FIELDS.map((f) => (
                                    <SelectItem key={f.key} value={f.key}>
                                      {f.label}
                                      {f.required ? " *" : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground py-2 max-w-[140px] truncate">
                              {preview.slice(0, 50)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Stage mapping */}
              {uniqueStageValues.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Stage Mapping</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {uniqueStageValues.map((val) => {
                      const mapping = stageMappings.find((m) => m.sourceValue === val);
                      return (
                        <div key={val} className="flex items-center gap-2 rounded-lg border border-border/30 p-2">
                          <span className="text-xs font-mono flex-1 truncate">{val}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <Select
                            value={mapping?.targetStageId || "auto"}
                            onValueChange={(v) => updateStageMapping(val, v === "auto" ? "" : v)}
                          >
                            <SelectTrigger className="h-7 text-xs w-28 border-border/50">
                              <SelectValue placeholder="Auto" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto-detect</SelectItem>
                              {stages.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={reset}>
                  Cancel
                </Button>
                <div className="flex items-center gap-2">
                  {!canImport && (
                    <span className="text-xs text-destructive">Map Company and Role to continue</span>
                  )}
                  <Button onClick={handleConfirmImport} disabled={!canImport} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Import {Math.min(totalRows, 500)} Application{totalRows !== 1 ? "s" : ""}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Importing Step ─────────────────────────── */}
          {step === "importing" && (
            <motion.div
              key="importing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4 py-10"
            >
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <div className="text-center">
                <p className="font-semibold text-foreground">Importing applications…</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {progress}% complete
                </p>
              </div>
              <Progress value={progress} className="w-64" />
            </motion.div>
          )}

          {/* ── Complete Step ──────────────────────────── */}
          {step === "complete" && result && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-display font-semibold text-foreground">
                    Import Complete!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.imported} application{result.imported !== 1 ? "s" : ""} imported
                    {result.duplicates > 0 && ` • ${result.duplicates} duplicate${result.duplicates !== 1 ? "s" : ""} skipped`}
                    {result.errors > 0 && ` • ${result.errors} error${result.errors !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>

              {/* Post-import CTAs */}
              <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">What's next?</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleClose}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    View on Board
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-red-500/30 text-red-500 hover:bg-red-500/10"
                    onClick={() => {
                      handleClose();
                      // Could open coach for stalled apps
                    }}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    Interview Coach on Stalled Apps
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleClose}>Done</Button>
              </div>
            </motion.div>
          )}

          {/* ── Error Step ─────────────────────────────── */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4 py-10"
            >
              <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-destructive" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Import Error</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button variant="outline" onClick={reset}>Try Again</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );

  function getAllHeaders(): string[] {
    return [...new Set(files.flatMap((f) => f.headers))];
  }
};

export default CSVImportModal;
