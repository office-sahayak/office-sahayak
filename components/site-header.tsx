export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <a href="#top" className="flex items-center gap-3" aria-label="Office Sahayak home">
          <span className="grid size-10 place-items-center rounded-xl bg-[#173f35] text-lg font-black text-white shadow-sm">OS</span>
          <span className="leading-tight">
            <strong className="block text-base tracking-tight text-slate-950 sm:text-lg">Office Sahayak</strong>
            <span className="hidden text-xs font-medium text-slate-500 sm:block">काम आसान, हर दिन</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex" aria-label="मुख्य नेविगेशन">
          <a className="transition hover:text-[#173f35]" href="#categories">श्रेणियाँ</a>
          <a className="transition hover:text-[#173f35]" href="#tools">सभी टूल्स</a>
          <a className="transition hover:text-[#173f35]" href="#about">हमारे बारे में</a>
        </nav>

        <a href="#tools" className="rounded-full bg-[#e7f3ee] px-4 py-2 text-sm font-bold text-[#173f35] transition hover:bg-[#d6eae2]">
          टूल खोजें
        </a>
      </div>
    </header>
  );
}
