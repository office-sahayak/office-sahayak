export const runtime = "nodejs";

export function GET() {
  return Response.json({ service: "office-sahayak", status: "ok" }, {
    headers: { "Cache-Control": "no-store" },
  });
}
