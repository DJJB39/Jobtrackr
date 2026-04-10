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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Edit3,
  ImageIcon,
  X,
  ShieldAlert,
} from "lucide-react";
import { useScreenshotCapture, type ExtractedJobData } from "@/hooks/useScreenshotCapture";
import { useJobStore } from "@/stores/jobStore";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ScreenshotCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobSaved?: (jobId: string) => void;
}

const ScreenshotCaptureModal = ({ open, onOpenChange, onJobSaved }: ScreenshotCaptureModalProps) => {
  const { user } = useAuth();
  const { addJob } = useJobStore();
  const { toast } = useToast();
  const { extracting, extractedData, error, extractFromImage, reset } = useScreenshotCapture();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ExtractedJobData>>({});
  const [saving, setSaving] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      const result = await extractFromImage(base64);
      if (result) {
        setEditedData(result);
      }
    };
    reader.readAsDataURL(file);
  }, [extractFromImage, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) handleFile(file);
        break;
      }
    }
  }, [handleFile]);

  const handleSave = useCallback(async () => {
    if (!user || !editedData.company || !editedData.job_title) {
      toast({ title: "Missing data", description: "Company and job title are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const links = editedData.sourceUrl ? [editedData.sourceUrl] : [];
      const result = await addJob(user.id, editedData.company!, editedData.job_title!, "found", editedData.employment_type || "Other", {
        location: editedData.location,
        description: editedData.description,
        salary: editedData.salary,
        links: links.length > 0 ? links : undefined,
      });

      if (result) {
        toast({ title: "Job saved!", description: `${editedData.company} — ${editedData.job_title}` });
        onJobSaved?.(result.id);
        handleClose();
      }
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [user, editedData, addJob, toast, onJobSaved]);

  const handleClose = useCallback(() => {
    setPreview(null);
    setEditedData({});
    setEditMode(false);
    reset();
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const data = editMode ? editedData : (extractedData || {});

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto glass border-border/50"
        onPaste={handlePaste}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-display">
            <Camera className="h-5 w-5 text-primary" />
            Screenshot Job Capture
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Upload or paste a screenshot of a job posting — AI extracts the details automatically.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!preview && !extractedData && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-border/60 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <ImageIcon className="h-7 w-7 text-primary/70" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Drop a screenshot here, or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You can also paste from clipboard (Ctrl+V / ⌘V)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-[10px]">PNG</Badge>
                    <Badge variant="secondary" className="text-[10px]">JPG</Badge>
                    <Badge variant="secondary" className="text-[10px]">WebP</Badge>
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />

              {/* Privacy disclaimer */}
              <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-muted/30 border border-border/30">
                <ShieldAlert className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Screenshot processed privately and deleted immediately. Accuracy is not 100% — always review extracted details before saving.
                </p>
              </div>
            </motion.div>
          )}

          {extracting && (
            <motion.div
              key="extracting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-12"
            >
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Extracting job details…</p>
                <p className="text-xs text-muted-foreground mt-1">AI is reading the screenshot</p>
              </div>
              {preview && (
                <img src={preview} alt="Screenshot preview" className="max-h-32 rounded-lg border border-border/30 opacity-50" />
              )}
            </motion.div>
          )}

          {extractedData && !extracting && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Confidence + warnings */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={extractedData.confidence >= 0.7 ? "default" : "secondary"}
                  className={extractedData.confidence >= 0.7 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}
                >
                  {extractedData.confidence >= 0.7 ? (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  )}
                  {Math.round(extractedData.confidence * 100)}% confidence
                </Badge>
                {extractedData.warnings?.map((w, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                    {w}
                  </Badge>
                ))}
              </div>

              {/* Extracted fields */}
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Company</label>
                    {editMode ? (
                      <Input
                        value={editedData.company ?? ""}
                        onChange={(e) => setEditedData(d => ({ ...d, company: e.target.value }))}
                        className="h-8 text-sm mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium text-foreground mt-1">{extractedData.company || "—"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Job Title</label>
                    {editMode ? (
                      <Input
                        value={editedData.job_title ?? ""}
                        onChange={(e) => setEditedData(d => ({ ...d, job_title: e.target.value }))}
                        className="h-8 text-sm mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium text-foreground mt-1">{extractedData.job_title || "—"}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Location</label>
                    {editMode ? (
                      <Input
                        value={editedData.location ?? ""}
                        onChange={(e) => setEditedData(d => ({ ...d, location: e.target.value }))}
                        className="h-8 text-sm mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{extractedData.location || "—"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Salary</label>
                    {editMode ? (
                      <Input
                        value={editedData.salary ?? ""}
                        onChange={(e) => setEditedData(d => ({ ...d, salary: e.target.value }))}
                        className="h-8 text-sm mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{extractedData.salary || "—"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Type</label>
                    {editMode ? (
                      <Input
                        value={editedData.employment_type ?? ""}
                        onChange={(e) => setEditedData(d => ({ ...d, employment_type: e.target.value }))}
                        className="h-8 text-sm mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">{extractedData.employment_type || "—"}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Description</label>
                  {editMode ? (
                    <Textarea
                      value={editedData.description ?? ""}
                      onChange={(e) => setEditedData(d => ({ ...d, description: e.target.value }))}
                      className="text-sm mt-1 min-h-[80px]"
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-4">
                      {extractedData.description || "No description extracted"}
                    </p>
                  )}
                </div>

                {/* Requirements */}
                {(extractedData.key_requirements?.length ?? 0) > 0 && (
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Key Requirements</label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {extractedData.key_requirements!.map((req, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{req}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (editMode) {
                      setEditMode(false);
                    } else {
                      setEditedData({ ...extractedData });
                      setEditMode(true);
                    }
                  }}
                  className="gap-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  {editMode ? "Done Editing" : "Edit"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPreview(null);
                    reset();
                    setEditMode(false);
                    setEditedData({});
                  }}
                  className="gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  Try Another
                </Button>
                <div className="flex-1" />
                <Button
                  onClick={handleSave}
                  disabled={saving || !(editMode ? editedData.company && editedData.job_title : extractedData.company && extractedData.job_title)}
                  className="gap-1.5 shadow-glow"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Save to Board
                </Button>
              </div>

              {/* Privacy note */}
              <p className="text-[10px] text-muted-foreground/60 text-center">
                Screenshot was processed privately and is not stored.
              </p>
            </motion.div>
          )}

          {error && !extracting && !extractedData && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
              <p className="text-sm text-destructive font-medium">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setPreview(null);
                  reset();
                }}
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ScreenshotCaptureModal;
