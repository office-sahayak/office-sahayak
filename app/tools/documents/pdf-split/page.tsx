import type { Metadata } from "next";
import Link from "next/link";
import { PdfSplitWorkspace } from "@/components/pdf-split-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "PDF स्प्लिट — Office Sahayak",
  description: "PDF से चुने हुए pages निकालें या हर page की अलग PDF बनाएँ। सारी processing आपके browser में होती है।",
};

export default function PdfSplitPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-[#f8faf9]">
        <section className="relative overflow-hidden bg-[#f5f1e8]">
          <div className="hero-grid absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-18 lg:px-10">
            <nav aria-label="Breadcrumb" className="text-sm font-semibold text-slate-500">
              <Link href="/" className="hover:text-[#173f35]">होम</Link>
              <span className="mx-2" aria-hidden="true">/</span>
              <span className="text-slate-800">PDF स्प्लिट</span>
            </nav>
            <div className="mt-8 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#173f35]/15 bg-white/75 px-4 py-2 text-sm font-bold text-[#173f35] shadow-sm">
                <span aria-hidden="true">✂️</span> मुफ़्त • सुरक्षित • बिना upload
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-[-0.04em] text-[#132b25] sm:text-6xl">PDF स्प्लिट करें</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                PDF से ज़रूरी pages निकालें या हर page की अलग PDF बनाएँ—बिना registration और बिना server upload के।
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
          <PdfSplitWorkspace />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
