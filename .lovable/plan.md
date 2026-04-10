

# AI Model Selection + Usage Controls (Realistic Version)

## What actually gets built

1. **Model selector in user settings** — Pick from Lovable AI Gateway models (Gemini Flash, Gemini Pro, GPT-5-mini, GPT-5). No user API keys. No separate SDKs.
2. **Usage tracking** — Count generations per user per month, enforce free-tier limit (10/month), show counter in UI.
3. **Backend: pass model preference** — Edge function reads user's preferred model from request, forwards to gateway.
4. **Frontend: model badge + regenerate with different model** — Show which model generated the content; allow one-click regenerate with a different model.

---

## Technical Details

### 1. Database Migration

New table `ai_usage_logs`:
```sql
CREATE TABLE ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mode text NOT NULL,
  model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  job_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
-- RLS: users see/insert own logs only
```

New column on `user_preferences`:
```sql
ALTER TABLE user_preferences
  ADD COLUMN preferred_model text NOT NULL DEFAULT 'google/gemini-3-flash-preview';
```

### 2. Edge Function Update (`ai-assist/index.ts`)

- Accept optional `model` field in request body
- Validate against allowlist: `google/gemini-3-flash-preview`, `google/gemini-2.5-flash`, `google/gemini-2.5-pro`, `openai/gpt-5-mini`, `openai/gpt-5`
- Default to `google/gemini-3-flash-preview` if not provided or invalid
- Count usage: INSERT into `ai_usage_logs` using service role client
- Check usage: SELECT count for current month; reject with 403 + clear message if over 10 (free tier)
- Pass validated model to the existing `ai.gateway.lovable.dev` call

### 3. Settings UI (new section in UserMenu or dedicated component)

- **`src/components/AISettings.tsx`** — New component opened from UserMenu
- Model selector dropdown with 5 options, showing relative speed/quality labels:
  - Gemini Flash (fastest, default)
  - Gemini 2.5 Flash (balanced)
  - Gemini 2.5 Pro (best quality, slower)
  - GPT-5 Mini (fast, good quality)
  - GPT-5 (highest quality, slowest)
- Usage counter: "X/10 AI generations used this month" with progress bar
- Glassmorphism card styling matching existing UI

### 4. Frontend Hook Update

- **`src/hooks/useAIPreferences.ts`** — New hook that loads/saves preferred model from `user_preferences`
- **`src/hooks/useSSEStream.ts`** — Accept optional `model` param, include in request body
- **`src/hooks/useAIGeneration.ts`** and **`src/hooks/useRuthlessReview.ts`** — Read model from preferences hook, pass to stream calls
- **`src/components/AIAssistPanel.tsx`** — Add small model selector dropdown next to Generate button; show model badge on generated content

### 5. Usage Widget

- Small pill in the app header or CV view showing "3/10 AI uses"
- When limit reached: disable AI buttons, show "Upgrade to Pro for unlimited" message
- Usage resets monthly (checked server-side by counting rows in current calendar month)

---

## Files Modified/Created

| File | Change |
|------|--------|
| `supabase/functions/ai-assist/index.ts` | Add model param, usage tracking, limit check |
| `src/hooks/useAIPreferences.ts` | **New** — load/save model preference + usage count |
| `src/components/AISettings.tsx` | **New** — model selector + usage display |
| `src/components/UserMenu.tsx` | Add "AI Settings" menu item |
| `src/hooks/useAIGeneration.ts` | Pass model to stream |
| `src/hooks/useRuthlessReview.ts` | Pass model to stream |
| `src/components/AIAssistPanel.tsx` | Model selector + badge |
| `src/components/CVView.tsx` | Usage counter pill, disable when limit hit |
| DB migration | `ai_usage_logs` table + `preferred_model` column |

## What's NOT included (and why)

- **User API keys** — Security risk, bypasses gateway, unnecessary complexity
- **Temperature/max tokens/system prompt** — Zero value for job seekers
- **Response caching table** — Stale AI output is worse than no cache; localStorage suffices for scores
- **Adapter pattern with separate SDKs** — The gateway IS the adapter
- **Cost estimates in £** — You don't have per-request cost data from the gateway

