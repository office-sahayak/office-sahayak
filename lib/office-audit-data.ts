import { gunzipSync } from "node:zlib";

type AuditData = {
  a: string[];
  s: Array<[registrationNumber: string, societyName: string, auditorIndex: number]>;
  c: Array<[englishName: string, designation: string, mobileNumber: string, hindiName: string]>;
};
let cached: AuditData | null = null;
let cachedSignature = "";

export function getPrivateAuditData(): AuditData | null {
  const encoded = Array.from({ length: 8 }, (_, i) => process.env[`OFFICE_AUDIT_DATA_${i + 1}`] || "").join("");
  if (!encoded) return null;
  if (cached && cachedSignature === encoded.slice(0, 64) + encoded.length) return cached;
  try {
    const obj = JSON.parse(gunzipSync(Buffer.from(encoded, "base64")).toString("utf8")) as AuditData;
    if (!Array.isArray(obj.a) || !Array.isArray(obj.s) || !Array.isArray(obj.c)) return null;
    if (obj.s.length !== 3264 || obj.c.length !== 23) return null;
    cached = obj;
    cachedSignature = encoded.slice(0, 64) + encoded.length;
    return cached;
  } catch {
    return null;
  }
}

export function normalizeRegistration(text: string) {
  return text.trim().replace(/[०-९]/g, (c) => String("०१२३४५६७८९".indexOf(c)))
    .replace(/^0+(?=\d)/, "");
}

export function normalizeAuditor(text: string) {
  return text.trim().replace(/\s+/g, " ")
    .replace(/^(MR|MRS|MISS|MS|SHRI|SMT)\.?\s+/i, "")
    .replace(/^(श्रीमती|सुश्री|श्री)\s*/, "")
    .toUpperCase();
}
