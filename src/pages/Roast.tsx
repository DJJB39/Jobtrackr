import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Flame, Loader2, ArrowRight, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import ShareScoreButton from "@/components/ShareScoreButton";
import { supabase } from "@/integrations/supabase/client";

const MAX_SIZE = 5 * 1024 * 1024;
const MAX_CHARS = 15000;
const PENDING_KEY = "cornerman:pending-roast";

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

interface RoastResult {
  score: number;
  feedback_md: string;
  strengths: string[];
  gaps: string[];
  quick_wins: string[];
  roast_line: string;
}

const Roast = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RoastResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // If logged-in users land here, just send them to /app
  useEffect(() => {
    if (user) navigate("/app", { replace: true });
  }, [user, navigate]);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > MAX_SIZE) return toast({ title: "File too large", description: "Max 5 MB", variant: "destructive" });
    if (file.type !== "application/pdf") return toast({ title: "PDF only", description: "Paste your CV text below instead", variant: "destructive" });
    setParsing(true);
    try {
      const extracted = await extractTextFromPDF(file);
      setText(extracted);
      toast({ title: "CV parsed", description: `${extracted.length.toLocaleString()} characters extracted` });
    } catch (e: any) {
      toast({ title: "Parse failed", description: e.message, variant: "destructive" });
    } finally {
      setParsing(false);
    }
  }, [toast]);

  const runRoast = async () => {
    const trimmed = text.trim();
    if (trimmed.length < 100) {
      return toast({ title: "Need more text", description: "Paste at least a paragraph", variant: "destructive" });
    }
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("public-roast", {
        body: { cvText: trimmed.slice(0, MAX_CHARS) },
      });
      if (error) {
        const msg = (error as any)?.context?.error || (error as any)?.message || "Roast failed";
        toast({ title: "No roast for you", description: msg, variant: "destructive" });
        return;
      }
      if (!data || (data as any).error) {
        toast({ title: "No roast for you", description: (data as any)?.error || "Unknown error", variant: "destructive" });
        return;
      }
      const r = data as RoastResult;
      setResult(r);
      // Stash for sign-up hydration
      try {
        localStorage.setItem(PENDING_KEY, JSON.stringify({
          cvText: trimmed.slice(0, MAX_CHARS),
          result: r,
          at: Date.now(),
        }));
      } catch {}
    } catch (e: any) {
      toast({ title: "Roast failed", description: e?.message || "Try again", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const firstParagraph = (() => {
    if (!result?.feedback_md) return "";
    const paras = result.feedback_md
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter((s) => s && !/^#/.test(s) && !/^score\s*:/i.test(s));
    return paras[0] || "";
  })();

  return (
    <div className="cornerman cm-grain min-h-screen flex flex-col relative overflow-hidden">
      <div className="cm-halo pointer-events-none absolute top-0 left-0 right-0 h-[500px] z-0" />

      <header className="relative z-20">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="cm-serif text-xl font-medium">Cornerman</span>
            <span className="cm-mono cm-text-dim text-[10px] uppercase tracking-[0.18em]">/ Roast</span>
          </Link>
          <Link to="/auth" className="cm-mono cm-text-dim text-[11px] uppercase tracking-[0.18em] hover:text-[color:var(--cm-text)]">
            Log in
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        <section className="mx-auto max-w-2xl px-6 pt-10 pb-24">
          <div className="mb-6 flex items-center gap-3">
            <span className="cm-mono cm-text-amber text-[10px] uppercase tracking-[0.22em]">01 / Drop your CV</span>
            <span className="cm-meta-rule flex-1" />
          </div>

          <h1 className="cm-serif text-[40px] sm:text-[56px] leading-[1.02] font-light mb-4">
            Get <span className="italic cm-text-amber">roasted.</span>
          </h1>
          <p className="cm-text-dim text-[16px] mb-10 max-w-lg">
            No account. No email. Drop a CV, get a score and a brutally honest one-liner you can post anywhere.
          </p>

          {!result && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                onClick={() => fileRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-all ${dragging ? "border-[color:var(--cm-amber)] bg-[color:var(--cm-amber)]/5" : "border-[color:var(--cm-text)]/20 hover:border-[color:var(--cm-amber)]/50"}`}
              >
                {parsing ? <Loader2 className="h-8 w-8 cm-text-amber animate-spin" /> : <Upload className="h-8 w-8 cm-text-dim" />}
                <p className="text-sm font-medium">{parsing ? "Parsing…" : "Drop PDF or click to upload"}</p>
                <p className="cm-text-dim text-[11px]">Max 5 MB · PDF only</p>
                <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
              </div>

              <div className="mt-6 space-y-2">
                <label className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] cm-text-dim">
                  <FileText className="h-3.5 w-3.5" /> Or paste your CV
                </label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                  rows={10}
                  placeholder="Paste the full text of your CV — summary, experience, skills, everything."
                  className="font-mono text-xs bg-transparent border-[color:var(--cm-text)]/15"
                />
                <p className="cm-text-dim text-[11px]">{text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars</p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  onClick={runRoast}
                  disabled={running || parsing || text.trim().length < 100}
                  size="lg"
                  className="gap-2 cm-cta-primary rounded-full"
                >
                  {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4" />}
                  Roast me
                </Button>
                <p className="cm-text-dim cm-mono text-[10px] uppercase tracking-[0.18em]">Free · 2 per day</p>
              </div>
            </>
          )}

          {result && (
            <div className="space-y-8">
              <div className="cm-roast-card rounded-2xl p-8">
                <p className="cm-mono cm-text-amber text-[10px] uppercase tracking-[0.22em] mb-4">02 / Verdict</p>
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="cm-serif cm-text-amber text-[120px] leading-none font-light">{Math.round(result.score)}</span>
                  <span className="cm-text-dim cm-serif text-[28px]">/100</span>
                </div>
                <p className="cm-serif italic text-[22px] leading-[1.4] mb-6">
                  "{result.roast_line}"
                </p>
                {firstParagraph && (
                  <p className="text-[15px] leading-[1.7] cm-text-dim whitespace-pre-wrap">{firstParagraph}</p>
                )}

                <div className="mt-8 pt-6 border-t border-[color:var(--cm-text)]/10">
                  <ShareScoreButton
                    score={result.score}
                    line={result.roast_line || firstParagraph}
                    label="Share my score"
                    variant="default"
                    size="default"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-[color:var(--cm-text)]/15 p-6 text-center">
                <p className="cm-serif text-[22px] mb-2">
                  See the <span className="italic cm-text-amber">full corner report.</span>
                </p>
                <p className="cm-text-dim text-sm mb-5">
                  Strengths, gaps, an action checklist and unlimited roasts — free account, no card.
                </p>
                <Link to="/auth?tab=signup" className="cm-cta-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm">
                  Free account <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => { setResult(null); setText(""); }}
                  className="cm-mono cm-text-dim text-[11px] uppercase tracking-[0.18em] hover:text-[color:var(--cm-text)]"
                >
                  ← Roast another
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="relative z-10 border-t border-[color:var(--cm-text)]/10 py-6">
        <div className="mx-auto max-w-3xl px-6 flex items-center justify-between">
          <span className="cm-mono cm-text-dim text-[10px] uppercase tracking-[0.18em]">© Cornerman</span>
          <Link to="/" className="cm-mono cm-text-dim text-[10px] uppercase tracking-[0.18em] hover:text-[color:var(--cm-text)]">
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Roast;