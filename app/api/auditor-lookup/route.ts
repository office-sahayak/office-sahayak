import { NextRequest, NextResponse } from "next/server";
import { getPrivateAuditData, normalizeRegistration, findAuditorContact } from "@/lib/office-audit-data";

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
  if (typeof registrationNumber !== "string" || !/^[0-9]{1,12}(?:\/[0-9]{1,6})?$/.test(registrationNumber)) {
    return reply({ message: "पंजीयन क्रमांक अंक में लिखें; जरूरत होने पर 1773/96 जैसा क्रमांक भी दर्ज कर सकते हैं।" }, 400);
  }
  const data = getPrivateAuditData();
  if (!data) return reply({ message: "आवंटन डेटा अभी सर्वर पर उपलब्ध नहीं है।" }, 503);
  const matches = data.s.filter(row => normalizeRegistration(row[0]) === normalizeRegistration(registrationNumber));
  if (!matches.length) return reply({ found: false, message: "इस पंजीयन क्रमांक पर कोई संस्था नहीं मिली।" }, 404);
  return reply({ found: true, results: matches.map(row => {
    const auditorName = data.a[row[2]] || null;
    const contact = auditorName ? findAuditorContact(auditorName, data.c) : null;
    return {
      registrationNumber: row[0],
      societyName: row[1],
      auditorName,
      mobileNumber: contact?.[2] || null,
    };
  }) });
}
