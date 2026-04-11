import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_URL = Deno.env.get("APP_URL") || "https://brs39.lovable.app";

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
      .select("user_id, push_notifications, push_subscription")
      .eq("email_reminders", true);

    if (prefsErr || !prefs?.length) {
      return new Response(
        JSON.stringify({ message: "No users with reminders enabled", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = prefs.map((p: any) => p.user_id);
    let totalSent = 0;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);
    const staleThreshold = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    for (const userId of userIds) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!userData?.user?.email) continue;

      const { data: jobs } = await supabaseAdmin
        .from("job_applications")
        .select("id, company, role, events, column_id, updated_at")
        .eq("user_id", userId);

      if (!jobs?.length) continue;

      const upcomingEvents: { company: string; role: string; title: string; date: string; time: string | null; jobId: string }[] = [];

      for (const job of jobs) {
        const events = (job.events as Array<{ title: string; date: string; time: string | null; type: string }>) ?? [];
        for (const evt of events) {
          if (evt.date === todayStr || evt.date === tomorrowStr) {
            upcomingEvents.push({
              company: job.company,
              role: job.role,
              title: evt.title,
              date: evt.date,
              time: evt.time,
              jobId: job.id,
            });
          }
        }
      }

      // Stale applications
      const staleJobs = jobs.filter(
        (j: any) =>
          !["accepted", "rejected"].includes(j.column_id) && j.updated_at < staleThreshold
      );

      if (upcomingEvents.length === 0 && staleJobs.length === 0) continue;

      // Build branded HTML email
      const unsubToken = await hmacToken(userId, "reminders", serviceKey);
      const unsubUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/unsubscribe?user_id=${userId}&type=reminders&token=${unsubToken}`;

      const eventCardsHtml = upcomingEvents
        .map(
          (e) => `
          <div style="border-left:3px solid #6366f1;padding:12px 16px;margin-bottom:8px;background:#1e1e24;border-radius:0 8px 8px 0;">
            <a href="${APP_URL}/?job=${e.jobId}" style="color:#818cf8;text-decoration:none;font-weight:600;font-size:14px;">${e.title}</a>
            <div style="color:#a1a1aa;font-size:12px;margin-top:4px;">${e.company} — ${e.role} · ${e.date}${e.time ? ` at ${e.time}` : ""}</div>
          </div>`
        )
        .join("");

      const staleHtml =
        staleJobs.length > 0
          ? `
          <div style="margin-top:24px;">
            <h3 style="color:#fbbf24;font-size:14px;margin-bottom:8px;">⚠️ ${staleJobs.length} application(s) need attention</h3>
            ${staleJobs
              .slice(0, 5)
              .map(
                (j: any) => `
              <div style="padding:8px 16px;border-left:3px solid #fbbf24;margin-bottom:6px;background:#1e1e24;border-radius:0 8px 8px 0;">
                <a href="${APP_URL}/?job=${j.id}" style="color:#fbbf24;text-decoration:none;font-size:13px;">${j.company} — ${j.role}</a>
                <div style="color:#71717a;font-size:11px;">No update in 14+ days</div>
              </div>`
              )
              .join("")}
          </div>`
          : "";

      const html = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="background:linear-gradient(135deg,#6366f1,#818cf8);padding:3px;border-radius:16px;margin-bottom:24px;">
      <div style="background:#18181b;border-radius:14px;padding:24px;text-align:center;">
        <h1 style="margin:0;color:#fafafa;font-size:22px;">⏰ JobTrackr Reminders</h1>
        <p style="margin:8px 0 0;color:#a1a1aa;font-size:13px;">${upcomingEvents.length} upcoming event(s)</p>
      </div>
    </div>

    ${upcomingEvents.length > 0 ? `<h2 style="color:#e4e4e7;font-size:15px;margin-bottom:12px;">📅 Upcoming Events</h2>${eventCardsHtml}` : ""}
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
          subject: `⏰ ${upcomingEvents.length} upcoming event(s)${staleJobs.length > 0 ? ` + ${staleJobs.length} need attention` : ""}`,
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

      // Also send push notifications if enabled
      const pref = prefs.find((p: any) => p.user_id === userId);
      if (pref?.push_notifications && pref?.push_subscription) {
        for (const evt of upcomingEvents) {
          try {
            await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                subscription: pref.push_subscription,
                payload: {
                  title: `Upcoming: ${evt.title}`,
                  body: `${evt.company} — ${evt.date}${evt.time ? ` at ${evt.time}` : ""}`,
                  url: `/?job=${evt.jobId}`,
                },
              }),
            });
          } catch (pushErr) {
            console.error("Push notification error:", pushErr);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ message: `Processed ${totalSent} user(s) with upcoming events`, sent: totalSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in send-reminders:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
