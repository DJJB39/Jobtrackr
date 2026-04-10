import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useSSEStream } from "./useSSEStream";
import { useToast } from "./use-toast";
import type { JobApplication } from "@/types/job";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;

export type CoachMode = "helpful" | "ruthless";

export type SessionState =
  | "idle"
  | "generating_questions"
  | "ready"
  | "speaking"
  | "listening"
  | "analyzing"
  | "complete";

export interface InterviewQuestion {
  question: string;
  type: "behavioral" | "role_specific";
  tip: string;
}

export interface OverallResult {
  score: number;
  breakdown: {
    content_quality: number;
    star_structure: number;
    confidence: number;
    relevance: number;
    communication: number;
  };
  summary: string;
  top_strengths: string[];
  critical_improvements: string[];
}

const hasSpeechRecognition =
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

export const useInterviewCoach = (
  preferredModel?: string,
  onUsageIncrement?: () => void
) => {
  const { session, user } = useAuth();
  const { toast } = useToast();
  const { content: feedbackContent, loading: feedbackLoading, stream, reset: resetStream } = useSSEStream();

  const [state, setState] = useState<SessionState>("idle");
  const [coachMode, setCoachMode] = useState<CoachMode>("helpful");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<string[]>([]);
  const [overallResult, setOverallResult] = useState<OverallResult | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastModel, setLastModel] = useState<string | null>(null);
  const [job, setJob] = useState<JobApplication | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, []);

  const getToken = useCallback(async () => {
    if (session?.access_token) return session.access_token;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, [session]);

  const startSession = useCallback(
    async (selectedJob: JobApplication, mode: CoachMode) => {
      const token = await getToken();
      if (!token) {
        toast({ title: "Please log in", variant: "destructive" });
        return;
      }

      setJob(selectedJob);
      setCoachMode(mode);
      setState("generating_questions");
      setQuestions([]);
      setAnswers([]);
      setFeedbacks([]);
      setCurrentIndex(0);
      setOverallResult(null);
      setCurrentAnswer("");
      setInterimTranscript("");

      const model = preferredModel || "google/gemini-3-flash-preview";
      setLastModel(model);

      try {
        const resp = await fetch(AI_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mode: "interview_questions",
            model,
            job: {
              id: selectedJob.id,
              company: selectedJob.company,
              role: selectedJob.role,
              salary: selectedJob.salary,
              location: selectedJob.location,
              description: selectedJob.description,
              notes: selectedJob.notes,
            },
            cvText: user ? localStorage.getItem(`cv-text-${user.id}`) : null,
          }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Failed" }));
          toast({
            title: err.code === "LIMIT_REACHED" ? "Monthly AI limit reached" : "Failed to generate questions",
            description: err.error,
            variant: "destructive",
          });
          setState("idle");
          return;
        }

        const data = await resp.json();
        if (!data.questions?.length) {
          toast({ title: "No questions generated", variant: "destructive" });
          setState("idle");
          return;
        }

        setQuestions(data.questions);
        onUsageIncrement?.();

        // Create session in DB
        if (user) {
          const insertPayload = {
            user_id: user.id,
            job_id: selectedJob.id,
            mode,
            model,
            questions: JSON.stringify(data.questions.map((q: InterviewQuestion) => q.question)),
            status: "in_progress",
          };
          const { data: sess } = await supabase
            .from("interview_sessions")
            .insert(insertPayload as never)
            .select("id")
            .single();
          if (sess) setSessionId(sess.id);
        }

        setState("ready");
      } catch {
        toast({ title: "Error starting session", variant: "destructive" });
        setState("idle");
      }
    },
    [getToken, preferredModel, user, toast, onUsageIncrement]
  );

  const speakQuestion = useCallback((text: string) => {
    if (!synthRef.current) {
      setState("ready");
      return;
    }
    setState("speaking");
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    // Pick a natural voice if available
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("natural")
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => setState("ready");
    utterance.onerror = () => setState("ready");
    synthRef.current.speak(utterance);
  }, []);

  const startListening = useCallback(() => {
    if (!hasSpeechRecognition) return;

    setCurrentAnswer("");
    setInterimTranscript("");
    setIsListening(true);
    setState("listening");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      setCurrentAnswer(finalTranscript.trim());
      setInterimTranscript(interim);
    };

    recognition.onerror = () => {
      setIsListening(false);
      if (!finalTranscript.trim()) setState("ready");
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        setCurrentAnswer(finalTranscript.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const submitAnswer = useCallback(
    async (answerText?: string) => {
      const answer = answerText || currentAnswer;
      if (!answer.trim()) {
        toast({ title: "No answer recorded", variant: "destructive" });
        return;
      }

      stopListening();
      setState("analyzing");
      resetStream();

      const token = await getToken();
      if (!token) return;

      const model = preferredModel || "google/gemini-3-flash-preview";
      const q = questions[currentIndex];

      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);

      const feedbackText = await stream(
        AI_URL,
        {
          mode: "interview_feedback",
          model,
          intensity: coachMode,
          question: q.question,
          answer,
          job: job ? {
            id: job.id,
            company: job.company,
            role: job.role,
            description: job.description,
          } : undefined,
        },
        token,
        (msg) => toast({ title: "Feedback error", description: msg, variant: "destructive" }),
        () => onUsageIncrement?.()
      );

      const newFeedbacks = [...feedbacks, feedbackText];
      setFeedbacks(newFeedbacks);

      // Update session in DB
      if (sessionId && user) {
        const updatePayload = {
          answers: JSON.stringify(newAnswers),
          feedback: JSON.stringify(newFeedbacks.map((f, i) => ({ questionIndex: i, text: f }))),
        };
        await supabase
          .from("interview_sessions")
          .update(updatePayload as never)
          .eq("id", sessionId);
      }

      setState("ready");
    },
    [currentAnswer, questions, currentIndex, answers, feedbacks, coachMode, job, stream, resetStream, getToken, preferredModel, stopListening, toast, onUsageIncrement, sessionId, user]
  );

  const nextQuestion = useCallback(() => {
    const next = currentIndex + 1;
    if (next >= questions.length) {
      // Trigger overall scoring
      completeSession();
      return;
    }
    setCurrentIndex(next);
    setCurrentAnswer("");
    setInterimTranscript("");
    resetStream();
    setState("ready");
  }, [currentIndex, questions.length, resetStream]); // eslint-disable-line react-hooks/exhaustive-deps

  const skipQuestion = useCallback(() => {
    const newAnswers = [...answers, "(skipped)"];
    const newFeedbacks = [...feedbacks, ""];
    setAnswers(newAnswers);
    setFeedbacks(newFeedbacks);
    setCurrentAnswer("");
    setInterimTranscript("");
    resetStream();

    const next = currentIndex + 1;
    if (next >= questions.length) {
      setCurrentIndex(next);
      completeSession();
      return;
    }
    setCurrentIndex(next);
    setState("ready");
  }, [currentIndex, questions.length, answers, feedbacks, resetStream]); // eslint-disable-line react-hooks/exhaustive-deps

  const completeSession = useCallback(async () => {
    setState("analyzing");
    resetStream();

    const token = await getToken();
    if (!token) { setState("complete"); return; }

    const model = preferredModel || "google/gemini-3-flash-preview";

    try {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: "interview_overall",
          model,
          job: job ? {
            id: job.id,
            company: job.company,
            role: job.role,
            description: job.description,
          } : undefined,
          sessionData: {
            questions: questions.map((q) => q.question),
            answers,
            mode: coachMode,
          },
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        setOverallResult(data);
        onUsageIncrement?.();

        // Update session in DB
        if (sessionId && user) {
          const updatePayload = {
            overall_score: data.score,
            overall_feedback: data.summary,
            status: "completed",
            completed_at: new Date().toISOString(),
          };
          await supabase
            .from("interview_sessions")
            .update(updatePayload as never)
            .eq("id", sessionId);
        }
      }
    } catch {
      toast({ title: "Error getting overall score", variant: "destructive" });
    }

    setState("complete");
  }, [getToken, preferredModel, job, questions, answers, coachMode, sessionId, user, resetStream, toast, onUsageIncrement]);

  const resetSession = useCallback(() => {
    recognitionRef.current?.abort();
    synthRef.current?.cancel();
    setState("idle");
    setQuestions([]);
    setAnswers([]);
    setFeedbacks([]);
    setCurrentIndex(0);
    setOverallResult(null);
    setCurrentAnswer("");
    setInterimTranscript("");
    setSessionId(null);
    setJob(null);
    resetStream();
  }, [resetStream]);

  return {
    state,
    coachMode,
    questions,
    currentIndex,
    currentQuestion: questions[currentIndex] ?? null,
    answers,
    feedbacks,
    feedbackContent,
    feedbackLoading,
    overallResult,
    isListening,
    interimTranscript,
    currentAnswer,
    setCurrentAnswer,
    lastModel,
    hasSpeechRecognition,
    startSession,
    speakQuestion,
    startListening,
    stopListening,
    submitAnswer,
    nextQuestion,
    skipQuestion,
    resetSession,
  };
};
