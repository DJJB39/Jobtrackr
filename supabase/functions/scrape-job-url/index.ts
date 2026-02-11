const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const isValidUrl = (url: string): boolean => {
  if (url.length > 2048) return false;
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
};

const getMeta = (html: string, prop: string): string | null => {
  // Try property="..." content="..." order
  let re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`,
    "i"
  );
  let match = html.match(re);
  if (match) return match[1].trim() || null;

  // Try content="..." property="..." order
  re = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`,
    "i"
  );
  match = html.match(re);
  return match?.[1]?.trim() || null;
};

const getTitle = (html: string): string | null => {
  return html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || null;
};

const getJsonLd = (html: string): any | null => {
  const matches = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];
  for (const m of matches) {
    try {
      const obj = JSON.parse(m[1]);
      if (obj["@type"] === "JobPosting") return obj;
      // Check @graph array
      if (Array.isArray(obj["@graph"])) {
        const jp = obj["@graph"].find((item: any) => item["@type"] === "JobPosting");
        if (jp) return jp;
      }
    } catch { /* skip invalid JSON */ }
  }
  return null;
};

const getSalary = (ld: any): string | null => {
  const bs = ld.baseSalary || ld.estimatedSalary;
  if (!bs) return null;
  const val = bs.value || bs;
  if (val.minValue && val.maxValue) {
    return `${bs.currency ?? ""} ${val.minValue}-${val.maxValue}/${val.unitText ?? "YEAR"}`.trim();
  }
  if (typeof val === "string" || typeof val === "number") return String(val);
  return null;
};

const getLocation = (ld: any): string | null => {
  const loc = ld.jobLocation;
  if (!loc) return null;
  if (typeof loc === "string") return loc;
  if (loc.address) {
    const a = loc.address;
    if (typeof a === "string") return a;
    return [a.addressLocality, a.addressRegion, a.addressCountry].filter(Boolean).join(", ") || null;
  }
  if (loc.name) return loc.name;
  return null;
};

const splitTitle = (title: string): { role: string; company: string | null } => {
  for (const sep of [" at ", " @ ", " - ", " | ", " — "]) {
    const idx = title.indexOf(sep);
    if (idx > 0) {
      return {
        role: title.slice(0, idx).trim(),
        company: title.slice(idx + sep.length).split(/[|\-—]/).at(0)?.trim() || null,
      };
    }
  }
  return { role: title, company: null };
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string" || !isValidUrl(url)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    let html: string;
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; JobTrackrBot/1.0; +https://brs39.lovable.app)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      html = await res.text();
    } catch (e) {
      clearTimeout(timeout);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch URL" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    clearTimeout(timeout);

    // Extract data
    const ld = getJsonLd(html);
    let title: string | null = null;
    let company: string | null = null;
    let description: string | null = null;
    let location: string | null = null;
    let salary: string | null = null;
    let partial = true;

    // JSON-LD (highest priority)
    if (ld) {
      title = ld.title || null;
      company = typeof ld.hiringOrganization === "string"
        ? ld.hiringOrganization
        : ld.hiringOrganization?.name || null;
      description = ld.description?.slice(0, 500) || null;
      location = getLocation(ld);
      salary = getSalary(ld);
      partial = false;
    }

    // OG tags (fill gaps)
    const ogTitle = getMeta(html, "og:title");
    const ogSite = getMeta(html, "og:site_name");
    const ogDesc = getMeta(html, "og:description") || getMeta(html, "description");

    if (ogTitle || ogSite) partial = false;

    if (!title && ogTitle) title = ogTitle;
    if (!company && ogSite) company = ogSite;
    if (!description && ogDesc) description = ogDesc?.slice(0, 500) || null;

    // <title> fallback
    if (!title) {
      const rawTitle = getTitle(html);
      if (rawTitle) {
        const split = splitTitle(rawTitle);
        title = split.role;
        if (!company) company = split.company;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          title: title || null,
          company: company || null,
          description: description || null,
          location: location || null,
          salary: salary || null,
          url,
        },
        partial,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
