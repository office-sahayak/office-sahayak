"use client";

import { useState } from "react";

interface IfscDetails {
  address: string; bank: string; bankCode: string; branch: string; centre: string; city: string; contact: string;
  district: string; ifsc: string; imps: boolean; micr: string; neft: boolean; rtgs: boolean; state: string; swift: string; upi: boolean;
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function IfscFinderWorkspace() {
  const [code, setCode] = useState("");
  const [details, setDetails] = useState<IfscDetails | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function findIfsc() {
    const normalized = code.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/u.test(normalized)) { setError("सही 11-character IFSC code लिखें, जैसे SBIN0000691।"); setDetails(null); return; }
    setIsWorking(true); setError(""); setMessage(""); setDetails(null);
    try {
      const response = await fetch(`/api/ifsc?code=${encodeURIComponent(normalized)}`);
      const result = await response.json() as IfscDetails & { error?: string };
      if (!response.ok) throw new Error(result.error || "IFSC नहीं मिला।");
      setDetails(result); setMessage("Bank branch की जानकारी मिल गई।");
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "IFSC नहीं मिला।"); }
    finally { setIsWorking(false); }
  }

  const fields = details ? [
    ["Bank", details.bank], ["Branch", details.branch], ["IFSC", details.ifsc], ["MICR", details.micr || "उपलब्ध नहीं"],
    ["City / District", [details.city, details.district].filter(Boolean).join(" / ")], ["State", details.state],
    ["Address", details.address], ["Contact", details.contact || "उपलब्ध नहीं"],
  ] : [];

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <label htmlFor="ifsc-code" className="block"><span className="mb-2 block text-sm font-extrabold text-slate-700">IFSC Code</span><input id="ifsc-code" value={code} maxLength={11} autoCapitalize="characters" spellCheck={false} onChange={(event) => { setCode(event.target.value.replace(/[^a-z0-9]/giu, "").toUpperCase()); setDetails(null); setMessage(""); }} onKeyDown={(event) => { if (event.key === "Enter") void findIfsc(); }} placeholder="SBIN0000691" className="min-h-16 w-full rounded-2xl border border-slate-300 px-5 font-mono text-2xl font-black uppercase tracking-[0.12em] outline-none focus:border-[#2f6a59] focus:ring-4 focus:ring-[#2f6a59]/10" /></label>
        <button type="button" onClick={() => void findIfsc()} disabled={isWorking} className="mt-5 rounded-full bg-[#173f35] px-7 py-3 font-black text-white disabled:opacity-50">{isWorking ? "खोज रहे हैं…" : "Branch खोजें"}</button>
        {error && <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
        {message && <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p>}
        {details && <div className="mt-7" aria-live="polite"><div className="grid gap-3 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className={`rounded-2xl border border-slate-200 p-4 ${label === "Address" ? "sm:col-span-2" : ""}`}><p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 font-bold leading-6 text-slate-900">{value || "उपलब्ध नहीं"}</p></div>)}</div><div className="mt-4 rounded-2xl bg-[#eaf4ef] p-4"><p className="text-xs font-extrabold uppercase tracking-wider text-[#2f6a59]">उपलब्ध transfer services</p><div className="mt-3 flex flex-wrap gap-2">{[["NEFT", details.neft], ["RTGS", details.rtgs], ["IMPS", details.imps], ["UPI", details.upi]].map(([label, enabled]) => <span key={String(label)} className={`rounded-full px-3 py-1.5 text-xs font-black ${enabled ? "bg-emerald-600 text-white" : "bg-white text-slate-400"}`}>{label} {enabled ? "✓" : "×"}</span>)}</div></div><button type="button" onClick={() => void copyText(`${details.bank}\n${details.branch}\nIFSC: ${details.ifsc}\n${details.address}`)} className="mt-4 rounded-full bg-slate-100 px-5 py-2.5 text-sm font-black text-slate-700">Details copy करें</button></div>}
      </section>
      <aside className="space-y-4"><div className="rounded-3xl bg-[#173f35] p-6 text-white"><span className="text-3xl" aria-hidden="true">🏦</span><h2 className="mt-4 text-xl font-black">Verified dataset lookup</h2><p className="mt-2 text-sm leading-6 text-white/70">Branch details Razorpay के open IFSC dataset/API से ली जाती हैं, जो RBI publications पर आधारित है।</p></div><div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">पैसे भेजने से पहले IFSC और account details को bank passbook, cheque या official bank source से एक बार अवश्य मिलाएँ।</div></aside>
    </div>
  );
}

export function UrlShortenerWorkspace() {
  const [longUrl, setLongUrl] = useState("");
  const [custom, setCustom] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function shorten() {
    setIsWorking(true); setError(""); setMessage(""); setShortUrl("");
    try {
      const response = await fetch("/api/shorten", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: longUrl, custom }) });
      const result = await response.json() as { error?: string; shortUrl?: string };
      if (!response.ok || !result.shortUrl) throw new Error(result.error || "Short link नहीं बन सका।");
      setShortUrl(result.shortUrl); setMessage("Short link तैयार है।");
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "Short link नहीं बन सका।"); }
    finally { setIsWorking(false); }
  }

  async function copyShortUrl() {
    if (!shortUrl) return;
    await copyText(shortUrl); setMessage("Short link copy हो गया।");
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <label className="block"><span className="mb-2 block text-sm font-extrabold text-slate-700">लंबा URL</span><textarea value={longUrl} maxLength={2000} onChange={(event) => { setLongUrl(event.target.value); setShortUrl(""); setMessage(""); }} placeholder="https://example.com/बहुत-लंबा-link" className="min-h-36 w-full rounded-3xl border border-slate-300 bg-[#f8faf9] p-5 text-lg leading-7 outline-none focus:border-[#2f6a59] focus:ring-4 focus:ring-[#2f6a59]/10" /></label>
        <label className="mt-5 block"><span className="mb-2 block text-sm font-extrabold text-slate-700">Custom short name <span className="font-medium text-slate-400">(वैकल्पिक)</span></span><div className="flex overflow-hidden rounded-2xl border border-slate-300 focus-within:border-[#2f6a59]"><span className="grid place-items-center bg-slate-100 px-4 text-sm font-bold text-slate-500">is.gd/</span><input value={custom} maxLength={30} onChange={(event) => setCustom(event.target.value.replace(/[^a-z0-9_]/giu, ""))} placeholder="office_link" className="min-h-13 min-w-0 flex-1 px-4 font-bold outline-none" /></div><span className="mt-1 block text-xs text-slate-500">5–30 letters, numbers या underscore; खाली छोड़ने पर automatic name बनेगा।</span></label>
        <button type="button" onClick={() => void shorten()} disabled={isWorking || !longUrl.trim()} className="mt-6 rounded-full bg-[#173f35] px-7 py-3 font-black text-white disabled:opacity-50">{isWorking ? "बना रहे हैं…" : "Short Link बनाएँ"}</button>
        {error && <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
        {shortUrl && <div className="mt-7 rounded-3xl bg-[#eaf4ef] p-5" aria-live="polite"><p className="text-xs font-extrabold uppercase tracking-wider text-[#2f6a59]">आपका Short Link</p><a href={shortUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block break-all text-xl font-black text-[#173f35] underline underline-offset-4">{shortUrl}</a><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => void copyShortUrl()} className="rounded-full bg-[#173f35] px-5 py-2.5 text-sm font-black text-white">Copy करें</button><a href={shortUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm">खोलकर जाँचें</a></div></div>}
        {message && <p className="mt-4 text-sm font-bold text-emerald-700">{message}</p>}
      </section>
      <aside className="space-y-4"><div className="rounded-3xl bg-[#173f35] p-6 text-white"><span className="text-3xl" aria-hidden="true">🔗</span><h2 className="mt-4 text-xl font-black">Permanent short link</h2><p className="mt-2 text-sm leading-6 text-white/70">Short links is.gd service से बनते हैं और सामान्यतः स्थायी होते हैं।</p></div><div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><strong className="block">Privacy और सावधानी</strong>Long URL is.gd service को भेजा जाता है। निजी document links को छोटा करने से पहले उनकी sharing permission जाँचें और unknown short links पर भरोसा न करें।</div></aside>
    </div>
  );
}
