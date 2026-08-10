import type { ToolCategory } from "@/lib/tools";

interface CategoryCardProps {
  category: ToolCategory;
  count: number;
  active: boolean;
  onSelect: (id: ToolCategory["id"]) => void;
}

export function CategoryCard({ category, count, active, onSelect }: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      aria-pressed={active}
      className={`group min-w-[175px] flex-1 rounded-2xl border p-4 text-left transition sm:min-w-0 ${
        active
          ? "border-[#2f6a59] bg-[#edf5f1] shadow-sm"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-slate-50 text-xl shadow-inner" aria-hidden="true">
          {category.icon}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${active ? "bg-[#173f35] text-white" : "bg-slate-100 text-slate-500"}`}>
          {count}
        </span>
      </span>
      <strong className="mt-4 block text-base text-slate-900">{category.name}</strong>
      <span className="mt-1 block text-xs leading-5 text-slate-500">{category.description}</span>
    </button>
  );
}
