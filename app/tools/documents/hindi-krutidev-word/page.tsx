import type { Metadata } from "next";
import Link from "next/link";
import { HindiKrutidevWorkspace } from "@/components/hindi-krutidev-workspace";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Hindi PDF/Image से Kruti Dev Word — Office Sahayak",
  description: "Hindi PDF, JPG या PNG से OCR करके editable Kruti Dev 010 Word और original-layout Word file बनाएँ।",
};

export default function HindiKrutidevWordPage() {
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
              <span className="text-slate-800">Hindi से Kruti Dev Word</span>
            </nav>
            <div className="mt-8 max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#173f35]/15 bg-white/75 px-4 py-2 text-sm font-bold text-[#173f35] shadow-sm">
                <span aria-hidden="true">🔤</span> Browser OCR • MeshAPI खर्च ₹0
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-[-0.04em] text-[#132b25] sm:text-6xl">Hindi PDF/Image से<br className="hidden sm:block" /> Kruti Dev Word</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                Scanned Hindi PDF या फोटो से text पहचानें, गलती सुधारें और editable Kruti Dev 010 Word के साथ original-layout Word भी पाएँ।
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
          <HindiKrutidevWorkspace />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
