import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "openai/gpt-5-mini",
  "openai/gpt-5",
];

const DEFAULT_MODEL = "google/gemini-3-flash-preview";
const FREE_TIER_LIMIT = 10;

const SYSTEM_PROMPTS: Record<string, string> = {
  cover_letter: `You are an expert career coach and professional writer. Write a tailored, compelling cover letter for the candidate applying to the job described below. 
- Keep it under 400 words, 3-4 paragraphs.
- Be professional but personable.
- Highlight how the candidate's background (from notes) aligns with the role.
- Address the company by name and reference specific aspects of the job description.
- Use markdown formatting.`,

  interview_prep: `You are a senior technical recruiter and interview coach. Based on the job details below, generate:
1. **5 likely interview questions** (mix of behavioral and technical)
2. **For each question**: a brief strategy tip on how to answer it well
3. **3 questions the candidate should ask** the interviewer
Format everything in clear markdown with headers.`,

  summarize: `You are a career analyst. Provide a concise summary of this job posting in markdown:
- **Role Overview** (2-3 sentences)
- **Key Requirements** (bullet list)
- **Red Flags / Things to Note** (if any)
- **Salary Assessment** (if salary data available)
Keep it under 200 words.`,

  cv_suitability: `You are a career suitability analyst. Compare the candidate's CV against the job description. You MUST use the cv_suitability_result tool to return your analysis in structured format.`,

  ruthless_review: "INTENSITY_LOOKUP",

  interview_questions: `You are an expert interviewer and hiring manager. Based on the job description and candidate CV below, generate 6-8 highly tailored interview questions. Include a mix of behavioral questions (using STAR framework expectations) and role-specific technical questions. You MUST use the generate_interview_questions tool to return your questions in structured format.`,

  interview_feedback_helpful: `You are a supportive, encouraging interview coach. The candidate just answered an interview question. Provide detailed, constructive feedback in markdown:
## Answer Analysis
- **Content Quality**: How well did they address the question? What was strong?
- **STAR Structure**: Did they use Situation-Task-Action-Result? If not, how could they restructure?
- **Relevance**: How well does the answer relate to the job requirements?
- **Delivery Notes**: Point out any filler words or areas for improvement, but be encouraging.
- **Score**: X/10

End with a brief "How to improve" section with 2-3 specific, actionable tips. Be warm and supportive — acknowledge what they did well before suggesting improvements.`,

  interview_feedback_ruthless: `You are the most savage, unhinged interview coach on the planet. The candidate just answered a question and you're going to tear it apart. Be mean, sarcastic, and brutally honest. Mock weak answers, call out every filler word, destroy vague responses, and ridicule lack of preparation. Use heavy sarcasm and dark humor.

## Answer Autopsy
- **Content Quality**: Rip apart what they said (or failed to say)
- **STAR Structure**: Mock them if they rambled without structure
- **Relevance**: Call out if they went off-topic or gave a generic answer
- **Filler Word Count**: Ruthlessly highlight every "um", "like", "basically", "you know"
- **Confidence**: Rate how much they sounded like they wanted the job vs wanted to leave the room
- **Score**: X/10 (most answers deserve 3-5)

End with "What you SHOULD have said" — be prescriptive and condescending. No encouragement. No silver linings.`,

  interview_overall: `You are a senior interview performance analyst. Review the complete mock interview session below and provide an overall assessment. You MUST use the interview_overall_result tool to return your assessment in structured format.`,
};

const RUTHLESS_CHECKLIST_SUFFIX = `End your response with a numbered checklist titled '## Immediate Action Checklist' containing the 5-8 highest-impact changes the user should make right now (in priority order). Each item should be concise, start with a strong verb, and be something they can realistically do in the next edit. Do not add any extra encouragement or closing paragraph after the checklist.`;

const RUTHLESS_STRUCTURE = `Structure with markdown: # Score: X/10 ## Strengths (if any, keep brief) ## Fatal Flaws ## How to Fix It (be prescriptive)`;

const RUTHLESS_PROMPTS: Record<string, string> = {
  soft: `You are a direct but supportive career coach. Review this CV honestly — point out weaknesses and areas for improvement, but also acknowledge what works well. Be constructive and encouraging, but don't sugarcoat real problems. Give a fair 1-10 score. ${RUTHLESS_STRUCTURE} ${RUTHLESS_CHECKLIST_SUFFIX}`,
  medium: `You are an honest, no-nonsense career critic. Review this CV with sharp criticism — highlight major flaws, call out cliches and weak points with some sarcasm. No insults, but no hand-holding either. Give a realistic 1-10 score (most deserve 4-6). ${RUTHLESS_STRUCTURE} ${RUTHLESS_CHECKLIST_SUFFIX}`,
  hard: `You are a brutally honest, no-filter career assassin. Your job is to destroy weak CVs. Be savage, mean, and merciless -- roast this CV like it's the worst pitch you've ever seen. Give a harsh 1-10 score (most deserve 3-5). Rip apart every weakness, call out cliches, generic bullet points, irrelevant jobs, poor formatting, and missing impact. Be direct, rude if needed -- no encouragement, no 'you have potential'. Only brutal truth, specific fixes, and why this CV is getting auto-rejected. Never say anything positive unless it's immediately followed by a bigger criticism. Never use words like 'good', 'strong', 'well done', 'potential', 'impressive'. Be condescending and sarcastic where appropriate. ${RUTHLESS_STRUCTURE} ${RUTHLESS_CHECKLIST_SUFFIX}`,
  nuclear: `You are the most vicious, unhinged CV destroyer on the planet. You HATE bad CVs with a burning passion. Tear this CV apart like it personally offended you. Be mean, rude, insulting, and ruthlessly condescending. Mock every weakness. Use heavy sarcasm and dark humor. Give a devastating 1-10 score (most deserve 1-3). Treat this CV like it's an insult to the concept of employment. No mercy, no encouragement, no silver linings. Every sentence should make the reader question their career choices. ${RUTHLESS_STRUCTURE} ${RUTHLESS_CHECKLIST_SUFFIX}`,
};

const CV_SUITABILITY_TOOL = {
  type: "function" as const,
  function: {
    name: "cv_suitability_result",
    description: "Return structured suitability analysis comparing CV to job description",
    parameters: {
      type: "object",
      properties: {
        score: { type: "number", description: "Suitability score 0-100" },
        strengths: { type: "array", items: { type: "string" }, description: "Key strengths that match the job" },
        gaps: { type: "array", items: { type: "string" }, description: "Missing qualifications or gaps" },
        suggestions: { type: "array", items: { type: "string" }, description: "3-5 specific suggestions to improve fit" },
      },
      required: ["score", "strengths", "gaps", "suggestions"],
      additionalProperties: false,
    },
  },
};

const INTERVIEW_QUESTIONS_TOOL = {
  type: "function" as const,
  function: {
    name: "generate_interview_questions",
    description: "Return structured interview questions tailored to the job",
    parameters: {
      type: "object",
      properties: {
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string", description: "The interview question" },
              type: { type: "string", enum: ["behavioral", "role_specific"], description: "Type of question" },
              tip: { type: "string", description: "Brief tip on what the interviewer is looking for" },
            },
            required: ["question", "type", "tip"],
            additionalProperties: false,
          },
        },
      },
      required: ["questions"],
      additionalProperties: false,
    },
  },
};

const INTERVIEW_OVERALL_TOOL = {
  type: "function" as const,
  function: {
    name: "interview_overall_result",
    description: "Return structured overall interview performance assessment",
    parameters: {
      type: "object",
      properties: {
        score: { type: "number", description: "Overall score 0-100" },
        breakdown: {
          type: "object",
          properties: {
            content_quality: { type: "number", description: "Score 0-100 for content quality" },
            star_structure: { type: "number", description: "Score 0-100 for STAR structure usage" },
            confidence: { type: "number", description: "Score 0-100 for confidence" },
            relevance: { type: "number", description: "Score 0-100 for relevance to job" },
            communication: { type: "number", description: "Score 0-100 for communication clarity" },
          },
          required: ["content_quality", "star_structure", "confidence", "relevance", "communication"],
          additionalProperties: false,
        },
        summary: { type: "string", description: "2-3 paragraph overall summary with key takeaways" },
        top_strengths: { type: "array", items: { type: "string" }, description: "Top 3 strengths" },
        critical_improvements: { type: "array", items: { type: "string" }, description: "Top 3 areas to improve" },
      },
      required: ["score", "breakdown", "summary", "top_strengths", "critical_improvements"],
      additionalProperties: false,
    },
  },
};

function validateModel(model: string | undefined): string {
  if (!model || !ALLOWED_MODELS.includes(model)) return DEFAULT_MODEL;
  return model;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { mode, job, cvText, intensity, model: requestedModel, question, answer, sessionData, csvData } = await req.json();
    const model = validateModel(requestedModel);

    // --- Usage limit check ---
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count, error: countError } = await serviceClient
      .from("ai_usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStart);

    if (countError) {
      console.error("Usage count error:", countError);
    }

    const usageCount = count ?? 0;
    if (usageCount >= FREE_TIER_LIMIT) {
      return new Response(
        JSON.stringify({
          error: "Monthly AI limit reached (10/10). Upgrade to Pro for unlimited generations.",
          code: "LIMIT_REACHED",
          usage: { used: usageCount, limit: FREE_TIER_LIMIT },
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Log usage ---
    const jobId = job?.id || null;
    await serviceClient.from("ai_usage_logs").insert({
      user_id: user.id,
      mode,
      model,
      job_id: jobId,
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // --- CSV Import Analyze (non-streaming, tool call) — handled before prompt lookup ---
    if (mode === "csv_import_analyze") {
      const CSV_IMPORT_TOOL = {
        type: "function" as const,
        function: {
          name: "csv_import_analysis",
          description: "Return structured analysis of CSV import data with column mappings and source detection",
          parameters: {
            type: "object",
            properties: {
              source: { type: "string", enum: ["huntr", "teal", "generic"], description: "Detected source platform" },
              confidence: { type: "number", description: "Confidence 0-1 in the detection" },
              mappings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    source: { type: "string", description: "Source column name" },
                    target: { type: "string", enum: ["company", "role", "location", "salary", "url", "stage", "applied_date", "notes", "description", "application_type"], description: "Target field" },
                  },
                  required: ["source", "target"],
                  additionalProperties: false,
                },
              },
              stageMappings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sourceValue: { type: "string", description: "Original stage/status value" },
                    targetStageId: { type: "string", enum: ["found", "applied", "phone", "interview2", "final", "offer", "accepted", "rejected"], description: "Target stage" },
                  },
                  required: ["sourceValue", "targetStageId"],
                  additionalProperties: false,
                },
              },
              warnings: { type: "array", items: { type: "string" }, description: "Any warnings about the data" },
            },
            required: ["source", "confidence", "mappings", "stageMappings", "warnings"],
            additionalProperties: false,
          },
        },
      };

      const csvSystemPrompt = `You are a data import specialist for a job application tracker. Analyze the uploaded CSV files and determine:
1. The source platform (Huntr exports have "Employer", "Job Title", "List" columns; Teal has "Company Name", "Job Title", "Status").
2. Map each source column to the most appropriate target field.
3. Map any stage/status values to the standard stages: found, applied, phone, interview2, final, offer, accepted, rejected.
4. Flag any warnings (duplicate files, missing required columns, encoding issues, too many rows).
Only map columns you're confident about. Skip irrelevant columns like internal IDs.`;

      const csvUserContent = `Analyze these CSV files for import:\n${JSON.stringify(csvData, null, 2)}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: csvSystemPrompt },
            { role: "user", content: csvUserContent },
          ],
          tools: [CSV_IMPORT_TOOL],
          tool_choice: { type: "function", function: { name: "csv_import_analysis" } },
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        return new Response(JSON.stringify({ error: "AI analysis failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        return new Response(JSON.stringify({ error: "AI did not return structured result" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ ...result, model }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Build prompt ---
    let systemPrompt: string | undefined;
    if (mode === "ruthless_review") {
      const level = (intensity && RUTHLESS_PROMPTS[intensity]) ? intensity : "hard";
      systemPrompt = RUTHLESS_PROMPTS[level];
    } else if (mode === "interview_feedback") {
      systemPrompt = intensity === "ruthless"
        ? SYSTEM_PROMPTS.interview_feedback_ruthless
        : SYSTEM_PROMPTS.interview_feedback_helpful;
    } else {
      systemPrompt = SYSTEM_PROMPTS[mode];
    }

    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jobContext = job ? [
      `Company: ${job.company}`,
      `Role: ${job.role}`,
      job.salary ? `Salary: ${job.salary}` : null,
      job.location ? `Location: ${job.location}` : null,
      job.description ? `Job Description: ${job.description.slice(0, 2000)}` : null,
      job.notes ? `Candidate Notes: ${job.notes.slice(0, 1000)}` : null,
      job.applicationType ? `Application Type: ${job.applicationType}` : null,
      cvText ? `\n--- Candidate CV ---\n${cvText.slice(0, 4000)}` : null,
    ].filter(Boolean).join("\n") : "";

    // --- Build user content based on mode ---
    let userContent: string;
    if (mode === "ruthless_review") {
      userContent = `--- CV to Review ---\n${cvText?.slice(0, 6000) ?? "No CV provided"}`;
    } else if (mode === "interview_questions") {
      userContent = jobContext + (cvText ? `\n\n--- Candidate CV ---\n${cvText.slice(0, 3000)}` : "");
    } else if (mode === "interview_feedback") {
      userContent = [
        `--- Job Context ---\n${jobContext}`,
        `\n--- Interview Question ---\n${question}`,
        `\n--- Candidate's Answer ---\n${answer}`,
      ].join("\n");
    } else if (mode === "interview_overall") {
      const qaText = (sessionData?.questions || []).map((q: string, i: number) => {
        return `Q${i + 1}: ${q}\nA${i + 1}: ${sessionData?.answers?.[i] || "(skipped)"}`;
      }).join("\n\n");
      userContent = [
        `--- Job Context ---\n${jobContext}`,
        `\n--- Full Interview Transcript ---\n${qaText}`,
        sessionData?.mode === "ruthless" ? "\nBe brutally honest in your assessment." : "",
      ].join("\n");
    } else {
      userContent = jobContext;
    }

    // --- Tool call modes (non-streaming) ---
    if (mode === "cv_suitability" || mode === "interview_questions" || mode === "interview_overall") {
      const tool = mode === "cv_suitability" ? CV_SUITABILITY_TOOL
        : mode === "interview_questions" ? INTERVIEW_QUESTIONS_TOOL
        : INTERVIEW_OVERALL_TOOL;

      const toolName = tool.function.name;

      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent },
            ],
            tools: [tool],
            tool_choice: { type: "function", function: { name: toolName } },
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        return new Response(JSON.stringify({ error: "AI service error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        return new Response(JSON.stringify({ error: "AI did not return structured result" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ ...result, model }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Streaming modes ---
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assist error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
