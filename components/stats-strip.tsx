const stats = [
  { value: "24", label: "उपयोगी टूल्स" },
  { value: "6", label: "सरल श्रेणियाँ" },
  { value: "100%", label: "हिन्दी-अनुकूल" },
];

export function StatsStrip() {
  return (
    <section className="border-y border-slate-200 bg-white" aria-label="Office Sahayak की विशेषताएँ">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-3 px-5 sm:px-8 lg:px-10">
        {stats.map((stat, index) => (
          <div key={stat.label} className={`py-6 text-center sm:py-8 ${index > 0 ? "border-l border-slate-200" : ""}`}>
            <strong className="block text-2xl font-black text-[#173f35] sm:text-3xl">{stat.value}</strong>
            <span className="mt-1 block text-xs font-semibold text-slate-500 sm:text-sm">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
