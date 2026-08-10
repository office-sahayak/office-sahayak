import Link from "next/link";

export function SiteFooter() {
  return (
    <footer id="about" className="bg-[#102b24] text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.2fr_0.8fr] lg:px-10">
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-white text-sm font-black text-[#173f35]">OS</span>
            <strong className="text-xl">Office Sahayak</strong>
          </div>
          <p className="mt-5 text-sm leading-7 text-white/65">
            रोज़मर्रा के कार्यालयीन कामों के लिए आसान हिन्दी टूल्स। हमारा उद्देश्य तकनीक को सरल बनाना है, ताकि आपका समय बचे और काम तेज़ हो।
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm md:justify-self-end">
          <div>
            <h2 className="font-extrabold text-white">टूल्स</h2>
            <div className="mt-4 space-y-3 text-white/60">
              <Link className="block hover:text-white" href="/#categories">श्रेणियाँ</Link>
              <Link className="block hover:text-white" href="/#tools">सभी टूल्स</Link>
            </div>
          </div>
          <div>
            <h2 className="font-extrabold text-white">जानकारी</h2>
            <div className="mt-4 space-y-3 text-white/60">
              <span className="block">हिन्दी सहायता</span>
              <span className="block">मुफ़्त उपयोग</span>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <span>© {new Date().getFullYear()} Office Sahayak</span>
          <span>भारत में उपयोगकर्ताओं के लिए सरलता से बनाया गया</span>
        </div>
      </div>
    </footer>
  );
}
