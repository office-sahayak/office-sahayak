import { NextRequest, NextResponse } from "next/server";
import { createJagratiSession, jagratiCookie, sessionSeconds, verifyJagratiPassword, verifyJagratiSession } from "@/lib/server/jagrati-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const failures = new Map<string, { count: number; expires: number }>();
const headers = { "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: verifyJagratiSession(request.cookies.get(jagratiCookie)?.value) }, { headers });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  for (const [key, value] of failures) if (value.expires <= now) failures.delete(key);
  const current = failures.get(ip) || { count: 0, expires: now + 60_000 };
  if (current.count >= 5 || (!failures.has(ip) && failures.size >= 10000)) {
    return NextResponse.json({ message: "कृपया एक मिनट बाद पासवर्ड दोबारा डालें।" }, { status: 429, headers });
  }
  let password: unknown;
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) throw new Error("invalid content type");
    if (Number(request.headers.get("content-length")) > 1024) throw new Error("too large");
    const text = await request.text();
    if (text.length > 1024) throw new Error("too large");
    password = JSON.parse(text)?.password;
  } catch {
    return NextResponse.json({ message: "कृपया पासवर्ड दर्ज करें।" }, { status: 400, headers });
  }
  if (!verifyJagratiPassword(password)) {
    current.count++; failures.set(ip, current);
    return NextResponse.json({ message: "पासवर्ड सही नहीं है। कृपया फिर से दर्ज करें।" }, { status: 401, headers });
  }
  const token = createJagratiSession();
  if (!token) return NextResponse.json({ message: "अभी प्रवेश संभव नहीं है।" }, { status: 503, headers });
  failures.delete(ip);
  const response = NextResponse.json({ authenticated: true }, { headers });
  response.cookies.set(jagratiCookie, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/api/", maxAge: sessionSeconds });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false }, { headers });
  response.cookies.set(jagratiCookie, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/api/", maxAge: 0 });
  return response;
}
