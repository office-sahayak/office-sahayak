import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "ऑनलाइन ऑफिस टूल्स की हिन्दी मार्गदर्शिका — Office Sahayak",
  description: "PDF, Word, Excel, OCR, image और calculator tools सुरक्षित व सही तरीके से इस्तेमाल करने की विस्तृत हिन्दी guide।",
};

const sections = [
  {
    title: "File चुनने से पहले तैयारी",
    paragraphs: [
      "Conversion की quality source file से शुरू होती है। Scan सीधा, साफ़ और पर्याप्त resolution वाला रखें। Word document में A4 page size, margins, fonts और tables पहले ठीक करें। Excel workbook में print area, orientation, scaling और repeat headings save करें। इससे converter को अनुमान लगाने के बजाय document की असली settings मिलती हैं।",
      "Original file की एक backup copy हमेशा रखें। Output file को अलग नाम दें, जैसे report-final.pdf या register-compressed.pdf। केवल extension बदलने से format नहीं बदलता; सही converter का उपयोग आवश्यक है।",
    ],
  },
  {
    title: "PDF और Office conversion की जाँच",
    paragraphs: [
      "Word या Excel से PDF बनने के बाद केवल पहला page देखकर काम पूरा न मानें। सभी pages, विशेषकर table वाला page, page break, अंतिम total और footer देखें। Missing font से अक्षर बदल सकते हैं और Excel के दूर मौजूद किसी stray cell से अनावश्यक extra pages बन सकते हैं।",
      "PDF merge में files का क्रम और split में viewer page number जाँचें। Digital signature वाली PDF को edit, split या merge करने पर signature validation प्रभावित हो सकती है। महत्वपूर्ण कानूनी document की original signed copy अलग रखें।",
    ],
  },
  {
    title: "Hindi OCR और Kruti Dev output",
    paragraphs: [
      "OCR printed image को text में बदलता है, पर वह मानव proofreading का विकल्प नहीं है। हिन्दी संयुक्त अक्षर, पुराने fonts, धुंधली मुहर, handwritten note, तारीख और अंक में गलती की संभावना अधिक रहती है। Download से पहले preview में correction करें और बाद में Word file को मूल scan से line-by-line मिलाएँ।",
      "Kruti Dev 010 और DevLys 010 legacy fonts हैं। सही display और printing के लिए संबंधित font computer में installed होना चाहिए। Unicode text और legacy-font text का encoding अलग होता है; केवल font name बदलने से हमेशा सही conversion नहीं होता।",
    ],
  },
  {
    title: "Privacy और संवेदनशील दस्तावेज़",
    paragraphs: [
      "Browser-based tools file को आपके device पर process कर सकते हैं, जबकि Word/Excel जैसे कुछ conversions के लिए temporary server processing जरूरी हो सकती है। Aadhaar, PAN, bank statement, medical record या गोपनीय office file upload करने से पहले privacy policy पढ़ें और केवल आवश्यक pages ही उपयोग करें।",
      "Password, OTP, recovery code और bank PIN कभी किसी tool, chat या screenshot में साझा न करें। साझा computer पर काम करते समय Downloads folder साफ़ करें, browser बंद करें और confidential output को सुरक्षित location में रखें।",
    ],
  },
  {
    title: "Calculators और data lookup",
    paragraphs: [
      "EMI, GST, percentage और age tools तेज़ अनुमान देते हैं। Bank की fees, floating interest, tax classification, official cutoff date और rounding rules result बदल सकते हैं। इसलिए final financial, tax या eligibility निर्णय संबंधित official document से करें।",
      "IFSC खोजते समय bank और branch के साथ account holder तथा account number भी verify करें। बड़ी राशि भेजने से पहले beneficiary से details confirm करना और छोटा test transfer करना सुरक्षित अभ्यास है।",
    ],
  },
];

export default function GuidesPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-[#f8faf9]">
        <section className="relative overflow-hidden bg-[#f5f1e8]">
          <div className="hero-grid absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 lg:px-10 lg:py-18">
            <nav aria-label="Breadcrumb" className="text-sm font-semibold text-slate-500"><Link href="/" className="hover:text-[#173f35]">होम</Link><span className="mx-2">/</span><span className="text-slate-800">मार्गदर्शिका</span></nav>
            <h1 className="mt-7 text-4xl font-black tracking-tight text-[#132b25] sm:text-6xl">ऑनलाइन ऑफिस टूल्स का सही और सुरक्षित उपयोग</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">PDF, Word, Excel, OCR, image और calculator tools से भरोसेमंद result पाने के लिए यह practical हिन्दी guide पढ़ें।</p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <div className="space-y-6">
            {sections.map((section, index) => (
              <article key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#173f35] font-black text-white">{index + 1}</span>
                  <div>
                    <h2 className="text-2xl font-black text-[#173f35]">{section.title}</h2>
                    {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 leading-8 text-slate-600">{paragraph}</p>)}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <section className="mt-8 rounded-3xl bg-emerald-50 p-6 sm:p-8">
            <h2 className="text-2xl font-black text-[#173f35]">काम शुरू करने से पहले छोटी checklist</h2>
            <ul className="mt-4 grid gap-3 text-slate-700 sm:grid-cols-2">
              <li>• Original file की backup copy सुरक्षित है।</li>
              <li>• Page size, orientation और margins सही हैं।</li>
              <li>• नाम, तारीख, राशि और code मूल से मिलाए हैं।</li>
              <li>• Output सभी pages पर खोलकर देखा है।</li>
              <li>• Confidential file केवल जरूरत होने पर उपयोग की है।</li>
              <li>• संबंधित portal की size/format limit पढ़ी है।</li>
            </ul>
          </section>

          <div className="mt-8 text-center"><Link href="/#tools" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#173f35] px-7 py-3 font-bold text-white">सभी tools देखें</Link></div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
