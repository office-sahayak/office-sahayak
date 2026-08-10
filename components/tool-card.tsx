import Link from "next/link";
import type { Tool } from "@/lib/tools";

interface ToolCardProps {
  tool: Tool;
}

const categoryTone: Record<Tool["category"], string> = {
  documents: "bg-rose-50 text-rose-700",
  text: "bg-sky-50 text-sky-700",
  image: "bg-violet-50 text-violet-700",
  calculators: "bg-amber-50 text-amber-700",
  government: "bg-emerald-50 text-emerald-700",
  utilities: "bg-slate-100 text-slate-700",
};

export function ToolCard({ tool }: ToolCardProps) {
  const available = tool.status === "available";
  const cardClassName = "group flex min-h-52 flex-col rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60";

  const cardContent = (
    <>
      <div className="flex items-start justify-between gap-4">
        <span className={`grid size-12 place-items-center rounded-2xl text-2xl ${categoryTone[tool.category]}`} aria-hidden="true">
          {tool.icon}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${available ? "bg-[#dff4e9] text-[#17603f]" : "bg-slate-100 text-slate-500"}`}>
          {available ? "उपलब्ध" : "जल्द आएगा"}
        </span>
      </div>
      <h3 className="mt-5 text-lg font-extrabold text-slate-900">{tool.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{tool.description}</p>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className={`text-sm font-bold ${available ? "text-[#22604f]" : "text-slate-400"}`}>
          {available ? "टूल देखें" : "तैयार हो रहा है"}
        </span>
        <span className={`grid size-8 place-items-center rounded-full transition ${available ? "bg-[#173f35] text-white group-hover:translate-x-0.5" : "bg-slate-100 text-slate-400"}`} aria-hidden="true">→</span>
      </div>
    </>
  );

  if (available) {
    return (
      <Link
        href={`/tools/${tool.category}/${tool.slug}`}
        className={cardClassName}
        aria-label={`${tool.name} खोलें`}
      >
        {cardContent}
      </Link>
    );
  }

  return <article className={cardClassName}>{cardContent}</article>;
}
