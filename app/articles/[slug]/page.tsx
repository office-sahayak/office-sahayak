import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentAdsenseScript } from "@/components/content-adsense-script";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { articles, getArticle } from "@/lib/articles";

export const dynamicParams = false;

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps<"/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};

  return {
    title: `${article.title} — Office Sahayak`,
    description: article.description,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
    },
  };
}

function hindiDate(date: string) {
  return new Intl.DateTimeFormat("hi-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

export default async function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = articles.filter((item) => item.slug !== article.slug).slice(0, 3);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://office-sahayak.onrender.com";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: `${siteUrl}/articles/${article.slug}`,
    author: { "@type": "Organization", name: "Office Sahayak संपादकीय टीम" },
    publisher: { "@type": "Organization", name: "Office Sahayak", url: siteUrl },
  };

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-[#f8faf9]">
        <header className="border-b border-slate-200 bg-[#f5f1e8]">
          <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
            <nav aria-label="Breadcrumb" className="text-sm font-semibold text-slate-500">
              <Link href="/" className="hover:text-[#173f35]">होम</Link>
              <span className="mx-2" aria-hidden="true">/</span>
              <Link href="/articles" className="hover:text-[#173f35]">सहायता लेख</Link>
              <span className="mx-2" aria-hidden="true">/</span>
              <span className="text-slate-800">{article.category}</span>
            </nav>
            <div className="mt-7 flex flex-wrap items-center gap-3 text-sm font-bold">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[#173f35]">{article.category}</span>
              <span className="text-slate-500">पढ़ने का समय: {article.readTime}</span>
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.04em] text-[#132b25] sm:text-6xl">{article.title}</h1>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-600">{article.intro}</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <span>लेखक: Office Sahayak संपादकीय टीम</span>
              <span>अंतिम अपडेट: {hindiDate(article.updatedAt)}</span>
            </div>
          </div>
        </header>

        <div className="mx-auto grid w-full max-w-5xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:px-10 lg:py-14">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
            <div className="rounded-2xl bg-emerald-50 p-5">
              <h2 className="text-xl font-black text-[#173f35]">इस लेख में</h2>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                {article.sections.map((section, index) => <li key={section.heading}>{index + 1}. {section.heading}</li>)}
              </ol>
            </div>

            <div className="mt-9 space-y-10">
              {article.sections.map((section, index) => (
                <section key={section.heading}>
                  <h2 className="text-2xl font-black tracking-tight text-[#173f35]">{index + 1}. {section.heading}</h2>
                  {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 leading-8 text-slate-700">{paragraph}</p>)}
                  {section.bullets ? <ul className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-5 text-slate-700">{section.bullets.map((bullet) => <li key={bullet} className="leading-7">• {bullet}</li>)}</ul> : null}
                </section>
              ))}
            </div>

            <section className="mt-10 rounded-2xl bg-[#f5f1e8] p-6">
              <h2 className="text-2xl font-black text-[#173f35]">अंतिम checklist</h2>
              <ul className="mt-4 space-y-3 text-slate-700">
                {article.checklist.map((item) => <li key={item} className="flex gap-3 leading-7"><span aria-hidden="true">✓</span><span>{item}</span></li>)}
              </ul>
            </section>

            <section className="mt-10">
              <h2 className="text-2xl font-black text-[#173f35]">अक्सर पूछे जाने वाले प्रश्न</h2>
              <div className="mt-4 space-y-4">
                {article.faqs.map((faq) => (
                  <div key={faq.question} className="rounded-2xl border border-slate-200 p-5">
                    <h3 className="font-extrabold text-slate-900">{faq.question}</h3>
                    <p className="mt-2 leading-7 text-slate-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            <aside className="mt-10 rounded-2xl bg-[#173f35] p-6 text-white">
              <h2 className="text-xl font-black">अब संबंधित काम करें</h2>
              <p className="mt-2 leading-7 text-white/75">पहले source और checklist तैयार करें, फिर tool चलाएँ और output की अंतिम जाँच जरूर करें।</p>
              <Link href={article.relatedTool.href} className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 font-bold text-[#173f35]">{article.relatedTool.label}</Link>
            </aside>

            <p className="mt-8 border-t border-slate-200 pt-5 text-sm leading-6 text-slate-500">यह लेख सामान्य जानकारी और workflow guidance देता है। बदलते नियम, शुल्क, eligibility या कानूनी/वित्तीय निर्णय के लिए संबंधित विभाग, संस्था या qualified professional के official निर्देश देखें।</p>
          </article>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-black text-[#173f35]">लेख की पारदर्शिता</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">लेखक, update date और correction process हमारी संपादकीय नीति में दिए गए हैं।</p>
              <Link href="/editorial-policy" className="mt-3 inline-flex text-sm font-bold text-[#b4552d] hover:underline">नीति पढ़ें →</Link>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-black text-[#173f35]">संबंधित लेख</h2>
              <div className="mt-3 space-y-4">
                {related.map((item) => <Link key={item.slug} href={`/articles/${item.slug}`} className="block text-sm font-semibold leading-6 text-slate-700 hover:text-[#b4552d]">{item.title}</Link>)}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
      <ContentAdsenseScript />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    </>
  );
}
