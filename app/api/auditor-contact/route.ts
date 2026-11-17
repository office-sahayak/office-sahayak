import { NextRequest, NextResponse } from "next/server";
import { getPrivateAuditData, normalizeAuditor } from "@/lib/office-audit-data";

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
  const normalized = normalizeAuditor(query);
  if (normalized.length < 3 || normalized.length > 100) {
    return reply({ message: "कृपया ऑडिटर का पूरा नाम लिखें।" }, 400);
  }
  const data = getPrivateAuditData();
  if (!data) return reply({ message: "ऑडिटर संपर्क डेटा अभी सर्वर पर उपलब्ध नहीं है।" }, 503);
  const results = data.c.filter(c => normalizeAuditor(c[0]) === normalized || normalizeAuditor(c[3]) === normalized);
  if (!results.length) return reply({ found: false, message: "इस नाम का ऑडिटर नहीं मिला। पूरा नाम जाँचें।" }, 404);
  return reply({ found: true, results: results.map(c => ({
    auditorName: c[3] || c[0], designation: c[1], mobileNumber: c[2]
  })) });
}
