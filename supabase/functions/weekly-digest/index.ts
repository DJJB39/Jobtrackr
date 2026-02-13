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

    // Get users who opted into weekly digest
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

    for (const userId of userIds) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!userData?.user?.email) continue;

      const { data: jobs } = await supabaseAdmin
        .from("job_applications")
        .select("company, role, column_id, events, created_at, updated_at")
        .eq("user_id", userId);

      if (!jobs?.length) continue;

      // New applications this week
      const newThisWeek = jobs.filter((j: { created_at: string }) => j.created_at >= weekAgoStr);

      // Upcoming events in next 7 days
      const upcomingEvents: { company: string; title: string; date: string }[] = [];
      for (const job of jobs) {
        const events = (job.events as Array<{ title: string; date: string }>) ?? [];
        for (const evt of events) {
          if (evt.date >= todayStr && evt.date <= in7DaysStr) {
            upcomingEvents.push({ company: job.company, title: evt.title, date: evt.date });
          }
        }
      }

      // Stale applications (14+ days without update)
      const staleThreshold = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const staleJobs = jobs.filter(
        (j: { column_id: string; updated_at: string }) =>
          !["accepted", "rejected"].includes(j.column_id) && j.updated_at < staleThreshold
      );

      // Build digest summary
      const summary = [
        `📊 Weekly Pipeline Digest`,
        ``,
        `New this week: ${newThisWeek.length} application(s)`,
        `Total pipeline: ${jobs.length} application(s)`,
        ``,
      ];

      if (upcomingEvents.length > 0) {
        summary.push(`📅 Upcoming Events:`);
        upcomingEvents.forEach((e) => summary.push(`  • ${e.title} — ${e.company} (${e.date})`));
        summary.push(``);
      }

      if (staleJobs.length > 0) {
        summary.push(`⚠️ Stale Applications (${staleJobs.length}):`);
        staleJobs.slice(0, 5).forEach((j: { company: string; role: string }) =>
          summary.push(`  • ${j.company} — ${j.role}`)
        );
        summary.push(``);
      }

      console.log(`Would send weekly digest to ${userData.user.email}:\n${summary.join("\n")}`);
      totalSent++;
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
