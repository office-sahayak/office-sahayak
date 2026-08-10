const popularTasks = [
  { icon: "📎", label: "PDF मर्ज", tone: "bg-rose-50" },
  { icon: "🧮", label: "EMI कैलकुलेटर", tone: "bg-amber-50" },
  { icon: "📝", label: "शब्द गिनती", tone: "bg-sky-50" },
];

export function HeroSection() {
  return (
    <section id="top" className="relative overflow-hidden bg-[#f5f1e8]">
      <div className="hero-grid absolute inset-0 opacity-45" aria-hidden="true" />
      <div className="absolute -left-20 top-16 size-64 rounded-full bg-[#dcebe4] blur-3xl" aria-hidden="true" />
      <div className="absolute -right-16 bottom-0 size-72 rounded-full bg-[#f3d7a8]/60 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-[590px] w-full max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-24">
        <div className="max-w-3xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#173f35]/15 bg-white/75 px-4 py-2 text-sm font-bold text-[#173f35] shadow-sm">
            <span className="size-2 rounded-full bg-[#d97706]" /> हिन्दी में आसान ऑनलाइन टूल्स
          </div>
          <h1 className="text-balance text-5xl font-black leading-[1.08] tracking-[-0.045em] text-[#132b25] sm:text-6xl lg:text-7xl">
            ऑफिस का काम,<span className="mt-2 block text-[#b4552d]">अब बिना उलझन।</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            PDF, दस्तावेज़, गणना और रोज़मर्रा के सरकारी कामों के लिए सरल, भरोसेमंद और मुफ़्त टूल्स—एक ही जगह।
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#tools" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#173f35] px-6 py-3 font-bold text-white shadow-lg shadow-[#173f35]/15 transition hover:-translate-y-0.5 hover:bg-[#0f3028]">
              अभी टूल खोजें <span aria-hidden="true">↓</span>
            </a>
            <a href="#categories" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white/70 px-6 py-3 font-bold text-slate-700 transition hover:border-slate-400 hover:bg-white">
              सभी श्रेणियाँ देखें
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:mr-0">
          <div className="absolute -inset-3 rotate-3 rounded-[2rem] border border-[#173f35]/10 bg-[#dfeae5]" aria-hidden="true" />
          <div className="relative rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-2xl shadow-[#173f35]/10 backdrop-blur sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#b4552d]">त्वरित शुरुआत</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">लोकप्रिय कार्य</h2>
              </div>
              <span className="grid size-11 place-items-center rounded-full bg-[#173f35] text-xl text-white" aria-hidden="true">✦</span>
            </div>
            <div className="mt-6 space-y-3">
              {popularTasks.map((task, index) => (
                <div key={task.label} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                  <span className={`grid size-12 place-items-center rounded-xl text-xl ${task.tone}`} aria-hidden="true">{task.icon}</span>
                  <span className="flex-1 font-bold text-slate-800">{task.label}</span>
                  <span className="grid size-8 place-items-center rounded-full bg-slate-50 text-sm font-bold text-slate-400" aria-hidden="true">{index + 1}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-[#173f35] px-5 py-4 text-white">
              <p className="text-sm font-semibold text-white/70">जल्द उपलब्ध</p>
              <p className="mt-1 font-bold">25 उपयोगी टूल्स की पूरी लाइब्रेरी</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
