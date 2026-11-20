"use client";

import { useRef, useState, type FormEvent } from "react";
import { plotFields, validPlotQuery, type PlotRecord } from "@/lib/jagrati-plots";

const groups = [
  { title: "सदस्य और भूखंड", columns: [0, 4, 6] },
  { title: "विक्रेता और पता", columns: [1, 3] },
  { title: "मूल सदस्य की रजिस्ट्री", columns: [7, 8] },
  { title: "क्रेता सदस्य की रजिस्ट्री", columns: [9, 10, 11] },
  { title: "टिप्पणी", columns: [12, 13] },
];

function CellValue({ record, column }: { record: PlotRecord; column: number }) {
  const original = record.legacyValues?.[column];
  return original
    ? <span style={{ fontFamily: '"DevLys 010", sans-serif', fontSize: "1.35em" }}>{original}</span>
    : <>{record.values[column] || "—"}</>;
}

export function JagratiPlotSearch({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [number, setNumber] = useState("");
  const [searched, setSearched] = useState("");
  const [results, setResults] = useState<PlotRecord[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    setResults([]);
    setMessage("");
    if (!validPlotQuery(number)) {
      setMessage("कृपया भूखंड क्रमांक लिखें, जैसे 131 या 9-A।");
      inputRef.current?.focus();
      return;
    }
    busy.current = true;
    setLoading(true);
    setSearched(number.trim());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetch("/api/jagrati-plot-lookup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plotNumber: number.trim() }), cache: "no-store", signal: controller.signal,
      });
      const data = await response.json();
      if (response.status === 401) { onSessionExpired(); return; }
      if (!response.ok || !data.found) {
        setMessage(data.message || "इस भूखंड क्रमांक का रिकॉर्ड नहीं मिला।");
      } else {
        setResults(data.results);
      }
    } catch {
      setMessage("अभी खोज पूरी नहीं हो सकी। कृपया दोबारा खोजें।");
    } finally {
      clearTimeout(timeout);
      busy.current = false;
      setLoading(false);
    }
  }

  function clear() {
    setNumber(""); setSearched(""); setResults([]); setMessage("");
    inputRef.current?.focus();
  }

  return <>
    <form onSubmit={search} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 print:hidden">
      <label htmlFor="plot-number" className="mb-3 block text-base font-bold text-slate-900">भूखंड क्रमांक</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input ref={inputRef} id="plot-number" name="plotNumber" type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false}
          value={number} onChange={event => { setNumber(event.target.value); setResults([]); setMessage(""); setSearched(""); }}
          disabled={loading} maxLength={64} placeholder="जैसे 131, 9-A, 18 INFARMAL" aria-describedby="plot-hint"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-lg text-slate-950 placeholder:text-base disabled:opacity-60" />
        <button type="submit" disabled={loading} className="rounded-xl bg-[#173f35] px-8 py-3.5 text-base font-bold text-white transition hover:bg-[#245a4c] disabled:opacity-60">{loading ? "खोज रहे हैं…" : "विवरण खोजें"}</button>
        {(number || results.length > 0) && <button type="button" onClick={clear} disabled={loading} className="rounded-xl border border-slate-300 px-5 py-3.5 text-base font-semibold text-slate-700 disabled:opacity-60">साफ करें</button>}
      </div>
      <p id="plot-hint" className="mt-3 text-sm leading-6 text-slate-500">9-A, 9 A और 9A एक जैसे खोजे जाएँगे। हिंदी अंक भी लिख सकते हैं। सेक्टर हो तो पूरा क्रमांक लिखें।</p>
    </form>

    <div role="status" aria-live="polite" aria-atomic="true" className="print:hidden">
      {loading && <p className="mt-6 text-base text-slate-600">भूखंड का विवरण खोजा जा रहा है…</p>}
      {message && <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-base leading-7 text-amber-950">{message}</p>}
      {results.length > 0 && <p className="mt-7 text-base font-bold text-[#173f35]">भूखंड {searched} के लिए {results.length} रिकॉर्ड मिले</p>}
    </div>

    {results.length > 0 && <section aria-label="भूखंड के खोज परिणाम" className="mt-4 space-y-6 print:mt-2">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm leading-6 text-slate-600">एक क्रमांक पर कई प्रविष्टियाँ होने पर हर रिकॉर्ड अलग दिखाया गया है।</p>
        <button onClick={() => window.print()} type="button" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">प्रिंट / PDF</button>
      </div>
      {results.map((record, index) => <article key={record.sourceRow} className="jagrati-record overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:shadow-none">
        <div className="border-b border-emerald-100 bg-[#edf6f1] px-5 py-5 sm:px-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-sm font-semibold text-[#17624d]">{plotFields[5]}</p><h2 className="mt-1 text-2xl font-extrabold text-slate-950">{record.values[5]}</h2></div>
            <span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-600">रिकॉर्ड {index + 1} / {results.length}</span>
          </div>
          <p className="mt-4 text-sm font-semibold text-[#17624d]">{plotFields[2]}</p>
          <p className="mt-1 break-words text-xl font-bold leading-8 text-slate-950"><CellValue record={record} column={2} /></p>
        </div>
        <div className="divide-y divide-slate-100 px-5 sm:px-7">
          {groups.map(group => <section key={group.title} className="py-5">
            <h3 className="mb-4 text-base font-bold text-[#173f35]">{group.title}</h3>
            <dl className={`grid gap-x-8 gap-y-5 ${group.columns.includes(12) ? "" : "sm:grid-cols-2"}`}>
              {group.columns.map(column => <div key={column}>
                <dt className="text-sm leading-6 text-slate-500">{plotFields[column]}</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-base leading-7 text-slate-950"><CellValue record={record} column={column} /></dd>
              </div>)}
            </dl>
          </section>)}
        </div>
        <p className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500 sm:px-7">मूल Excel की पंक्ति: {record.sourceRow} · खाली खाने: —</p>
      </article>)}
    </section>}

    {!results.length && !message && !loading && <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-8 text-center print:hidden">
      <p className="text-base font-semibold text-slate-700">भूखंड क्रमांक से शुरू करें</p>
      <p className="mx-auto mt-2 max-w-lg text-base leading-7 text-slate-500">नाम, पता, सदस्यता क्रमांक, क्षेत्रफल, रजिस्ट्री और सभी टिप्पणियाँ यहाँ दिखाई देंगी।</p>
    </div>}
  </>;
}
