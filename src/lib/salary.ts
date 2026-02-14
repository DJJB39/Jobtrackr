/**
 * Parse a free-text salary string into structured min/max values (in thousands).
 * Handles: $130k-$160k, $130,000-$160,000, $130k, EUR 80k, 80000, etc.
 */
export function parseSalary(raw: string | null | undefined): { min: number; max: number } | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[,£$€]/g, "").trim();

  // Range: "$130k-$160k", "130000-160000", "$50k – $70k"
  const rangeMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*k?\s*[-–—to]+\s*\$?\s*(\d+(?:\.\d+)?)\s*k?/i);
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1]);
    let max = parseFloat(rangeMatch[2]);
    // If the original string has "k" anywhere, treat small numbers as thousands
    const hasK = /k/i.test(raw);
    if (hasK) {
      if (min < 1000) min = min; // already in k
      else min = min / 1000;
      if (max < 1000) max = max;
      else max = max / 1000;
    } else {
      // Plain numbers — normalize to thousands
      if (min >= 1000) min = min / 1000;
      if (max >= 1000) max = max / 1000;
    }
    return { min, max };
  }

  // Single value: "$130k", "80000", "EUR 80k"
  const singleMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*k?/i);
  if (singleMatch) {
    let val = parseFloat(singleMatch[1]);
    const hasK = /k/i.test(raw);
    if (hasK) {
      if (val >= 1000) val = val / 1000;
    } else {
      if (val >= 1000) val = val / 1000;
    }
    return { min: val, max: val };
  }

  return null;
}

/**
 * Get a color class based on parsed salary max value.
 */
export function getSalaryColorFromParsed(salary: string): string {
  const parsed = parseSalary(salary);
  const max = parsed?.max ?? 0;
  if (max >= 150) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/20";
  if (max >= 100) return "bg-blue-500/20 text-blue-400 border-blue-500/20";
  if (max >= 50) return "bg-amber-500/20 text-amber-400 border-amber-500/20";
  return "bg-primary/20 text-primary border-primary/20";
}

// TODO Phase 2: range slider filter component
