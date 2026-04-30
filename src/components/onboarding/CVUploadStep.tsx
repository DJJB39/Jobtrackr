import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, FileText, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const MAX_SIZE = 5 * 1024 * 1024;

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

interface Props {
  onSubmit: (text: string) => Promise<void> | void;
  initialText?: string;
}

const CVUploadStep = ({ onSubmit, initialText }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState(initialText ?? "");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Migrate any existing localStorage CV
  useEffect(() => {
    if (text || !user) return;
    const cached = localStorage.getItem(`cv-text-${user.id}`);
    if (cached) setText(cached);
  }, [user, text]);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > MAX_SIZE) {
      toast({ title: "File too large", description: "Max 5 MB", variant: "destructive" });
      return;
    }
    if (file.type !== "application/pdf") {
      toast({ title: "PDF only", description: "Paste your CV text below if you don't have a PDF", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const extracted = await extractTextFromPDF(file);
      setText(extracted);
      toast({ title: "CV parsed", description: `${extracted.length.toLocaleString()} characters extracted` });
    } catch (e: any) {
      toast({ title: "Parse failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }, [toast]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (trimmed.length < 100) {
      toast({ title: "Need more text", description: "Add at least a paragraph so the AI has something to work with", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      if (user) localStorage.setItem(`cv-text-${user.id}`, trimmed);
      await onSubmit(trimmed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h2 className="text-2xl font-display text-foreground">Let's start with your CV</h2>
        <p className="mt-1 text-sm text-muted-foreground">Drop a PDF or paste the text. The AI will read every line.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        onClick={() => fileRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all ${dragging ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40 hover:bg-secondary/30"}`}
      >
        {busy ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
        <p className="text-sm font-medium text-foreground">{busy ? "Parsing…" : "Drop PDF or click to upload"}</p>
        <p className="text-[11px] text-muted-foreground/70">Max 5 MB · PDF only</p>
        <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <FileText className="h-3.5 w-3.5" /> Or paste your CV here
        </label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="Paste the full text of your CV — summary, experience, skills, everything."
          className="font-mono text-xs"
        />
        <p className="text-[11px] text-muted-foreground/70">{text.length.toLocaleString()} characters</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={busy || text.trim().length < 100} size="lg" className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Continue to assessment
        </Button>
      </div>
    </motion.div>
  );
};

export default CVUploadStep;
