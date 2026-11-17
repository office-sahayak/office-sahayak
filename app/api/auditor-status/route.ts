import { NextResponse } from "next/server";
import { getPrivateAuditData } from "@/lib/office-audit-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const data = getPrivateAuditData();
  return NextResponse.json(
    { ready: Boolean(data), societyRows: data?.s.length ?? 0, auditorContacts: data?.c.length ?? 0 },
    { status: data ? 200 : 503, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } }
  );
}
