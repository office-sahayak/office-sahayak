"use client";

import { useEffect, useState, type FormEvent } from "react";
import { JagratiPlotSearch } from "@/components/jagrati-plot-search";

export function JagratiAccess() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/jagrati-access", { cache: "no-store", signal: controller.signal })
      .then(response => response.json()).then(data => setAuthenticated(data.authenticated === true))
      .catch(() => {}).finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/jagrati-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (response.ok && data.authenticated) { setAuthenticated(true); setPassword(""); }
      else setMessage(data.message || "प्रवेश नहीं हो सका।");
    } catch { setMessage("कनेक्शन नहीं हो सका। कृपया दोबारा प्रयास करें।"); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/jagrati-access", { method: "DELETE" });
      if (!response.ok) throw new Error("logout failed");
      setAuthenticated(false); setPassword("");
    } catch { setMessage("बाहर निकलना पूरा नहीं हुआ। कृपया फिर प्रयास करें।"); }
    finally { setBusy(false); }
  }

  if (checking) return <p role="status" className="text-base text-slate-600">प्रवेश की जाँच हो रही है…</p>;
  if (authenticated) return <>
    <div className="mb-5 flex items-center justify-between gap-4 print:hidden">
      <p className="text-sm font-semibold text-[#17624d]">सुरक्षित प्रवेश चालू है</p>
      <button type="button" onClick={logout} disabled={busy} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">बाहर निकलें</button>
    </div>
    {message && <p role="status" className="mb-4 text-base text-amber-900">{message}</p>}
    <JagratiPlotSearch onSessionExpired={() => { setAuthenticated(false); setMessage("सत्र समाप्त हुआ। कृपया पासवर्ड फिर दर्ज करें।"); }} />
  </>;
  return <form onSubmit={login} className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
    <h2 className="text-xl font-bold text-slate-900">सुरक्षित प्रवेश</h2>
    <p className="mt-2 text-base leading-7 text-slate-600">भूखंडधारियों का विवरण देखने के लिए अपना पासवर्ड दर्ज करें।</p>
    <label htmlFor="jagrati-password" className="mb-2 mt-6 block text-base font-semibold text-slate-800">पासवर्ड</label>
    <input id="jagrati-password" type="password" autoComplete="current-password" required maxLength={200} value={password} onChange={event => setPassword(event.target.value)} disabled={busy} className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-lg" />
    <button type="submit" disabled={busy} className="mt-4 w-full rounded-xl bg-[#173f35] px-6 py-3.5 text-base font-bold text-white disabled:opacity-60">{busy ? "प्रवेश हो रहा है…" : "खोज खोलें"}</button>
    {message && <p role="status" className="mt-4 text-base leading-7 text-amber-900">{message}</p>}
  </form>;
}
