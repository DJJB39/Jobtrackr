import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get users who opted into email reminders
    const { data: prefs, error: prefsErr } = await supabaseAdmin
      .from("user_preferences")
      .select("user_id")
      .eq("email_reminders", true);

    if (prefsErr || !prefs?.length) {
      return new Response(
        JSON.stringify({ message: "No users with reminders enabled", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = prefs.map((p: { user_id: string }) => p.user_id);
    let totalSent = 0;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);

    for (const userId of userIds) {
      // Get user email
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!userData?.user?.email) continue;

      // Get jobs with upcoming events in the next 24 hours
      const { data: jobs } = await supabaseAdmin
        .from("job_applications")
        .select("company, role, events")
        .eq("user_id", userId);

      if (!jobs?.length) continue;

      const upcomingEvents: { company: string; role: string; title: string; date: string; time: string | null }[] = [];

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
            });
          }
        }
      }

      if (upcomingEvents.length === 0) continue;

      const eventListHtml = upcomingEvents
        .map((e) => `<li><strong>${e.title}</strong> — ${e.company} (${e.role}) on ${e.date}${e.time ? ` at ${e.time}` : ""}</li>`)
        .join("");

      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "JobTracker <onboarding@resend.dev>",
          to: [userData.user.email],
          subject: `⏰ You have ${upcomingEvents.length} upcoming event(s)`,
          html: `<h2>Upcoming Events</h2><ul>${eventListHtml}</ul><p>Good luck! 🍀</p>`,
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
