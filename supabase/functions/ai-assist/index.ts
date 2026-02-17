import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { mode, job, cvText, intensity } = await req.json();

    let systemPrompt: string | undefined;
    if (mode === "ruthless_review") {
      const level = (intensity && RUTHLESS_PROMPTS[intensity]) ? intensity : "hard";
      systemPrompt = RUTHLESS_PROMPTS[level];
    } else {
      systemPrompt = SYSTEM_PROMPTS[mode];
    }

    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const jobContext = [
      `Company: ${job.company}`,
      `Role: ${job.role}`,
      job.salary ? `Salary: ${job.salary}` : null,
      job.location ? `Location: ${job.location}` : null,
      job.description ? `Job Description: ${job.description.slice(0, 2000)}` : null,
      job.notes ? `Candidate Notes: ${job.notes.slice(0, 1000)}` : null,
      job.applicationType ? `Application Type: ${job.applicationType}` : null,
      cvText ? `\n--- Candidate CV ---\n${cvText.slice(0, 4000)}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const userContent = mode === "ruthless_review"
      ? `--- CV to Review ---\n${cvText?.slice(0, 6000) ?? "No CV provided"}`
      : jobContext;

    // For cv_suitability mode, use tool calling (non-streaming)
    if (mode === "cv_suitability") {
      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent },
            ],
            tools: [CV_SUITABILITY_TOOL],
            tool_choice: { type: "function", function: { name: "cv_suitability_result" } },
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
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Streaming modes (cover_letter, interview_prep, summarize)
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
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
