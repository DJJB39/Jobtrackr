

# Add Action Checklist to Ruthless Review Prompt

One file changed, one line appended.

---

## Change

**File:** `supabase/functions/ai-assist/index.ts`

Append the following instruction to the end of the existing `ruthless_review` system prompt string (before the closing backtick), separated by a space:

```
End your response with a numbered checklist titled '## Immediate Action Checklist' containing the 5-8 highest-impact changes the user should make right now (in priority order). Each item should be concise, start with a strong verb, and be something they can realistically do in the next edit. Do not add any extra encouragement or closing paragraph after the checklist.
```

The full prompt will end with:
```
...Be condescending and sarcastic where appropriate. Structure with markdown: # Score: X/10 ## Strengths (if any) ## Fatal Flaws ## How to Fix It (be prescriptive) End your response with a numbered checklist titled '## Immediate Action Checklist' containing the 5-8 highest-impact changes the user should make right now (in priority order). Each item should be concise, start with a strong verb, and be something they can realistically do in the next edit. Do not add any extra encouragement or closing paragraph after the checklist.`
```

No other files affected. Edge function redeploys automatically.

