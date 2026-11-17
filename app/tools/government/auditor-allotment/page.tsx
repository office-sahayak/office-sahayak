"use client";

import { FormEvent, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

type Result = { societyName: string; auditorName: string | null; mobileNumber: string | null; registrationNumber: string };
type Contact = { auditorName: string; designation: string | null; mobileNumber: string };

export default function AuditorLookupPage() {
  const [number, setNumber] = useState("");
  const [auditorName, setAuditorName] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactMessage, setContactMessage] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResults([]);
    setMessage("");
    const query = number.trim().replace(/[०-९]/g, digit => String("०१२३४५६७८९".indexOf(digit)));
    if (!/^[0-9]{1,12}(?:\/[0-9]{1,6})?$/.test(query)) {
      setMessage("कृपया पंजीयन क्रमांक दर्ज करें; 1773/96 जैसे क्रमांक भी स्वीकार हैं।");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auditor-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber: query }),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.found) {
        setMessage(data.message || "इस पंजीयन क्रमांक का रिकॉर्ड नहीं मिला।");
        return;
      }
      setResults(data.results);
    } catch {
      setMessage("अभी खोज संभव नहीं है। कृपया बाद में प्रयास करें।");
    } finally {
      setLoading(false);
    }
  }

  async function searchContacts(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setContacts([]);
    setContactMessage("");
    if (auditorName.trim().length < 3) { setContactMessage("कृपया ऑडिटर का पूरा नाम लिखें।"); return; }
    setContactLoading(true);
    try {
      const response = await fetch("/api/auditor-contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ auditorName: auditorName.trim() }), cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.found) { setContactMessage(data.message || "ऑडिटर नहीं मिला।"); return; }
      setContacts(data.results);
    } catch { setContactMessage("संपर्क सेवा अभी उपलब्ध नहीं है।"); }
    finally { setContactLoading(false); }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12 sm:py-20">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="mb-2 text-sm font-bold text-[#17624d]">अंकेक्षण आवंटन • 2025–26</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">संस्था का ऑडिटर खोजें</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">पंजीयन क्रमांक डालकर संबंधित सभी संस्थाओं के नाम और आवंटित ऑडिटर देखें। एक ही नंबर पर कई संस्थाएँ हों, तो सभी परिणाम दिखेंगे। पूरी आवंटन सूची यहाँ उपलब्ध नहीं है।</p>
          <form onSubmit={search} className="mt-8 space-y-3">
            <label htmlFor="registration" className="block text-sm font-bold text-slate-800">पंजीयन क्रमांक</label>
            <input id="registration" autoComplete="off" inputMode="numeric" value={number} onChange={e => setNumber(e.target.value)} placeholder="जैसे: 2825" maxLength={19} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-950" />
            <button disabled={loading} type="submit" className="w-full rounded-xl bg-[#173f35] px-5 py-3 font-semibold text-white disabled:opacity-60">{loading ? "खोज रहे हैं…" : "खोजें"}</button>
          </form>
          {message && <p role="status" className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{message}</p>}
          {results.length > 0 && <section aria-live="polite" className="mt-6 space-y-3">
            <p className="text-sm font-bold text-emerald-900">इस पंजीयन क्रमांक पर {results.length} {results.length === 1 ? "संस्था मिली" : "संस्थाएँ मिलीं"}</p>
            {results.map((result, index) => (
              <div key={index} className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                {results.length > 1 && <p className="text-sm font-bold text-emerald-900">संस्था {index + 1}</p>}
                <div><span className="block text-xs text-slate-500">पंजीयन क्रमांक</span><strong className="text-slate-900">{result.registrationNumber}</strong></div>
                <div><span className="block text-xs text-slate-500">संस्था का नाम</span><strong className="text-slate-900">{result.societyName}</strong></div>
                <div><span className="block text-xs text-slate-500">आवंटित ऑडिटर</span><strong className="text-slate-900">{result.auditorName || "नाम उपलब्ध नहीं — कार्यालय से पुष्टि करें"}</strong></div>
                {result.mobileNumber && <div><span className="block text-xs text-slate-500">ऑडिटर का मोबाइल नंबर</span><a href={`tel:${result.mobileNumber.replace(/[^+0-9]/g, "")}`} className="font-semibold text-[#17624d] underline underline-offset-4">{result.mobileNumber} (कॉल करें)</a></div>}
              </div>
            ))}
          </section>}
          <section className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-900">ऑडिटर संपर्क खोजें</h2>
            <p className="mt-2 text-sm text-slate-600">ऑडिटर का हिंदी या अंग्रेजी नाम (या नाम का एक हिस्सा) दर्ज करें। संबंधित संपर्क दिखाई देंगे।</p>
            <form onSubmit={searchContacts} className="mt-4 space-y-3">
              <label htmlFor="auditor-name" className="block text-sm font-bold text-slate-800">ऑडिटर का नाम</label>
              <input id="auditor-name" autoComplete="off" value={auditorName} onChange={e => setAuditorName(e.target.value)} placeholder="जैसे: कविता या KAVITA" maxLength={100} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-950" />
              <button type="submit" disabled={contactLoading} className="w-full rounded-xl bg-[#173f35] px-5 py-3 font-semibold text-white disabled:opacity-60">{contactLoading ? "खोज रहे हैं…" : "ऑडिटर का मोबाइल नंबर खोजें"}</button>
            </form>
            {contactMessage && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{contactMessage}</p>}
            {contacts.length > 0 && <div aria-live="polite" className="mt-5 space-y-3">
              <p className="text-sm font-bold text-emerald-900">{contacts.length} संपर्क मिले</p>
              {contacts.map((contact, index) => (
                <div key={index} className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="font-semibold text-slate-900">{contact.auditorName}</p>
                  {contact.designation && <p className="text-sm text-slate-600">{contact.designation}</p>}
                  <a href={`tel:${contact.mobileNumber.replace(/[^+0-9]/g, "")}`} className="inline-block font-semibold text-[#17624d] underline underline-offset-4" aria-label={`Call ${contact.auditorName}`}>{contact.mobileNumber} (कॉल करें)</a>
                </div>
              ))}
            </div>}
          </section>
          <p className="mt-7 text-xs leading-6 text-slate-500">सूचना: उपलब्ध आवंटन डेटा के अनुसार विवरण दिखाया जाता है। आधिकारिक पुष्टि के लिए मूल आवंटन आदेश देखें।</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
