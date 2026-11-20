import { NextRequest, NextResponse } from "next/server";
import { findPlotRecords, validPlotQuery } from "@/lib/jagrati-plots";
import { getJagratiPlotData } from "@/lib/server/jagrati-plot-data";
import { jagratiCookie, verifyJagratiSession } from "@/lib/server/jagrati-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const attempts = new Map<string, { count: number; expires: number }>();

function reply(payload: object, status = 200) {
  return NextResponse.json(payload, { status, headers: {
    "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex, nofollow",
  } });
}

export async function POST(request: NextRequest) {
  if (!verifyJagratiSession(request.cookies.get(jagratiCookie)?.value)) {
    return reply({ message: "जानकारी देखने के लिए पासवर्ड से प्रवेश करें।" }, 401);
  }
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
  const current = attempts.get(ip) || { count: 0, expires: now + 60_000 };
  current.count++;
  if (!attempts.has(ip) && attempts.size >= 10000) return reply({ message: "कृपया कुछ देर बाद प्रयास करें।" }, 429);
  attempts.set(ip, current);
  if (current.count > 30) return reply({ message: "बहुत अधिक खोज की गई हैं। कृपया एक मिनट बाद प्रयास करें।" }, 429);

  let body: unknown;
  try {
    if (Number(request.headers.get("content-length")) > 1024) return reply({ message: "भूखंड क्रमांक बहुत लंबा है।" }, 400);
    const text = await request.text();
    if (text.length > 1024) return reply({ message: "भूखंड क्रमांक बहुत लंबा है।" }, 400);
    body = JSON.parse(text);
  } catch {
    return reply({ message: "कृपया सही भूखंड क्रमांक दर्ज करें।" }, 400);
  }
  const plotNumber = (body as { plotNumber?: unknown } | null)?.plotNumber;
  if (!validPlotQuery(plotNumber)) return reply({ message: "भूखंड क्रमांक लिखें, जैसे 131, 9-A या 18 INFARMAL।" }, 400);
  const data = getJagratiPlotData();
  if (!data) return reply({ message: "भूखंड की जानकारी अभी उपलब्ध नहीं है। कृपया कुछ देर बाद प्रयास करें।" }, 503);
  const results = findPlotRecords(data.rows, plotNumber);
  if (!results.length) return reply({ found: false, results: [], message: "इस भूखंड क्रमांक का रिकॉर्ड नहीं मिला। क्रमांक के साथ A/B या सेक्टर हो, तो वह भी लिखें।" }, 404);
  return reply({ found: true, results });
}
