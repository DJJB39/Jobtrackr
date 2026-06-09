/**
 * Generate a 1200x630 PNG share card in Cornerman editorial style.
 * Pure canvas — no extra deps. Uses Fraunces (already loaded via index.css)
 * with serif fallbacks if not ready.
 */

const W = 1200;
const H = 630;
const AMBER = "#f0b04a";
const TEXT = "#f5f0e6";
const DIM = "rgba(245,240,230,0.55)";
const BG = "#0c0a08";

function truncate(s: string, max = 120): string {
  const clean = (s || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + "…";
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 3): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
      if (lines.length === maxLines - 1) break;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const last = lines[maxLines - 1];
    lines.length = maxLines;
    lines[maxLines - 1] = last.length > 3 ? last.slice(0, -1) + "…" : last;
  }
  return lines;
}

function drawGrain(ctx: CanvasRenderingContext2D) {
  // Subtle film grain
  const img = ctx.createImageData(W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    d[i] = d[i + 1] = d[i + 2] = 0;
    d[i + 3] = Math.max(0, n);
  }
  ctx.putImageData(img, 0, 0);
}

export async function generateShareCardBlob(opts: {
  score: number | null;
  line: string;
  url?: string;
}): Promise<Blob> {
  // Try to wait for Fraunces if available
  try {
    if ((document as any).fonts?.load) {
      await Promise.all([
        (document as any).fonts.load("700 280px Fraunces"),
        (document as any).fonts.load("400 28px 'IBM Plex Mono'"),
      ]);
    }
  } catch { /* ignore */ }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Subtle amber halo top-left
  const halo = ctx.createRadialGradient(180, 80, 20, 180, 80, 600);
  halo.addColorStop(0, "rgba(240,176,74,0.18)");
  halo.addColorStop(1, "rgba(240,176,74,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // Top meta: 0X / CORNERMAN ROAST
  ctx.fillStyle = AMBER;
  ctx.font = "500 18px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.textBaseline = "top";
  ctx.fillText("01 / CORNERMAN ROAST", 72, 64);
  ctx.fillStyle = "rgba(245,240,230,0.18)";
  ctx.fillRect(360, 76, W - 360 - 72, 1);

  // Score (huge, Fraunces)
  const scoreStr = opts.score == null ? "—" : `${Math.round(opts.score)}`;
  ctx.fillStyle = AMBER;
  ctx.font = "300 280px Fraunces, 'Times New Roman', serif";
  ctx.textBaseline = "alphabetic";
  const scoreY = 360;
  ctx.fillText(scoreStr, 64, scoreY);
  const scoreW = ctx.measureText(scoreStr).width;

  // /100 label next to score
  ctx.fillStyle = DIM;
  ctx.font = "300 56px Fraunces, 'Times New Roman', serif";
  ctx.fillText("/100", 64 + scoreW + 18, scoreY);

  // Roast line under score
  ctx.fillStyle = TEXT;
  ctx.font = "italic 300 36px Fraunces, 'Times New Roman', serif";
  const lines = wrapLines(ctx, `"${truncate(opts.line)}"`, W - 144, 3);
  let ly = scoreY + 40;
  for (const line of lines) {
    ctx.fillText(line, 72, ly);
    ly += 48;
  }

  // Footer: wordmark + url (mono, bottom-left)
  ctx.fillStyle = TEXT;
  ctx.font = "500 28px Fraunces, 'Times New Roman', serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Cornerman", 72, H - 64);
  ctx.fillStyle = DIM;
  ctx.font = "500 18px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.fillText(opts.url || "cornerman.app/roast", 72, H - 36);

  // Bottom-right tag
  ctx.fillStyle = AMBER;
  ctx.font = "500 18px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.fillText("GET YOURS — FREE", W - 72, H - 36);
  ctx.textAlign = "left";

  // Grain overlay
  drawGrain(ctx);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))), "image/png");
  });
}

export function extractRoastLine(markdown: string): string {
  if (!markdown) return "";
  // Strip headings/score line, find first prose sentence.
  const cleaned = markdown
    .replace(/^#.*$/gm, "")
    .replace(/^\s*Score\s*:.*$/gim, "")
    .replace(/[*_`>#-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  // Pull first sentence
  const match = cleaned.match(/[^.!?]+[.!?]/);
  return (match ? match[0] : cleaned).trim();
}

export function extractScore(markdown: string): number | null {
  if (!markdown) return null;
  // Matches "Score: 4/10", "Score: 42/100", "# Score: 3/10"
  const m = markdown.match(/score\s*[:\-]?\s*(\d{1,3})\s*\/\s*(10|100)/i);
  if (!m) return null;
  const raw = parseInt(m[1], 10);
  const denom = parseInt(m[2], 10);
  if (denom === 10) return Math.min(100, raw * 10);
  return Math.min(100, raw);
}