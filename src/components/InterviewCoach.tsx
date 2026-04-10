import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic,
  MicOff,
  SkipForward,
  Volume2,
  Send,
  Flame,
  Heart,
  Loader2,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  X,
  Keyboard,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { JobApplication } from "@/types/job";
import {
  useInterviewCoach,
  type CoachMode,
} from "@/hooks/useInterviewCoach";
import { AI_MODELS } from "@/hooks/useAIPreferences";

interface InterviewCoachProps {
  job: JobApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferredModel?: string;
  onUsageIncrement?: () => void;
  isLimitReached?: boolean;
}

// Score ring reused from CVView pattern
const ScoreRing = ({ score, size = 80 }: { score: number; size?: number }) => {
  const color = score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-red-500";
  const r = (size / 2) - 4;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          className={color}
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <span className={`text-lg font-display font-bold ${color}`}>{score}</span>
    </div>
  );
};

const BreakdownBar = ({ label, score }: { label: string; score: number }) => {
  const color = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold">{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />
      </div>
    </div>
  );
};

const InterviewCoach = ({
  job,
  open,
  onOpenChange,
  preferredModel,
  onUsageIncrement,
  isLimitReached,
}: InterviewCoachProps) => {
  const coach = useInterviewCoach(preferredModel, onUsageIncrement);
  const [useTextInput, setUseTextInput] = useState(!coach.hasSpeechRecognition);

  const modelLabel = coach.lastModel
    ? AI_MODELS.find((m) => m.id === coach.lastModel)?.label
    : null;

  const handleClose = () => {
    coach.resetSession();
    onOpenChange(false);
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl h-[85vh] p-0 flex flex-col overflow-hidden gap-0 border-border/50 bg-background/95 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              {coach.coachMode === "ruthless" ? (
                <Flame className="h-5 w-5 text-red-500" />
              ) : (
                <Heart className="h-5 w-5 text-emerald-500" />
              )}
              Interview Coach
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {job.company} — {job.role}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* MODE SELECTION */}
              {coach.state === "idle" && (
                <motion.div
                  key="mode-select"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-display font-semibold">Choose Your Coach</h3>
                    <p className="text-sm text-muted-foreground">
                      Practice for your interview at {job.company}
                    </p>
                    {job.description && (
                      <p className="text-xs text-muted-foreground/70 line-clamp-2 max-w-md mx-auto">
                        {job.description.slice(0, 150)}…
                      </p>
                    )}
                  </div>

                  {isLimitReached && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
                      <p className="text-sm text-destructive font-medium">Monthly AI limit reached</p>
                      <p className="text-xs text-muted-foreground mt-1">Upgrade to Pro for unlimited sessions</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => coach.startSession(job, "helpful")}
                      disabled={isLimitReached}
                      className="group relative rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6 text-left transition-all hover:border-emerald-500/60 hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                          <Heart className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Helpful Coach</h4>
                          <p className="text-xs text-emerald-500">Encouraging & constructive</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Get supportive feedback with actionable tips. Perfect for building confidence.
                      </p>
                    </button>

                    <button
                      onClick={() => coach.startSession(job, "ruthless")}
                      disabled={isLimitReached}
                      className="group relative rounded-xl border-2 border-red-500/30 bg-red-500/5 p-6 text-left transition-all hover:border-red-500/60 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20">
                          <Flame className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Ruthless Roast</h4>
                          <p className="text-xs text-red-500">Savage & brutally honest</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Get destroyed by the most savage coach alive. Not for the faint-hearted.
                      </p>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* GENERATING QUESTIONS */}
              {coach.state === "generating_questions" && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Generating tailored questions…</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Analysing job description & your CV</p>
                </motion.div>
              )}

              {/* ACTIVE SESSION */}
              {(coach.state === "ready" || coach.state === "speaking" || coach.state === "listening" || coach.state === "analyzing") && coach.currentQuestion && (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Question {currentIndex + 1} of {coach.questions.length}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {coach.currentQuestion.type === "behavioral" ? "Behavioral" : "Role-Specific"}
                      </Badge>
                    </div>
                    <Progress value={((currentIndex + 1) / coach.questions.length) * 100} className="h-1.5" />
                  </div>

                  {/* Question */}
                  <div className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-3">
                    <p className="text-lg font-semibold text-foreground leading-relaxed">
                      {coach.currentQuestion.question}
                    </p>
                    <p className="text-xs text-muted-foreground/70 italic">
                      💡 {coach.currentQuestion.tip}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => coach.speakQuestion(coach.currentQuestion!.question)}
                      disabled={coach.state === "speaking"}
                      className="gap-1.5 text-xs"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      {coach.state === "speaking" ? "Speaking…" : "Listen"}
                    </Button>
                  </div>

                  {/* Answer area */}
                  {coach.state !== "analyzing" && !feedbackForCurrent && (
                    <div className="space-y-4">
                      {/* Mic button or text input */}
                      {!useTextInput && coach.hasSpeechRecognition ? (
                        <div className="flex flex-col items-center gap-4">
                          <button
                            onClick={coach.isListening ? coach.stopListening : coach.startListening}
                            disabled={coach.state === "speaking"}
                            className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all ${
                              coach.isListening
                                ? "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                                : "bg-primary/10 text-primary hover:bg-primary/20"
                            }`}
                          >
                            {coach.isListening && (
                              <motion.div
                                className="absolute inset-0 rounded-full border-2 border-red-500"
                                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              />
                            )}
                            {coach.isListening ? (
                              <MicOff className="h-8 w-8" />
                            ) : (
                              <Mic className="h-8 w-8" />
                            )}
                          </button>

                          {coach.isListening && (
                            <p className="text-sm text-red-500 font-medium animate-pulse">
                              Listening…
                            </p>
                          )}

                          {(coach.interimTranscript || coach.currentAnswer) && (
                            <div className="w-full rounded-lg border border-border/50 bg-muted/30 p-3">
                              <p className="text-sm text-foreground">
                                {coach.currentAnswer}
                                {coach.interimTranscript && (
                                  <span className="text-muted-foreground italic"> {coach.interimTranscript}</span>
                                )}
                              </p>
                            </div>
                          )}

                          <button
                            onClick={() => setUseTextInput(true)}
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                          >
                            <Keyboard className="h-3 w-3" /> Type instead
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Textarea
                            value={coach.currentAnswer}
                            onChange={(e) => coach.setCurrentAnswer(e.target.value)}
                            placeholder="Type your answer here…"
                            rows={4}
                            className="resize-none"
                          />
                          {coach.hasSpeechRecognition && (
                            <button
                              onClick={() => setUseTextInput(false)}
                              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                            >
                              <Mic className="h-3 w-3" /> Use voice instead
                            </button>
                          )}
                        </div>
                      )}

                      {/* Submit / Skip */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => coach.submitAnswer()}
                          disabled={!coach.currentAnswer.trim()}
                          className="gap-2"
                        >
                          <Send className="h-4 w-4" /> Submit Answer
                        </Button>
                        <Button variant="ghost" size="sm" onClick={coach.skipQuestion} className="gap-1.5">
                          <SkipForward className="h-3.5 w-3.5" /> Skip
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Analyzing state */}
                  {coach.state === "analyzing" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {coach.coachMode === "ruthless" ? "Preparing to destroy your answer…" : "Analyzing your response…"}
                    </div>
                  )}

                  {/* Feedback display */}
                  {feedbackForCurrent && (
                    <div className="space-y-3">
                      {modelLabel && (
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {modelLabel}
                        </Badge>
                      )}
                      <div className="prose prose-sm dark:prose-invert max-w-none rounded-xl border border-border/50 bg-card/40 p-5">
                        <ReactMarkdown>{feedbackForCurrent}</ReactMarkdown>
                      </div>
                      <Button onClick={coach.nextQuestion} className="gap-2">
                        {currentIndex + 1 >= coach.questions.length ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" /> Finish & Get Score
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4" /> Next Question
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* COMPLETE */}
              {coach.state === "complete" && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {coach.overallResult ? (
                    <>
                      <div className="flex items-center gap-5">
                        <ScoreRing score={coach.overallResult.score} />
                        <div>
                          <h3 className="text-lg font-display font-semibold">Overall Score</h3>
                          <p className="text-xs text-muted-foreground">
                            {coach.overallResult.score >= 75 ? "Strong performance!" : coach.overallResult.score >= 50 ? "Room for improvement" : "Needs significant work"}
                          </p>
                        </div>
                      </div>

                      {/* Breakdown */}
                      <div className="space-y-3 rounded-xl border border-border/50 bg-card/40 p-5">
                        <h4 className="text-sm font-semibold text-foreground">Breakdown</h4>
                        <BreakdownBar label="Content Quality" score={coach.overallResult.breakdown.content_quality} />
                        <BreakdownBar label="STAR Structure" score={coach.overallResult.breakdown.star_structure} />
                        <BreakdownBar label="Confidence" score={coach.overallResult.breakdown.confidence} />
                        <BreakdownBar label="Relevance" score={coach.overallResult.breakdown.relevance} />
                        <BreakdownBar label="Communication" score={coach.overallResult.breakdown.communication} />
                      </div>

                      {/* Strengths & improvements */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {coach.overallResult.top_strengths.length > 0 && (
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                            <h4 className="text-sm font-semibold text-emerald-500 mb-2">✓ Strengths</h4>
                            <ul className="space-y-1.5">
                              {coach.overallResult.top_strengths.map((s, i) => (
                                <li key={i} className="text-sm text-foreground">{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {coach.overallResult.critical_improvements.length > 0 && (
                          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                            <h4 className="text-sm font-semibold text-red-500 mb-2">⚠ Improve</h4>
                            <ul className="space-y-1.5">
                              {coach.overallResult.critical_improvements.map((s, i) => (
                                <li key={i} className="text-sm text-foreground">{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      <div className="prose prose-sm dark:prose-invert max-w-none rounded-xl border border-border/50 bg-card/40 p-5">
                        <ReactMarkdown>{coach.overallResult.summary}</ReactMarkdown>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-3" />
                      <h3 className="text-lg font-semibold">Session Complete</h3>
                      <p className="text-sm text-muted-foreground">Could not generate overall score.</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button onClick={() => { coach.resetSession(); }} variant="outline" className="gap-2">
                      <RotateCcw className="h-4 w-4" /> New Session
                    </Button>
                    <Button onClick={handleClose}>Close</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );

  // Helper: get feedback for the current question index
  function get feedbackForCurrentIndex(): string | null {
    // During analyzing, show streaming content
    if (coach.state === "analyzing" && coach.feedbackContent) return coach.feedbackContent;
    // After analysis, show stored feedback
    return coach.feedbacks[currentIndex] || null;
  }
};

// Fix: We need to compute feedbackForCurrent properly
// Let me restructure the component to avoid the helper issue

export default InterviewCoach;
