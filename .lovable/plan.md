

# Polish Ruthless CV Review

Two files modified. No new dependencies.

---

## 1. Edge Function: `supabase/functions/ai-assist/index.ts`

**Add `ruthless_review` to `SYSTEM_PROMPTS`** (after `cv_suitability` on line 31):

```
ruthless_review: `You are a brutally honest, no-filter career assassin. Your job is to destroy weak CVs. Be savage, mean, and merciless -- roast this CV like it's the worst pitch you've ever seen. Give a harsh 1-10 score (most deserve 3-5). Rip apart every weakness, call out cliches, generic bullet points, irrelevant jobs, poor formatting, and missing impact. Be direct, rude if needed -- no encouragement, no 'you have potential'. Only brutal truth, specific fixes, and why this CV is getting auto-rejected. Never say anything positive unless it's immediately followed by a bigger criticism. Never use words like 'good', 'strong', 'well done', 'potential', 'impressive'. Be condescending and sarcastic where appropriate. Structure with markdown: # Score: X/10 ## Strengths (if any) ## Fatal Flaws ## How to Fix It (be prescriptive)`
```

**Add CV-only user content branch** (around line 92): When `mode === "ruthless_review"`, build user content from just `cvText` (no job fields needed):

```typescript
const userContent = mode === "ruthless_review"
  ? `--- CV to Review ---\n${cvText?.slice(0, 6000) ?? "No CV provided"}`
  : jobContext;
```

Then pass `userContent` instead of `jobContext` in both the streaming and non-streaming fetch calls. The `ruthless_review` mode falls through to the existing streaming path -- no new fetch logic.

---

## 2. Frontend: `src/components/CVView.tsx`

### New imports
- `Flame, Copy, RefreshCw` from `lucide-react`
- `Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter` from `@/components/ui/sheet`
- `ReactMarkdown` from `react-markdown`
- `Component` from `react` (for error boundary)

### Simple error boundary component (inside CVView.tsx)
```tsx
class MarkdownErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="text-sm text-destructive p-4">Failed to render review</div>;
    return this.props.children;
  }
}
```

### New state (after line 56)
- `ruthlessLoading` (boolean, false)
- `ruthlessText` (string, "")
- `ruthlessOpen` (boolean, false)
- `ruthlessCooldown` (boolean, false)

### Cooldown logic
On mount + after click, check `localStorage.getItem("ruthless-cooldown")`. If within 30s, set cooldown true and `setTimeout` for remaining ms. On click, write `Date.now()` to localStorage.

### `startRuthlessReview` async function
1. Guard: no `cvText` -- toast error, return
2. Guard: no `session?.access_token` -- toast error, return
3. Truncation warning: `if (cvText.length > 6000) toast({ title: "CV truncated", description: "CV truncated to 6000 chars for review" })`
4. Set cooldown timestamp, `ruthlessLoading = true`, `ruthlessText = ""`, `ruthlessOpen = true`
5. Fetch `AI_URL` with `mode: "ruthless_review"`, `job: {}`, `cvText`
6. On error response: toast "Grok review unavailable -- try again later"
7. Read SSE stream: parse `data:` lines, extract `choices[0].delta.content`, append to `ruthlessText`
8. On `[DONE]` or stream end: `ruthlessLoading = false`
9. On catch: toast fallback, loading false

### UI additions

**Ruthless Review button + helper text** (after `<CVUploadSection>` on line 142, visible when `cvText` exists):
```tsx
{cvText && (
  <div className="space-y-1">
    <Button variant="destructive" size="sm" className="gap-2"
      onClick={startRuthlessReview}
      disabled={ruthlessLoading || ruthlessCooldown}>
      {ruthlessLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4" />}
      {ruthlessCooldown ? "Cooldown..." : "Ruthless Review"}
    </Button>
    <p className="text-xs text-muted-foreground">
      Takes 5-15s. Be prepared -- this is brutal.
    </p>
  </div>
)}
```

**Sheet panel** (before closing `</div>` at line 299):
```tsx
<Sheet open={ruthlessOpen} onOpenChange={setRuthlessOpen}>
  <SheetContent className="sm:max-w-lg flex flex-col">
    <SheetHeader>
      <SheetTitle className="flex items-center gap-2 text-destructive">
        <Flame className="h-5 w-5" /> Ruthless CV Review
      </SheetTitle>
    </SheetHeader>
    <ScrollArea className="flex-1 pr-4">
      <MarkdownErrorBoundary>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{ruthlessText || "Waiting for the roast..."}</ReactMarkdown>
        </div>
      </MarkdownErrorBoundary>
    </ScrollArea>
    <SheetFooter className="flex-row gap-2">
      <Button variant="outline" size="sm" className="gap-2"
        onClick={() => {
          navigator.clipboard.writeText(ruthlessText);
          toast({ title: "Copied ruthless review to clipboard" });
        }}
        disabled={!ruthlessText || ruthlessLoading}>
        <Copy className="h-4 w-4" /> Copy
      </Button>
      <Button variant="outline" size="sm" className="gap-2"
        onClick={startRuthlessReview}
        disabled={ruthlessLoading || ruthlessCooldown}>
        <RefreshCw className="h-4 w-4" /> Retry
      </Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

---

## Summary

| File | Changes |
|------|---------|
| `supabase/functions/ai-assist/index.ts` | Add `ruthless_review` prompt + CV-only content branch |
| `src/components/CVView.tsx` | Add button, helper text, cooldown, streaming, Sheet with markdown error boundary, copy toast, retry |

No new secrets, no new dependencies, deploys automatically.

