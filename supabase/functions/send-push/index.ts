import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subscription, payload } = await req.json();

    if (!subscription || !payload) {
      return new Response(
        JSON.stringify({ error: "subscription and payload are required" }),
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

    // Send push notification (unencrypted — requires subscription that supports it)
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

  // Import VAPID private key (base64url-encoded raw P-256 private key)
  const privKeyBytes = Uint8Array.from(
    atob(privateKey.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );

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
