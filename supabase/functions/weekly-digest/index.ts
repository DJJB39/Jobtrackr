import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_URL = "https://brs39.lovable.app";

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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { data: prefs, error: prefsErr } = await supabaseAdmin
      .from("user_preferences")
      .select("user_id")
      .eq("weekly_digest", true);

    if (prefsErr || !prefs?.length) {
      return new Response(
        JSON.stringify({ message: "No users with digest enabled", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = prefs.map((p: { user_id: string }) => p.user_id);
    let totalSent = 0;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const todayStr = now.toISOString().slice(0, 10);
    const in7DaysStr = in7Days.toISOString().slice(0, 10);
    const staleThreshold = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    for (const userId of userIds) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!userData?.user?.email) continue;

      const { data: jobs } = await supabaseAdmin
        .from("job_applications")
        .select("id, company, role, column_id, events, created_at, updated_at")
        .eq("user_id", userId);

      if (!jobs?.length) continue;

      const newThisWeek = jobs.filter((j: any) => j.created_at >= weekAgoStr);

      const upcomingEvents: { company: string; title: string; date: string; jobId: string }[] = [];
      for (const job of jobs) {
        const events = (job.events as Array<{ title: string; date: string }>) ?? [];
        for (const evt of events) {
          if (evt.date >= todayStr && evt.date <= in7DaysStr) {
            upcomingEvents.push({ company: job.company, title: evt.title, date: evt.date, jobId: job.id });
          }
        }
      }

      const staleJobs = jobs.filter(
        (j: any) =>
          !["accepted", "rejected"].includes(j.column_id) && j.updated_at < staleThreshold
      );

      const unsubToken = await hmacToken(userId, "digest", serviceKey);
      const unsubUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/unsubscribe?user_id=${userId}&type=digest&token=${unsubToken}`;

      const eventsHtml = upcomingEvents.length > 0
        ? `<h3 style="color:#e4e4e7;font-size:14px;margin:16px 0 8px;">📅 Upcoming Events</h3>
           ${upcomingEvents.map(e => `
             <div style="border-left:3px solid #6366f1;padding:10px 14px;margin-bottom:6px;background:#1e1e24;border-radius:0 8px 8px 0;">
               <a href="${APP_URL}/?job=${e.jobId}" style="color:#818cf8;text-decoration:none;font-size:13px;font-weight:600;">${e.title}</a>
               <div style="color:#a1a1aa;font-size:11px;margin-top:2px;">${e.company} · ${e.date}</div>
             </div>
           `).join("")}`
        : "";

      const staleHtml = staleJobs.length > 0
        ? `<h3 style="color:#fbbf24;font-size:14px;margin:16px 0 8px;">⚠️ Stale Applications (${staleJobs.length})</h3>
           ${staleJobs.slice(0, 5).map((j: any) => `
             <div style="border-left:3px solid #fbbf24;padding:10px 14px;margin-bottom:6px;background:#1e1e24;border-radius:0 8px 8px 0;">
               <a href="${APP_URL}/?job=${j.id}" style="color:#fbbf24;text-decoration:none;font-size:13px;">${j.company} — ${j.role}</a>
               <div style="color:#71717a;font-size:11px;">No update in 14+ days</div>
             </div>
           `).join("")}`
        : "";

      const html = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="background:linear-gradient(135deg,#6366f1,#818cf8);padding:3px;border-radius:16px;margin-bottom:24px;">
      <div style="background:#18181b;border-radius:14px;padding:24px;text-align:center;">
        <h1 style="margin:0;color:#fafafa;font-size:22px;">📊 Weekly Pipeline Digest</h1>
      </div>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:20px;">
      <div style="flex:1;background:#1e1e24;border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:700;color:#fafafa;">${newThisWeek.length}</div>
        <div style="font-size:11px;color:#71717a;margin-top:4px;">New this week</div>
      </div>
      <div style="flex:1;background:#1e1e24;border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:700;color:#fafafa;">${jobs.length}</div>
        <div style="font-size:11px;color:#71717a;margin-top:4px;">Total pipeline</div>
      </div>
      <div style="flex:1;background:#1e1e24;border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:700;color:${upcomingEvents.length > 0 ? "#818cf8" : "#71717a"};">${upcomingEvents.length}</div>
        <div style="font-size:11px;color:#71717a;margin-top:4px;">Events ahead</div>
      </div>
    </div>

    ${eventsHtml}
    ${staleHtml}

    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #27272a;text-align:center;">
      <a href="${APP_URL}" style="color:#818cf8;text-decoration:none;font-size:13px;">Open JobTrackr</a>
      <span style="color:#3f3f46;margin:0 8px;">·</span>
      <a href="${unsubUrl}" style="color:#52525b;text-decoration:none;font-size:12px;">Unsubscribe</a>
    </div>
  </div>
</body></html>`;

      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "JobTrackr <onboarding@resend.dev>",
          to: [userData.user.email],
          subject: `📊 Weekly Digest: ${newThisWeek.length} new, ${upcomingEvents.length} events`,
          html,
        }),
      });

      if (!emailRes.ok) {
        const errBody = await emailRes.text();
        console.error(`Resend error for ${userData.user.email}: ${errBody}`);
      } else {
        await emailRes.json();
        totalSent++;
      }
    }

    return new Response(
      JSON.stringify({ message: `Processed ${totalSent} digest(s)`, sent: totalSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in weekly-digest:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
