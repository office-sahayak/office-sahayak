import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requests = new Map<string, { count: number; expires: number }>();

function reply(payload: object, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const key = ip + ":auditor-contact";
  const previous = requests.get(key);
  const entry = previous && previous.expires > now ? previous : { count: 0, expires: now + 60_000 };
  entry.count++;
  requests.set(key, entry);
  if (requests.size > 10000) {
    for (const [id, value] of requests) if (value.expires < now) requests.delete(id);
  }
  if (entry.count > 10) return reply({ message: "अभी बहुत अधिक खोज की गई हैं। कृपया थोड़ी देर बाद प्रयास करें।" }, 429);

  let body: unknown;
  try { body = await request.json(); } catch { return reply({ message: "अमान्य अनुरोध।" }, 400); }
  const query = (body as { auditorName?: unknown })?.auditorName;
  if (typeof query !== "string") return reply({ message: "ऑडिटर का पूरा नाम लिखें।" }, 400);
  const normalized = query.trim().replace(/\s+/g, " ").toUpperCase().replace(/^(MR|MRS|MISS|MS|SHRI|SMT)\s+/, "");
  if (normalized.length < 4 || normalized.length > 100 || !/^[A-Z\s.]+$/.test(normalized)) {
    return reply({ message: "कृपया ऑडिटर का पूरा अंग्रेजी नाम लिखें।" }, 400);
  }

  const url = process.env.AUDITOR_SUPABASE_URL;
  const secret = process.env.AUDITOR_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) return reply({ message: "संपर्क खोज सेवा अभी तैयार की जा रही है।" }, 503);

  try {
    const endpoint = new URL("/rest/v1/auditor_contacts", url);
    endpoint.searchParams.set("select", "auditor_name,designation,mobile_number");
    endpoint.searchParams.set("name_key", "eq." + normalized);
    endpoint.searchParams.set("limit", "100");
    const response = await fetch(endpoint, {
      headers: { apikey: secret, Authorization: "Bearer " + secret, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error("database error");
    const rows = await response.json() as Array<{ auditor_name: string; designation: string | null; mobile_number: string }>;
    if (!rows.length) return reply({ found: false, message: "इस नाम का ऑडिटर नहीं मिला। पूरा नाम दोबारा जाँचें।" }, 404);
    return reply({ found: true, results: rows.map(row => ({
      auditorName: row.auditor_name,
      designation: row.designation,
      mobileNumber: row.mobile_number
    })) });
  } catch {
    return reply({ message: "संपर्क खोज सेवा अभी उपलब्ध नहीं है।" }, 503);
  }
}
