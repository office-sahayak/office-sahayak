import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const jagratiCookie = "jagrati_plot_session";
export const sessionSeconds = 12 * 60 * 60;

function accessHash() {
  const value = process.env.JAGRATI_PLOT_ACCESS_HASH || "";
  return /^[a-f0-9]{64}$/.test(value) ? value : null;
}

export function verifyJagratiPassword(password: unknown) {
  const expected = accessHash();
  if (!expected || typeof password !== "string" || password.length > 200) return false;
  const actual = createHash("sha256").update(password.trim()).digest("hex");
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export function createJagratiSession(now = Date.now()) {
  const key = accessHash();
  if (!key) return null;
  const payload = `${now + sessionSeconds * 1000}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${createHmac("sha256", key).update(payload).digest("hex")}`;
}

export function verifyJagratiSession(token: string | undefined, now = Date.now()) {
  const key = accessHash();
  if (!key || !token || !/^\d{13}\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(token)) return false;
  const [expires, nonce, signature] = token.split(".");
  if (Number(expires) <= now || Number(expires) > now + sessionSeconds * 1000) return false;
  const expected = createHmac("sha256", key).update(`${expires}.${nonce}`).digest("hex");
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
