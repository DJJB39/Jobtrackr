

# Interview Coach (Ruthless Roast Edition)

## Overview

A full mock interview experience tied to a specific job. The AI generates tailored questions, speaks them aloud via browser SpeechSynthesis, listens to the user's spoken answer via SpeechRecognition, then streams per-answer feedback. Two modes: Helpful Coach and Ruthless Roast. Session results are persisted for later review.

---

## 1. Database Migration

New table `interview_sessions`:

```sql
CREATE TABLE public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid REFERENCES public.job_applications(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'helpful',
  model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  questions jsonb NOT NULL DEFAULT '[]',
  answers jsonb NOT NULL DEFAULT '[]',
  feedback jsonb NOT NULL DEFAULT '[]',
  overall_score integer,
  overall_feedback text,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.interview_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.interview_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.interview_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
```

JSONB columns store arrays of strings (questions, answers) and objects (feedback per answer with content_quality, star_structure, confidence, filler_words, relevance, score fields).

---

## 2. Edge Function Update (`ai-assist/index.ts`)

Add two new modes to the existing function:

- **`interview_questions`** — Non-streaming tool call. Given job description + CV, returns 6-8 structured questions via tool calling (array of `{question, type: "behavioral"|"role_specific"}`). System prompt instructs mix of behavioural and role-specific questions tailored to the job.

- **`interview_feedback`** — Streaming. Accepts the question, user's transcribed answer, job context, and mode (helpful/ruthless). Returns detailed markdown feedback analyzing: content quality, STAR structure usage, confidence indicators, filler words, relevance to job spec. Ruthless mode uses savage/sarcastic tone matching the existing roast style.

- **`interview_overall`** — Non-streaming tool call. Accepts all Q&A pairs + feedback summaries, returns structured `{score: 0-100, breakdown: {...}, summary: string}`.

All three modes count against the existing usage limit via `ai_usage_logs`.

---

## 3. New Hook: `src/hooks/useInterviewCoach.ts`

State machine managing the session lifecycle:

```text
idle → generating_questions → ready → speaking → listening → analyzing → ready (next Q) → complete
```

Key responsibilities:
- **Question generation**: Call `ai-assist` with mode `interview_questions`, parse structured response
- **Speech synthesis**: Use `window.speechSynthesis` to speak each question (select natural voice)
- **Speech recognition**: Use `webkitSpeechRecognition` / `SpeechRecognition` to capture answer text, with interim results for live "Listening..." display
- **Feedback streaming**: After each answer, call `ai-assist` with mode `interview_feedback` via `useSSEStream`
- **Overall score**: After all questions answered, call `interview_overall` for final score
- **Persistence**: Save session to `interview_sessions` table via Supabase client
- **Usage tracking**: Each AI call increments usage via `onUsageIncrement`

Exports: `startSession(job, mode)`, `nextQuestion()`, `skipQuestion()`, `stopListening()`, `currentQuestion`, `currentAnswer`, `currentFeedback`, `questions`, `answers`, `feedbacks`, `overallScore`, `sessionState`, `isListening`, `interimTranscript`

---

## 4. New Component: `src/components/InterviewCoach.tsx`

Full-screen dialog (using existing Sheet or Dialog) with glassmorphism styling:

**Session Start Screen:**
- Two large cards: "Helpful Coach" (green, encouraging icon) vs "Ruthless Roast Me" (red, flame icon)
- Job info displayed (company, role, description preview)
- "Start Session" button

**Active Session Screen:**
- Progress bar: "Question 3 of 7"
- Current question displayed prominently
- Large microphone button (animated ring when listening, pulsing red)
- "Listening..." text with interim transcript shown live
- "Skip Question" secondary button

**Feedback Screen (per question):**
- Streaming markdown feedback (reuses ReactMarkdown pattern)
- Model badge (consistent with AI settings)
- Score indicators for each dimension
- "Next Question" button

**Session Complete Screen:**
- Overall score ring (reuse ScoreRing pattern from CVView)
- Breakdown categories with individual scores
- Full markdown summary
- "Save & Close" button

---

## 5. Integration Points

### JobDetailPanel.tsx
- Add "Interview Coach" button next to existing "AI Assist" button in the header
- Add a 5th tab "Interview" showing past session scores for this job (fetched from `interview_sessions`)

### AppPage.tsx
- Add state for `interviewCoachOpen` and `interviewCoachJob`
- Pass handler to JobDetailPanel
- Render `InterviewCoach` component

### JobCard.tsx
- Add small "Coach" icon button (visible on hover) that opens interview coach for that job

---

## 6. Files Summary

| File | Action |
|------|--------|
| DB migration | New `interview_sessions` table |
| `supabase/functions/ai-assist/index.ts` | Add `interview_questions`, `interview_feedback`, `interview_overall` modes + system prompts |
| `src/hooks/useInterviewCoach.ts` | **New** — session state machine, speech APIs, streaming |
| `src/components/InterviewCoach.tsx` | **New** — full UI with glassmorphism, mic button, feedback display |
| `src/components/JobDetailPanel.tsx` | Add Coach button + Interview tab |
| `src/pages/AppPage.tsx` | Wire up InterviewCoach state + rendering |
| `src/components/JobCard.tsx` | Add hover Coach icon |

---

## 7. Browser API Notes

- `SpeechRecognition` requires HTTPS (preview URL qualifies) and user gesture to start
- `SpeechSynthesis` works without permissions
- Both APIs have no Safari iOS support for `SpeechRecognition` — will show graceful fallback: "Type your answer instead" text input
- Feature detection at hook level: `const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window`

---

## 8. Test Scenarios

1. **Helpful mode flow**: Start session → hear question → answer verbally → receive encouraging feedback → complete all questions → see overall score
2. **Ruthless mode flow**: Same flow but verify feedback tone is savage/sarcastic, scores are harsh
3. **Usage limit**: Verify coach is disabled when monthly limit reached, shows upgrade nudge
4. **Fallback**: Test on browser without SpeechRecognition — verify text input fallback appears
5. **Persistence**: Complete a session, close panel, reopen job detail → verify past session score shows in Interview tab

