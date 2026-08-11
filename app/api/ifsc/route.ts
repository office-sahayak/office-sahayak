const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/u;

interface IfscApiResponse {
  ADDRESS?: unknown;
  BANK?: unknown;
  BANKCODE?: unknown;
  BRANCH?: unknown;
  CENTRE?: unknown;
  CITY?: unknown;
  CONTACT?: unknown;
  DISTRICT?: unknown;
  IFSC?: unknown;
  IMPS?: unknown;
  MICR?: unknown;
  NEFT?: unknown;
  RTGS?: unknown;
  STATE?: unknown;
  SWIFT?: unknown;
  UPI?: unknown;
}

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function flag(value: unknown) {
  return value === true;
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase() ?? "";
  if (!IFSC_PATTERN.test(code)) {
    return Response.json({ error: "सही 11-character IFSC code लिखें।" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://ifsc.razorpay.com/${encodeURIComponent(code)}`, {
      cache: "no-store",
      headers: { Accept: "application/json", "User-Agent": "Office-Sahayak/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 404) return Response.json({ error: "इस IFSC code की branch नहीं मिली। Code दोबारा जाँचें।" }, { status: 404 });
    if (!response.ok) return Response.json({ error: "IFSC service अभी उपलब्ध नहीं है। थोड़ी देर बाद प्रयास करें।" }, { status: 502 });
    const data = await response.json() as IfscApiResponse;
    return Response.json({
      address: text(data.ADDRESS), bank: text(data.BANK), bankCode: text(data.BANKCODE), branch: text(data.BRANCH),
      centre: text(data.CENTRE), city: text(data.CITY), contact: text(data.CONTACT), district: text(data.DISTRICT),
      ifsc: text(data.IFSC) || code, imps: flag(data.IMPS), micr: text(data.MICR), neft: flag(data.NEFT),
      rtgs: flag(data.RTGS), state: text(data.STATE), swift: text(data.SWIFT), upi: flag(data.UPI),
    });
  } catch {
    return Response.json({ error: "IFSC की जानकारी प्राप्त नहीं हो सकी। Internet connection जाँचकर दोबारा प्रयास करें।" }, { status: 502 });
  }
}
