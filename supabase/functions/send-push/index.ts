import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_URL = Deno.env.get("APP_URL") || "https://brs39.lovable.app";
const ALLOWED_ORIGINS = [
  APP_URL,
  "https://brs39.lovable.app",
  "https://id-preview--03b5424d-9b42-4895-9126-0bbdd9be20a7.lovable.app",
];

const ALLOWED_PUSH_HOSTS = [
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "wns.windows.com",
  "push.apple.com",
  "web.push.apple.com",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

function isValidPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") return false;
    return ALLOWED_PUSH_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith("." + h));
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subscription, payload } = await req.json();

    if (!subscription || !subscription.endpoint || !payload) {
      return new Response(
        JSON.stringify({ error: "subscription (with endpoint) and payload are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate push endpoint is a known push service
    if (!isValidPushEndpoint(subscription.endpoint)) {
      return new Response(
        JSON.stringify({ error: "Invalid push service endpoint" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build VAPID JWT
    const vapidJwt = await buildVapidJwt(subscription.endpoint, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    // Encode payload
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));

    const pushRes = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `vapid t=${vapidJwt}, k=${VAPID_PUBLIC_KEY}`,
        "Content-Type": "application/octet-stream",
        "Content-Length": String(payloadBytes.length),
        "TTL": "86400",
        "Urgency": "high",
      },
      body: payloadBytes,
    });

    if (!pushRes.ok) {
      const errText = await pushRes.text();
      console.error(`Push failed [${pushRes.status}]: ${errText}`);
      return new Response(
        JSON.stringify({ error: `Push service returned ${pushRes.status}` }),
        { status: pushRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Send-push error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function buildVapidJwt(endpoint: string, publicKey: string, privateKey: string): Promise<string> {
  const aud = new URL(endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600;

  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud,
    exp,
    sub: "mailto:notifications@jobtrackr.app",
  };

  const b64url = (data: Uint8Array) =>
    btoa(String.fromCharCode(...data))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const enc = new TextEncoder();
  const headerB64 = b64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = b64url(enc.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const jwkPriv = {
    kty: "EC",
    crv: "P-256",
    d: privateKey,
    x: publicKey.slice(0, 43),
    y: publicKey.slice(43),
  };

  const key = await crypto.subtle.importKey(
    "jwk",
    jwkPriv,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(unsignedToken)
  );

  return `${unsignedToken}.${b64url(new Uint8Array(sig))}`;
}
