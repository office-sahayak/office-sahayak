/** Column positions follow the source workbook: A–N; F is the plot number. */
export const plotFields = [
  "क्रमांक", "विक्रेता का नाम", "भूखंडधारी का नाम", "पता",
  "मूल सदस्य का सदस्यता क्रमांक (रजिस्ट्री अनुसार)", "भूखंड क्रमांक",
  "क्षेत्रफल (वर्गफीट)", "मूल सदस्य का रजिस्ट्री क्रमांक व दिनांक",
  "मूल सदस्य की रजिस्ट्री प्रमाणित / अप्रमाणित", "क्रेता सदस्य का रजिस्ट्री क्रमांक",
  "रजिस्ट्री दिनांक", "रजिस्ट्री प्रमाणित / अप्रमाणित", "रिमार्क", "अतिरिक्त रिमार्क",
] as const;

export type PlotRecord = { sourceRow: number; values: string[]; legacyValues?: Record<string, string> };
export type PlotData = { version: 1; rows: PlotRecord[] };

export function normalizePlotNumber(value: string) {
  return value.normalize("NFKC").trim().toUpperCase()
    .replace(/[०-९]/g, digit => String("०१२३४५६७८९".indexOf(digit)))
    .replace(/[‐‑‒–—−]/g, "-")
    .replace(/\bSECTOR\b/g, "SEC")
    .replace(/\bINFORMAL\b/g, "INFARMAL")
    .replace(/[\s.()\-]+/g, "")
    .replace(/\d+/g, digits => digits.replace(/^0+(?=\d)/, ""));
}

export function validPlotQuery(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 64
    && /^[\p{L}\p{N}\s/().‐‑‒–—−-]+$/u.test(value)
    && /[0-9]/.test(normalizePlotNumber(value));
}

export function findPlotRecords(rows: PlotRecord[], query: string) {
  const key = normalizePlotNumber(query);
  if (!key) return [];
  return rows.filter(row => row.values[5].trim() && normalizePlotNumber(row.values[5]) === key);
}
