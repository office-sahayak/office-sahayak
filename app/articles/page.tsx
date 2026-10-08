import type { Metadata } from "next";
import Link from "next/link";
import { ContentAdsenseScript } from "@/components/content-adsense-script";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { articles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "ऑफिस और document काम के हिन्दी सहायता लेख — Office Sahayak",
  description: "Word, Excel, PDF, Hindi OCR, scanning, privacy और online calculator के सही उपयोग पर मूल और व्यावहारिक हिन्दी लेख।",
  alternates: { canonical: "/articles" },
};

export default function ArticlesPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-[#f8faf9]">
        <section className="relative overflow-hidden border-b border-slate-200 bg-[#f5f1e8]">
          <div className="hero-grid absolute inset-0 opacity-35" aria-hidden="true" />
          <div className="relative mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
            <nav aria-label="Breadcrumb" className="text-sm font-semibold text-slate-500">
              <Link href="/" className="hover:text-[#173f35]">होम</Link>
              <span className="mx-2" aria-hidden="true">/</span>
              <span className="text-slate-800">सहायता लेख</span>
            </nav>
            <p className="mt-7 text-sm font-extrabold uppercase tracking-[0.16em] text-[#b4552d]">Office Sahayak ज्ञान केंद्र</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.04em] text-[#132b25] sm:text-6xl">काम करने से पहले सही तरीका समझें</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">ये लेख केवल tool चलाने के चरण नहीं बताते। इनमें source file की तैयारी, common errors, privacy, verification और official submission से पहले की जाँच समझाई गई है।</p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article key={article.slug} className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between gap-3 text-xs font-bold">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[#173f35]">{article.category}</span>
                  <span className="text-slate-400">{article.readTime}</span>
                </div>
                <h2 className="mt-5 text-2xl font-black leading-tight text-[#173f35]">
                  <Link href={`/articles/${article.slug}`} className="hover:underline">{article.title}</Link>
                </h2>
                <p className="mt-4 flex-1 leading-7 text-slate-600">{article.description}</p>
                <Link href={`/articles/${article.slug}`} className="mt-6 inline-flex font-extrabold text-[#b4552d] hover:underline">पूरा लेख पढ़ें →</Link>
              </article>
            ))}
          </div>

          <aside className="mt-10 rounded-3xl bg-[#173f35] p-7 text-white sm:p-9">
            <h2 className="text-2xl font-black">हमारे लेख कैसे तैयार होते हैं</h2>
            <p className="mt-3 max-w-4xl leading-8 text-white/75">हर लेख सामान्य office workflow और tool के वास्तविक उपयोग में आने वाली समस्याओं पर लिखा गया है। जहाँ नियम, rate या eligibility बदल सकती है वहाँ official source से अंतिम सत्यापन की सलाह दी गई है। गलती मिले तो संपर्क page से correction भेज सकते हैं।</p>
            <Link href="/editorial-policy" className="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 font-bold text-[#173f35]">संपादकीय नीति पढ़ें</Link>
          </aside>
        </section>
      </main>
      <SiteFooter />
      <ContentAdsenseScript />
    </>
  );
}
