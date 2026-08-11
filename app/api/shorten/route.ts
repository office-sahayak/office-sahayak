interface IsGdResponse { errorcode?: number; errormessage?: string; shorturl?: string }

const responseCache = new Map<string, string>();
const requestLog = new Map<string, number[]>();

function allowedByRateLimit(key: string) {
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 8) return false;
  recent.push(now);
  requestLog.set(key, recent);
  if (requestLog.size > 500) requestLog.delete(requestLog.keys().next().value ?? "");
  return true;
}

function validatedUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2000) return null;
  try {
    const url = new URL(value.trim());
    if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname || url.username || url.password) return null;
    return url.toString();
  } catch { return null; }
}

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 5000) return Response.json({ error: "Request बहुत बड़ी है।" }, { status: 413 });
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowedByRateLimit(client)) return Response.json({ error: "एक मिनट में बहुत अधिक links बनाए गए। थोड़ी देर बाद प्रयास करें।" }, { status: 429 });

  let body: { custom?: unknown; url?: unknown };
  try { body = await request.json() as { custom?: unknown; url?: unknown }; }
  catch { return Response.json({ error: "सही request भेजें।" }, { status: 400 }); }

  const longUrl = validatedUrl(body.url);
  if (!longUrl) return Response.json({ error: "http:// या https:// से शुरू होने वाला सही URL लिखें।" }, { status: 400 });
  const custom = typeof body.custom === "string" ? body.custom.trim() : "";
  if (custom && !/^[A-Za-z0-9_]{5,30}$/u.test(custom)) return Response.json({ error: "Custom नाम 5–30 letters, numbers या underscore में रखें।" }, { status: 400 });
  const cacheKey = `${longUrl}\n${custom}`;
  const cached = responseCache.get(cacheKey);
  if (cached) return Response.json({ shortUrl: cached });

  try {
    const parameters = new URLSearchParams({ format: "json", url: longUrl });
    if (custom) parameters.set("shorturl", custom);
    const response = await fetch("https://is.gd/create.php", {
      method: "POST",
      body: parameters,
      cache: "no-store",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Office-Sahayak/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    const result = await response.json() as IsGdResponse;
    if (!response.ok || !result.shorturl) {
      const message = result.errorcode === 2 ? "यह custom short name उपलब्ध नहीं है। दूसरा नाम चुनें।"
        : result.errorcode === 3 ? "Short-link service की usage limit पूरी हो गई है। एक मिनट बाद प्रयास करें।"
          : result.errormessage || "Short link नहीं बन सका।";
      return Response.json({ error: message }, { status: result.errorcode === 3 ? 429 : 400 });
    }
    responseCache.set(cacheKey, result.shorturl);
    if (responseCache.size > 200) responseCache.delete(responseCache.keys().next().value ?? "");
    return Response.json({ shortUrl: result.shorturl });
  } catch {
    return Response.json({ error: "Short-link service से connection नहीं हो सका। थोड़ी देर बाद प्रयास करें।" }, { status: 502 });
  }
}
