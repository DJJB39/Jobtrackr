import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Download, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

interface CVUploadSectionProps {
  onCVTextReady?: (text: string | null, isNewUpload?: boolean) => void;
}

async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item: any) => item.str).join(" "));
  }
  return pages.join("\n\n");
}

const CVUploadSection = ({ onCVTextReady }: CVUploadSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [cvExists, setCvExists] = useState(false);
  const [cvUpdatedAt, setCvUpdatedAt] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const storagePath = user ? `${user.id}/cv-latest.pdf` : "";

  const checkCV = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.storage.from("resumes").list(user.id, { limit: 1, search: "cv-latest.pdf" });
    if (data && data.length > 0) {
      setCvExists(true);
      setCvUpdatedAt(data[0].updated_at ?? data[0].created_at ?? null);
    } else {
      setCvExists(false);
      setCvUpdatedAt(null);
    }
  }, [user]);

  useEffect(() => { checkCV(); }, [checkCV]);

  // Try to load cached text
  useEffect(() => {
    if (!user) return;
    const cached = localStorage.getItem(`cv-text-${user.id}`);
    onCVTextReady?.(cached || null, false);
  }, [user, onCVTextReady]);

  const handleFile = async (file: File) => {
    if (!user) return;
    if (file.size > MAX_SIZE) {
      toast({ title: "File too large", description: "Max 5 MB allowed", variant: "destructive" });
      return;
    }
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Only PDF files are supported", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      // Extract text first
      const text = await extractTextFromPDF(file);
      localStorage.setItem(`cv-text-${user.id}`, text);
      onCVTextReady?.(text, true);

      // Upload to storage
      const { error } = await supabase.storage.from("resumes").upload(storagePath, file, { upsert: true });
      if (error) throw error;

      setCvExists(true);
      setCvUpdatedAt(new Date().toISOString());
      toast({ title: "CV uploaded", description: "Your CV has been saved and parsed" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!user) return;
    const { data, error } = await supabase.storage.from("resumes").download(storagePath);
    if (error || !data) { toast({ title: "Download failed", variant: "destructive" }); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cv-latest.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!user) return;
    const { error } = await supabase.storage.from("resumes").remove([storagePath]);
    if (error) { toast({ title: "Delete failed", variant: "destructive" }); return; }
    setCvExists(false);
    setCvUpdatedAt(null);
    localStorage.removeItem(`cv-text-${user.id}`);
    onCVTextReady?.(null);
    toast({ title: "CV deleted" });
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [user]);

  return (
    <div className="space-y-3">
      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border/50 hover:border-primary/40 hover:bg-secondary/30"
        }`}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground">
          {uploading ? "Uploading & parsing…" : "Drop PDF here or click to upload"}
        </p>
        <p className="text-[10px] text-muted-foreground/60">Max 5 MB · PDF only</p>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
      </div>

      {/* Current CV status */}
      <AnimatePresence>
        {cvExists && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/20 px-4 py-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                cv-latest.pdf
              </p>
              {cvUpdatedAt && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  Updated {new Date(cvUpdatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDownload(); }} className="h-8 w-8 p-0">
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CVUploadSection;
