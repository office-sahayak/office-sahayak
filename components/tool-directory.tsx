"use client";

import { useMemo, useState } from "react";
import type { CategoryId, Tool, ToolCategory } from "@/lib/tools";
import { CategoryCard } from "./category-card";
import { SearchBox } from "./search-box";
import { ToolCard } from "./tool-card";

interface ToolDirectoryProps {
  categories: ToolCategory[];
  tools: Tool[];
}

export function ToolDirectory({ categories, tools }: ToolDirectoryProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">("all");

  const filteredTools = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("hi");

    return tools.filter((tool) => {
      const matchesCategory = activeCategory === "all" || tool.category === activeCategory;
      const searchableText = [tool.name, tool.description, ...(tool.keywords ?? [])]
        .join(" ")
        .toLocaleLowerCase("hi");
      return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [activeCategory, query, tools]);

  return (
    <section id="tools" className="bg-[#f8faf9] py-20 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#b4552d]">टूल डायरेक्टरी</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">काम के अनुसार टूल चुनें</h2>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">नाम लिखकर खोजें या नीचे दी गई श्रेणी चुनें।</p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <SearchBox value={query} onChange={setQuery} />
        </div>

        <div id="categories" className="mt-12 scroll-mt-28">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-500">श्रेणियाँ</h3>
            <button type="button" onClick={() => setActiveCategory("all")} className={`rounded-full px-4 py-2 text-sm font-bold transition ${activeCategory === "all" ? "bg-[#173f35] text-white" : "bg-white text-slate-600 shadow-sm hover:bg-slate-100"}`}>
              सभी ({tools.length})
            </button>
          </div>
          <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                count={tools.filter((tool) => tool.category === category.id).length}
                active={activeCategory === category.id}
                onSelect={setActiveCategory}
              />
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-end justify-between gap-5">
          <div>
            <p className="text-sm font-bold text-[#2f6a59]">{filteredTools.length} परिणाम</p>
            <h3 className="mt-1 text-2xl font-black text-slate-900">उपलब्ध और आगामी टूल्स</h3>
          </div>
          {(query || activeCategory !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCategory("all");
              }}
              className="text-sm font-bold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
            >
              फ़िल्टर हटाएँ
            </button>
          )}
        </div>

        {filteredTools.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTools.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <span className="text-4xl" aria-hidden="true">🔎</span>
            <h3 className="mt-4 text-xl font-black text-slate-900">कोई टूल नहीं मिला</h3>
            <p className="mt-2 text-slate-500">दूसरा नाम लिखें या सभी श्रेणियाँ देखें।</p>
          </div>
        )}
      </div>
    </section>
  );
}
