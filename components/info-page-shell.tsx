import type { ReactNode } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

interface InfoPageShellProps {
  title: string;
  intro: string;
  updated?: string;
  children: ReactNode;
}

export function InfoPageShell({ title, intro, updated = "6 सितंबर 2026", children }: InfoPageShellProps) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-[#f8faf9]">
        <section className="border-b border-slate-200 bg-[#f5f1e8]">
          <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
            <nav aria-label="Breadcrumb" className="text-sm font-semibold text-slate-500">
              <Link href="/" className="hover:text-[#173f35]">होम</Link>
              <span className="mx-2" aria-hidden="true">/</span>
              <span className="text-slate-800">{title}</span>
            </nav>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.035em] text-[#132b25] sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{intro}</p>
            <p className="mt-4 text-sm text-slate-500">अंतिम अपडेट: {updated}</p>
          </div>
        </section>
        <section className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
          <article className="space-y-8 rounded-3xl border border-slate-200 bg-white p-6 text-base leading-8 text-slate-700 shadow-sm sm:p-10 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-[#173f35] [&_h3]:text-lg [&_h3]:font-extrabold [&_h3]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
            {children}
          </article>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
