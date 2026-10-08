import Link from "next/link";
import { articles } from "@/lib/articles";

export function HomeEditorialContent() {
  const featuredArticles = articles.slice(0, 3);

  return (
    <section className="bg-[#eef4f1]">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-18">
        <div className="max-w-3xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#b4552d]">Office Sahayak क्यों</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#132b25] sm:text-4xl">रोज़मर्रा के digital office काम की स्पष्ट हिन्दी मदद</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            केवल button देना पर्याप्त नहीं है। हर tool page पर उपयोग की प्रक्रिया, सही input की जानकारी, practical सावधानियाँ और सामान्य सवालों के उत्तर भी दिए गए हैं, ताकि आप file बनाते समय गलती पहचान सकें।
          </p>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          <article className="rounded-3xl border border-white bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black text-[#173f35]">Document conversion</h3>
            <p className="mt-3 leading-7 text-slate-600">Word और Excel को PDF बनाने से पहले page size, fonts, print area और tables कैसे जाँचें—हर converter के नीचे step-by-step guidance उपलब्ध है।</p>
          </article>
          <article className="rounded-3xl border border-white bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black text-[#173f35]">Privacy को प्राथमिकता</h3>
            <p className="mt-3 leading-7 text-slate-600">PDF merge, split और कई image/text tools browser में काम करते हैं। Server-based conversion जहाँ जरूरी है, उसकी जानकारी privacy policy में स्पष्ट दी गई है।</p>
          </article>
          <article className="rounded-3xl border border-white bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black text-[#173f35]">Result की अंतिम जाँच</h3>
            <p className="mt-3 leading-7 text-slate-600">OCR और calculations सहायक परिणाम देते हैं। नाम, राशि, तारीख, IFSC और official eligibility जैसे महत्वपूर्ण data को मूल स्रोत से मिलाना हमेशा जरूरी है।</p>
          </article>
        </div>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#b4552d]">नए सहायता लेख</p>
            <h3 className="mt-2 text-3xl font-black tracking-tight text-[#132b25]">काम शुरू करने से पहले पूरी जानकारी</h3>
          </div>
          <Link href="/articles" className="font-extrabold text-[#173f35] hover:underline">सभी लेख देखें →</Link>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {featuredArticles.map((article) => (
            <article key={article.slug} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#b4552d]">{article.category} · {article.readTime}</p>
              <h3 className="mt-3 text-xl font-black leading-tight text-[#173f35]">{article.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{article.description}</p>
              <Link href={`/articles/${article.slug}`} className="mt-5 inline-flex font-extrabold text-[#173f35] hover:underline">लेख पढ़ें →</Link>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-3xl bg-[#173f35] p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h3 className="text-2xl font-black">पहली बार online office tools इस्तेमाल कर रहे हैं?</h3>
            <p className="mt-2 max-w-2xl leading-7 text-white/75">File तैयार करने, privacy समझने और सही tool चुनने की विस्तृत हिन्दी guide पढ़ें।</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/articles" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 font-bold text-[#173f35]">सहायता लेख पढ़ें</Link>
            <Link href="/guides" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-6 py-3 font-bold text-white">छोटी मार्गदर्शिका</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
