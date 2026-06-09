import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  Deno.env.get("APP_URL") || "https://brs39.lovable.app",
  "https://brs39.lovable.app",
  "https://id-preview--03b5424d-9b42-4895-9126-0bbdd9be20a7.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const PER_IP_DAILY_LIMIT = 2;
const GLOBAL_DAILY_CAP = parseInt(Deno.env.get("PUBLIC_ROAST_DAILY_CAP") || "200", 10);
const MAX_CV_CHARS = 15000;

async function hashIp(ip: string): Promise<string> {
  const salt = Deno.env.get("PUBLIC_ROAST_IP_SALT") || "cornerman-roast-salt-v1";
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const ROAST_PROMPT = `You are a brutally honest, no-filter career assassin. Your job is to destroy weak CVs. Be savage, mean, and merciless — roast this CV like it's the worst pitch you've ever seen. Give a harsh 0-100 score (most deserve 30-50). Rip apart every weakness, call out cliches, generic bullet points, irrelevant jobs, poor formatting, and missing impact. Be direct, rude if needed — no encouragement, no 'you have potential'. Only brutal truth, specific fixes, and why this CV is getting auto-rejected.

You MUST use the cv_assessment_result tool. The 'feedback_md' field MUST contain a full markdown critique with this structure:
# Score: X/100
## Opening Verdict
(one sharp paragraph — this is the public roast line)
## Strengths
## Fatal Flaws
## How to Fix It
## Immediate Action Checklist
(3-6 verb-led fixes)

The 'score' field is a 0-100 integer.`;

const CV_ASSESSMENT_TOOL = {
  type: "function" as const,
  function: {
    name: "cv_assessment_result",
    description: "Return structured ruthless CV assessment",
    parameters: {
      type: "object",
      properties: {
        score: { type: "number" },
        feedback_md: { type: "string" },
        strengths: { type: "array", items: { type: "string" } },
        gaps: { type: "array", items: { type: "string" } },
        quick_wins: { type: "array", items: { type: "string" } },
        roast_line: { type: "string", description: "One short punchy roast sentence (max 120 chars) suitable for a shareable card." },
      },
      required: ["score", "feedback_md", "strengths", "gaps", "quick_wins", "roast_line"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const cvText = typeof body.cvText === "string" ? body.cvText : "";
    if (cvText.trim().length < 100) {
      return new Response(JSON.stringify({ error: "CV is too short. Paste or upload at least a paragraph." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const truncated = cvText.slice(0, MAX_CV_CHARS);

    const xff = req.headers.get("x-forwarded-for") || "";
    const xffLast = xff ? xff.split(",").map((s) => s.trim()).filter(Boolean).pop() : "";
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      xffLast ||
      "unknown";
    const ipHash = await hashIp(ip);
    const today = new Date().toISOString().slice(0, 10);

    const service = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Reserve a slot first to avoid race conditions on concurrent requests.
    const { data: reserved, error: reserveErr } = await service
      .from("public_roast_log")
      .insert({ ip_hash: ipHash, roast_date: today, score: null })
      .select("id")
      .single();
    if (reserveErr || !reserved) {
      console.error("reserve insert failed", reserveErr);
      return new Response(JSON.stringify({ error: "Unexpected error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const reservedId = reserved.id;
    const releaseSlot = async () => {
      await service.from("public_roast_log").delete().eq("id", reservedId);
    };

    // Per-IP limit (count now includes the just-inserted row)
    const { count: ipCount } = await service
      .from("public_roast_log")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .eq("roast_date", today);
    if ((ipCount ?? 0) > PER_IP_DAILY_LIMIT) {
      await releaseSlot();
      return new Response(JSON.stringify({ error: "Daily limit reached. Sign up for unlimited roasts." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Global cap
    const { count: globalCount } = await service
      .from("public_roast_log")
      .select("*", { count: "exact", head: true })
      .eq("roast_date", today);
    if ((globalCount ?? 0) > GLOBAL_DAILY_CAP) {
      await releaseSlot();
      return new Response(JSON.stringify({ error: "Free roasts are maxed out for today. Sign up to roast anytime." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      await releaseSlot();
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: ROAST_PROMPT },
          { role: "user", content: `--- CV to Roast ---\n${truncated}` },
        ],
        tools: [CV_ASSESSMENT_TOOL],
        tool_choice: { type: "function", function: { name: "cv_assessment_result" } },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      await releaseSlot();
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "AI rate-limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Roast failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiRes.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      await releaseSlot();
      return new Response(JSON.stringify({ error: "AI did not return structured roast" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const result = JSON.parse(toolCall.function.arguments);

    await service
      .from("public_roast_log")
      .update({ score: typeof result.score === "number" ? Math.round(result.score) : null })
      .eq("id", reservedId);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("public-roast error", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});