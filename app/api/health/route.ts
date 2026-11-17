import { getPrivateAuditData } from "@/lib/office-audit-data";

export const runtime = "nodejs";
let auditedOnce = false;

export function GET() {
  const audit = getPrivateAuditData();
  if (!auditedOnce) {
    console.info("Office-Sahayak audit data readiness", {
      ready: Boolean(audit),
      societyRows: audit?.s.length ?? 0,
      contactRows: audit?.c.length ?? 0,
    });
    auditedOnce = true;
  }
  return Response.json({
    service: "office-sahayak",
    status: "ok",
    auditorLookupReady: Boolean(audit),
  }, { headers: { "Cache-Control": "no-store" } });
}
