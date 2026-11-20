import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JagratiAccess } from "@/components/jagrati-access";

export const metadata: Metadata = {
  title: "जागृति — भूखंड की जानकारी | Office Sahayak",
  description: "जागृति गृह निर्माण सहकारी संस्था मर्यादित, इन्दौर के भूखंड का विवरण खोजें।",
  robots: { index: false, follow: false },
};

export default function JagratiPlotPage() {
  return <div className="jagrati-page flex min-h-screen flex-col">
    <div className="print:hidden"><SiteHeader /></div>
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-14 print:p-0">
      <div className="mb-8 print:mb-4">
        <p className="text-sm font-bold text-[#17624d]">जागृति गृह निर्माण सहकारी संस्था मर्यादित, इन्दौर</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-snug tracking-tight text-slate-950 sm:text-4xl">भूखंड की जानकारी खोजें</h1>
        <p className="mt-3 text-base leading-7 text-slate-600 print:hidden">भूखंड क्रमांक लिखें और सदस्य, रजिस्ट्री व अन्य विवरण एक जगह देखें।</p>
      </div>
      <JagratiAccess />
    </main>
    <div className="print:hidden"><SiteFooter /></div>
  </div>;
}
