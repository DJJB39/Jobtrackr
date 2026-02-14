import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function hmacToken(userId: string, type: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(userId + type));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");
    const type = url.searchParams.get("type");
    const token = url.searchParams.get("token");

    if (!userId || !type || !token) {
      return htmlResponse("Invalid unsubscribe link. Missing parameters.", false);
    }

    if (!["reminders", "digest"].includes(type)) {
      return htmlResponse("Invalid notification type.", false);
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const expected = await hmacToken(userId, type, serviceKey);

    if (token !== expected) {
      return htmlResponse("Invalid or expired unsubscribe link.", false);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceKey
    );

    const field = type === "reminders" ? "email_reminders" : "weekly_digest";
    const { error } = await supabaseAdmin
      .from("user_preferences")
      .update({ [field]: false })
      .eq("user_id", userId);

    if (error) {
      console.error("Unsubscribe error:", error);
      return htmlResponse("Something went wrong. Please try again.", false);
    }

    const label = type === "reminders" ? "event reminders" : "weekly digest";
    return htmlResponse(
      `You've been unsubscribed from <strong>${label}</strong>. You can re-enable this anytime in your JobTrackr settings.`,
      true
    );
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return htmlResponse("An unexpected error occurred.", false);
  }
});

function htmlResponse(message: string, success: boolean): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>JobTrackr — Unsubscribe</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f0f14;
      color: #e4e4e7;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      max-width: 420px;
      width: 100%;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 40px 32px;
      text-align: center;
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #fafafa; }
    p { font-size: 14px; color: #a1a1aa; line-height: 1.6; }
    p strong { color: #e4e4e7; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? "✅" : "⚠️"}</div>
    <h1>${success ? "Unsubscribed" : "Error"}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
}
