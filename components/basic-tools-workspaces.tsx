"use client";

import { useMemo, useState } from "react";

const numberFormatter = new Intl.NumberFormat("hi-IN", {
  maximumFractionDigits: 2,
});

function formatNumber(value: number) {
  return Number.isFinite(value) ? numberFormatter.format(value) : "0";
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function Field({
  id,
  label,
  value,
  onChange,
  suffix,
  min = "0",
  step = "any",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  min?: string;
  step?: string;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-sm font-extrabold text-slate-700">{label}</span>
      <span className="flex overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-[#2f6a59] focus-within:ring-4 focus-within:ring-[#2f6a59]/10">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-13 min-w-0 flex-1 bg-transparent px-4 py-3 text-lg font-bold text-slate-950 outline-none"
        />
        {suffix && <span className="grid min-w-14 place-items-center border-l border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-500">{suffix}</span>}
      </span>
    </label>
  );
}

function ResultCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-[#2f6a59] bg-[#173f35] text-white" : "border-slate-200 bg-white"}`}>
      <p className={`text-xs font-extrabold uppercase tracking-[0.12em] ${accent ? "text-white/60" : "text-slate-400"}`}>{label}</p>
      <p className={`mt-2 text-2xl font-black ${accent ? "text-white" : "text-slate-950"}`}>{value}</p>
    </div>
  );
}

function PrivacyAside({ steps, note }: { steps: string[]; note?: string }) {
  return (
    <aside className="space-y-4">
      <div className="rounded-3xl bg-[#173f35] p-6 text-white">
        <span className="text-3xl" aria-hidden="true">🔒</span>
        <h2 className="mt-4 text-xl font-black">आपका data निजी है</h2>
        <p className="mt-2 text-sm leading-6 text-white/70">यह tool आपके browser में चलता है। कोई जानकारी server पर save या upload नहीं होती।</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-black text-slate-950">कैसे इस्तेमाल करें?</h2>
        <ol className="mt-5 space-y-4 text-sm text-slate-600">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e7f3ee] text-xs font-black text-[#173f35]">{index + 1}</span>
              <span className="pt-1 leading-5">{step}</span>
            </li>
          ))}
        </ol>
      </div>
      {note && <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">{note}</div>}
    </aside>
  );
}

export function WordCounterWorkspace() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/u).length : 0;
    const sentences = trimmed ? trimmed.split(/[.!?।]+/u).filter((part) => part.trim()).length : 0;
    return {
      words,
      characters: Array.from(text).length,
      charactersWithoutSpaces: Array.from(text.replace(/\s/gu, "")).length,
      lines: text ? text.split(/\r?\n/u).length : 0,
      sentences,
      readingMinutes: words ? Math.max(1, Math.ceil(words / 200)) : 0,
    };
  }, [text]);

  async function copyText() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#b4552d]">Live गिनती</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">अपना text लिखें या paste करें</h2>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={copyText} disabled={!text} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-40">{copied ? "Copy हो गया" : "Copy"}</button>
            <button type="button" onClick={() => setText("")} disabled={!text} className="rounded-full bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-40">साफ़ करें</button>
          </div>
        </div>
        <label htmlFor="counter-text" className="sr-only">गिनती के लिए text</label>
        <textarea
          id="counter-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="यहाँ हिंदी या English text लिखें…"
          className="mt-6 min-h-72 w-full resize-y rounded-3xl border border-slate-300 bg-[#f8faf9] p-5 text-lg leading-8 text-slate-900 outline-none focus:border-[#2f6a59] focus:ring-4 focus:ring-[#2f6a59]/10"
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-live="polite">
          <ResultCard label="शब्द" value={formatNumber(stats.words)} accent />
          <ResultCard label="कुल अक्षर" value={formatNumber(stats.characters)} />
          <ResultCard label="बिना space अक्षर" value={formatNumber(stats.charactersWithoutSpaces)} />
          <ResultCard label="पंक्तियाँ" value={formatNumber(stats.lines)} />
          <ResultCard label="वाक्य" value={formatNumber(stats.sentences)} />
          <ResultCard label="पढ़ने का समय" value={`${stats.readingMinutes} मिनट`} />
        </div>
      </section>
      <PrivacyAside steps={["Text लिखें या paste करें", "गिनती अपने-आप देखें", "ज़रूरत हो तो text copy करें"]} />
    </div>
  );
}

type CaseMode = "upper" | "lower" | "title" | "sentence";

function convertCase(text: string, mode: CaseMode) {
  if (mode === "upper") return text.toLocaleUpperCase("en-IN");
  if (mode === "lower") return text.toLocaleLowerCase("en-IN");
  if (mode === "title") {
    return text.toLocaleLowerCase("en-IN").replace(/(^|\s)(\p{L})/gu, (match) => match.toLocaleUpperCase("en-IN"));
  }
  return text
    .toLocaleLowerCase("en-IN")
    .replace(/(^|[.!?।]\s*)(\p{L})/gu, (_match, prefix: string, letter: string) => `${prefix}${letter.toLocaleUpperCase("en-IN")}`);
}

export function CaseConverterWorkspace() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  function applyMode(mode: CaseMode) {
    setText((current) => convertCase(current, mode));
  }

  async function copyText() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const buttons: Array<[CaseMode, string, string]> = [
    ["upper", "UPPERCASE", "सभी अक्षर बड़े"],
    ["lower", "lowercase", "सभी अक्षर छोटे"],
    ["title", "Title Case", "हर शब्द का पहला अक्षर बड़ा"],
    ["sentence", "Sentence case", "हर वाक्य का पहला अक्षर बड़ा"],
  ];

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <h2 className="text-2xl font-black text-slate-950">Text का case बदलें</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Hindi text वैसा ही रहेगा; English letters चुने हुए case में बदलेंगे।</p>
        <label htmlFor="case-text" className="sr-only">बदलने के लिए text</label>
        <textarea id="case-text" value={text} onChange={(event) => setText(event.target.value)} placeholder="अपना text यहाँ paste करें…" className="mt-6 min-h-72 w-full resize-y rounded-3xl border border-slate-300 bg-[#f8faf9] p-5 text-lg leading-8 text-slate-900 outline-none focus:border-[#2f6a59] focus:ring-4 focus:ring-[#2f6a59]/10" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {buttons.map(([mode, label, detail]) => (
            <button key={mode} type="button" onClick={() => applyMode(mode)} disabled={!text} className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#7aa596] hover:bg-[#f1f7f4] disabled:cursor-not-allowed disabled:opacity-40">
              <strong className="block text-base text-slate-900">{label}</strong>
              <span className="mt-1 block text-xs text-slate-500">{detail}</span>
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={copyText} disabled={!text} className="rounded-full bg-[#173f35] px-6 py-3 font-black text-white hover:bg-[#0f3028] disabled:opacity-40">{copied ? "Copy हो गया" : "Result copy करें"}</button>
          <button type="button" onClick={() => setText("")} disabled={!text} className="rounded-full bg-rose-50 px-6 py-3 font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-40">साफ़ करें</button>
        </div>
      </section>
      <PrivacyAside steps={["Text लिखें या paste करें", "मनचाहा case चुनें", "बदला हुआ text copy करें"]} note="यह tool English अक्षरों का case बदलता है। देवनागरी लिपि में uppercase/lowercase नहीं होता।" />
    </div>
  );
}

export function EmiCalculatorWorkspace() {
  const [principal, setPrincipal] = useState("500000");
  const [rate, setRate] = useState("9");
  const [tenure, setTenure] = useState("5");
  const [tenureUnit, setTenureUnit] = useState<"years" | "months">("years");

  const result = useMemo(() => {
    const loan = parseNumber(principal);
    const annualRate = parseNumber(rate);
    const enteredTenure = parseNumber(tenure);
    const months = Math.max(0, Math.round(tenureUnit === "years" ? enteredTenure * 12 : enteredTenure));
    if (!loan || !months) return { emi: 0, interest: 0, total: 0, months };
    const monthlyRate = annualRate / 12 / 100;
    const emi = monthlyRate === 0
      ? loan / months
      : loan * monthlyRate * ((1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months) - 1);
    const total = emi * months;
    return { emi, interest: Math.max(0, total - loan), total, months };
  }, [principal, rate, tenure, tenureUnit]);

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="loan-amount" label="लोन राशि" value={principal} onChange={setPrincipal} suffix="₹" />
          <Field id="interest-rate" label="वार्षिक ब्याज दर" value={rate} onChange={setRate} suffix="%" step="0.01" />
          <Field id="loan-tenure" label="लोन अवधि" value={tenure} onChange={setTenure} suffix={tenureUnit === "years" ? "वर्ष" : "माह"} />
          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700">अवधि की इकाई</span>
            <select value={tenureUnit} onChange={(event) => setTenureUnit(event.target.value as "years" | "months")} className="min-h-13 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg font-bold text-slate-950 outline-none focus:border-[#2f6a59] focus:ring-4 focus:ring-[#2f6a59]/10">
              <option value="years">वर्ष</option>
              <option value="months">महीने</option>
            </select>
          </label>
        </div>
        <div className="mt-8 rounded-3xl bg-[#f1f7f4] p-5 sm:p-7" aria-live="polite">
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#2f6a59]">आपका EMI परिणाम</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <ResultCard label="मासिक EMI" value={`₹${formatNumber(result.emi)}`} accent />
            <ResultCard label="कुल ब्याज" value={`₹${formatNumber(result.interest)}`} />
            <ResultCard label="कुल भुगतान" value={`₹${formatNumber(result.total)}`} />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-500">कुल {result.months} मासिक किस्तें</p>
        </div>
      </section>
      <PrivacyAside steps={["लोन राशि भरें", "ब्याज और अवधि भरें", "EMI तथा कुल ब्याज देखें"]} note="यह अनुमानित EMI है। बैंक की processing fee, insurance या अन्य शुल्क इसमें शामिल नहीं हैं।" />
    </div>
  );
}

export function GstCalculatorWorkspace() {
  const [amount, setAmount] = useState("10000");
  const [rate, setRate] = useState("18");
  const [mode, setMode] = useState<"add" | "remove">("add");

  const result = useMemo(() => {
    const enteredAmount = parseNumber(amount);
    const gstRate = parseNumber(rate);
    const taxable = mode === "add" ? enteredAmount : enteredAmount / (1 + gstRate / 100);
    const total = mode === "add" ? enteredAmount * (1 + gstRate / 100) : enteredAmount;
    const gst = Math.max(0, total - taxable);
    return { taxable, gst, total, halfTax: gst / 2 };
  }, [amount, rate, mode]);

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="gst-amount" label={mode === "add" ? "GST के बिना राशि" : "GST सहित कुल राशि"} value={amount} onChange={setAmount} suffix="₹" />
          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700">GST दर</span>
            <select value={rate} onChange={(event) => setRate(event.target.value)} className="min-h-13 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg font-bold text-slate-950 outline-none focus:border-[#2f6a59] focus:ring-4 focus:ring-[#2f6a59]/10">
              {[0, 0.25, 3, 5, 12, 18, 28].map((gstRate) => <option key={gstRate} value={gstRate}>{gstRate}%</option>)}
            </select>
          </label>
        </div>
        <fieldset className="mt-6">
          <legend className="text-sm font-extrabold text-slate-700">क्या करना है?</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className={`cursor-pointer rounded-2xl border p-4 ${mode === "add" ? "border-[#2f6a59] bg-[#eaf4ef]" : "border-slate-200"}`}>
              <input type="radio" name="gst-mode" value="add" checked={mode === "add"} onChange={() => setMode("add")} className="mr-2 accent-[#173f35]" />
              <strong>GST जोड़ें</strong>
            </label>
            <label className={`cursor-pointer rounded-2xl border p-4 ${mode === "remove" ? "border-[#2f6a59] bg-[#eaf4ef]" : "border-slate-200"}`}>
              <input type="radio" name="gst-mode" value="remove" checked={mode === "remove"} onChange={() => setMode("remove")} className="mr-2 accent-[#173f35]" />
              <strong>GST अलग करें</strong>
            </label>
          </div>
        </fieldset>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-live="polite">
          <ResultCard label="मूल राशि" value={`₹${formatNumber(result.taxable)}`} />
          <ResultCard label="कुल GST" value={`₹${formatNumber(result.gst)}`} accent />
          <ResultCard label="CGST / SGST" value={`₹${formatNumber(result.halfTax)} प्रत्येक`} />
          <ResultCard label="कुल राशि" value={`₹${formatNumber(result.total)}`} />
        </div>
      </section>
      <PrivacyAside steps={["राशि और GST दर भरें", "GST जोड़ना या अलग करना चुनें", "Tax का पूरा विभाजन देखें"]} note="एक ही राज्य की सामान्य supply में GST को CGST और SGST में बराबर दिखाया गया है। Interstate supply में यही कुल tax IGST हो सकता है।" />
    </div>
  );
}

export function PercentageCalculatorWorkspace() {
  const [percent, setPercent] = useState("18");
  const [base, setBase] = useState("1000");
  const [part, setPart] = useState("250");
  const [whole, setWhole] = useState("1000");
  const [oldValue, setOldValue] = useState("800");
  const [newValue, setNewValue] = useState("1000");

  const first = parseNumber(percent) * parseNumber(base) / 100;
  const second = parseNumber(whole) ? parseNumber(part) / parseNumber(whole) * 100 : 0;
  const oldNumber = parseNumber(oldValue);
  const difference = parseNumber(newValue) - oldNumber;
  const change = oldNumber ? difference / oldNumber * 100 : 0;

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="space-y-5">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/40 sm:p-7">
          <h2 className="text-xl font-black text-slate-950">किसी संख्या का प्रतिशत निकालें</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_220px] sm:items-end">
            <Field id="percent-value" label="प्रतिशत" value={percent} onChange={setPercent} suffix="%" />
            <Field id="percent-base" label="कुल संख्या" value={base} onChange={setBase} />
            <ResultCard label={`${percent || 0}% का परिणाम`} value={formatNumber(first)} accent />
          </div>
        </article>
        <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/40 sm:p-7">
          <h2 className="text-xl font-black text-slate-950">एक संख्या दूसरी का कितने प्रतिशत है?</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_220px] sm:items-end">
            <Field id="percent-part" label="पहली संख्या" value={part} onChange={setPart} />
            <Field id="percent-whole" label="कुल संख्या" value={whole} onChange={setWhole} />
            <ResultCard label="उत्तर" value={`${formatNumber(second)}%`} accent />
          </div>
        </article>
        <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/40 sm:p-7">
          <h2 className="text-xl font-black text-slate-950">प्रतिशत बढ़ोतरी या कमी</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_220px] sm:items-end">
            <Field id="percent-old" label="पुरानी संख्या" value={oldValue} onChange={setOldValue} />
            <Field id="percent-new" label="नई संख्या" value={newValue} onChange={setNewValue} />
            <ResultCard label={difference >= 0 ? "बढ़ोतरी" : "कमी"} value={`${formatNumber(Math.abs(change))}%`} accent />
          </div>
        </article>
      </section>
      <PrivacyAside steps={["अपनी जरूरत वाला calculator चुनें", "दो संख्याएँ भरें", "उत्तर तुरंत देखें"]} />
    </div>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function daysInUtcMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function addYearsClamped(date: Date, years: number) {
  const year = date.getUTCFullYear() + years;
  const month = date.getUTCMonth();
  const day = Math.min(date.getUTCDate(), daysInUtcMonth(year, month));
  return new Date(Date.UTC(year, month, day));
}

function addMonthsClamped(date: Date, months: number) {
  const totalMonths = date.getUTCFullYear() * 12 + date.getUTCMonth() + months;
  const year = Math.floor(totalMonths / 12);
  const month = totalMonths % 12;
  const day = Math.min(date.getUTCDate(), daysInUtcMonth(year, month));
  return new Date(Date.UTC(year, month, day));
}

function calculateAge(birthDate: Date, targetDate: Date) {
  let years = targetDate.getUTCFullYear() - birthDate.getUTCFullYear();
  let cursor = addYearsClamped(birthDate, years);
  if (cursor > targetDate) {
    years -= 1;
    cursor = addYearsClamped(birthDate, years);
  }

  let months = 0;
  while (months < 11 && addMonthsClamped(cursor, months + 1) <= targetDate) months += 1;
  cursor = addMonthsClamped(cursor, months);
  const days = Math.round((targetDate.getTime() - cursor.getTime()) / DAY_MS);
  const totalDays = Math.round((targetDate.getTime() - birthDate.getTime()) / DAY_MS);

  let nextBirthday = addYearsClamped(birthDate, targetDate.getUTCFullYear() - birthDate.getUTCFullYear());
  if (nextBirthday <= targetDate) nextBirthday = addYearsClamped(birthDate, targetDate.getUTCFullYear() - birthDate.getUTCFullYear() + 1);
  const daysToBirthday = Math.round((nextBirthday.getTime() - targetDate.getTime()) / DAY_MS);

  return { years, months, days, totalDays, daysToBirthday };
}

export function AgeCalculatorWorkspace() {
  const [birthDate, setBirthDate] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const calculation = useMemo(() => {
    const birth = parseIsoDate(birthDate);
    const target = parseIsoDate(targetDate);
    if (!birth || !target || birth > target) return null;
    return calculateAge(birth, target);
  }, [birthDate, targetDate]);

  const invalid = Boolean(birthDate && targetDate && parseIsoDate(birthDate) && parseIsoDate(targetDate) && parseIsoDate(birthDate)! > parseIsoDate(targetDate)!);

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <label htmlFor="birth-date" className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700">जन्म तारीख</span>
            <input id="birth-date" type="date" value={birthDate} max={targetDate || undefined} onChange={(event) => setBirthDate(event.target.value)} className="min-h-13 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg font-bold text-slate-950 outline-none focus:border-[#2f6a59] focus:ring-4 focus:ring-[#2f6a59]/10" />
          </label>
          <label htmlFor="age-on-date" className="block">
            <span className="mb-2 flex items-center justify-between gap-3 text-sm font-extrabold text-slate-700">
              <span>किस तारीख तक उम्र चाहिए?</span>
              <button type="button" onClick={() => setTargetDate(new Date().toISOString().slice(0, 10))} className="text-xs text-[#2f6a59] underline underline-offset-2">आज</button>
            </span>
            <input id="age-on-date" type="date" value={targetDate} min={birthDate || undefined} onChange={(event) => setTargetDate(event.target.value)} className="min-h-13 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-lg font-bold text-slate-950 outline-none focus:border-[#2f6a59] focus:ring-4 focus:ring-[#2f6a59]/10" />
          </label>
        </div>
        {invalid && <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">जन्म तारीख, गणना की तारीख से बाद की नहीं हो सकती।</p>}
        {calculation ? (
          <div className="mt-8" aria-live="polite">
            <div className="rounded-3xl bg-[#173f35] p-6 text-white">
              <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-white/60">सटीक उम्र</p>
              <p className="mt-3 text-3xl font-black sm:text-4xl">{calculation.years} वर्ष, {calculation.months} महीने, {calculation.days} दिन</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ResultCard label="कुल बीते दिन" value={formatNumber(calculation.totalDays)} />
              <ResultCard label="अगले जन्मदिन में" value={`${formatNumber(calculation.daysToBirthday)} दिन`} />
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border-2 border-dashed border-slate-300 bg-[#f8faf9] px-6 py-12 text-center">
            <span className="text-4xl" aria-hidden="true">🎂</span>
            <p className="mt-3 font-bold text-slate-600">उम्र देखने के लिए जन्म तारीख भरें।</p>
          </div>
        )}
      </section>
      <PrivacyAside steps={["जन्म तारीख चुनें", "गणना की तारीख चुनें", "वर्ष, महीने और दिन में उम्र देखें"]} note="29 फरवरी को जन्मे व्यक्ति के लिए non-leap year में गणना फरवरी के अंतिम दिन के आधार पर की जाती है।" />
    </div>
  );
}
