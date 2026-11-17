import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const attempts = new Map<string, { count: number; expires: number }>();

function reply(payload: object, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex, nofollow" } });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  if (attempts.size > 10000) {
    for (const [key, value] of attempts) if (value.expires < now) attempts.delete(key);
  }
  const existing = attempts.get(ip);
  const current = existing && existing.expires > now ? existing : { count: 0, expires: now + 60_000 };
  current.count++;
  attempts.set(ip, current);
  if (current.count > 15) return reply({ message: "बहुत अधिक खोज की गई हैं। कृपया कुछ देर बाद प्रयास करें।" }, 429);

  let input: unknown;
  try { input = await request.json(); } catch { return reply({ message: "अमान्य अनुरोध।" }, 400); }
  const registrationNumber = (input as { registrationNumber?: unknown })?.registrationNumber;
  if (typeof registrationNumber !== "string" || !/^\d{1,12}$/.test(registrationNumber)) {
    return reply({ message: "केवल पंजीयन क्रमांक के अंक लिखें।" }, 400);
  }
  const url = process.env.AUDITOR_SUPABASE_URL;
  const key = process.env.AUDITOR_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return reply({ message: "यह सेवा अभी तैयार की जा रही है।" }, 503);

  try {
    const endpoint = new URL("/rest/v1/auditor_allotment", url);
    endpoint.searchParams.set("select", "registration_number,society_name,auditor_name");
    endpoint.searchParams.set("registration_number", "eq." + registrationNumber);
    endpoint.searchParams.set("order", "id.asc");
    const rows: Array<{ registration_number: string; society_name: string; auditor_name: string | null }> = [];
    const batchSize = 500;
    let offset = 0;
    while (true) {
      endpoint.searchParams.set("limit", String(batchSize));
      endpoint.searchParams.set("offset", String(offset));
      const res = await fetch(endpoint, {
        headers: { apikey: key, Authorization: "Bearer " + key, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000)
      });
      if (!res.ok) throw new Error("lookup failed");
      const batch = await res.json() as typeof rows;
      rows.push(...batch);
      if (batch.length < batchSize) break;
      offset += batchSize;
    }
    if (rows.length === 0) return reply({ found: false, message: "इस पंजीयन क्रमांक की संस्था नहीं मिली। कृपया अंक जाँचें।" }, 404);
    return reply({
      found: true,
      results: rows.map(row => ({
        registrationNumber: row.registration_number,
        societyName: row.society_name,
        auditorName: row.auditor_name
      }))
    });
  } catch {
    return reply({ message: "खोज सेवा अभी उपलब्ध नहीं है।" }, 503);
  }
}
