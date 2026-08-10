"use client";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xl text-slate-400" aria-hidden="true">⌕</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="जैसे PDF मर्ज, EMI या QR कोड..."
        aria-label="टूल खोजें"
        className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white py-4 pl-13 pr-24 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#2f6a59] focus:ring-4 focus:ring-[#2f6a59]/10"
      />
      {value ? (
        <button type="button" onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200">
          साफ़ करें
        </button>
      ) : (
        <span className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-400 sm:block">24 टूल्स</span>
      )}
    </div>
  );
}
