import { gunzipSync } from "node:zlib";
import type { PlotData } from "../jagrati-plots";

let cached: PlotData | null = null;
let cachedEncoded = "";

/** Stored on the server, separate from the audit dataset and public assets. */
export function getJagratiPlotData(): PlotData | null {
  const count = Number(process.env.JAGRATI_PLOT_DATA_CHUNKS);
  if (!Number.isInteger(count) || count < 1 || count > 64) return null;
  const chunks = Array.from({ length: count }, (_, i) => process.env[`JAGRATI_PLOT_DATA_${i + 1}`]);
  if (chunks.some(chunk => !chunk)) return null;
  const encoded = chunks.join("");
  if (cached && cachedEncoded === encoded) return cached;
  try {
    const data: unknown = JSON.parse(gunzipSync(Buffer.from(encoded, "base64"), { maxOutputLength: 16 * 1024 * 1024 }).toString("utf8"));
    if (!data || typeof data !== "object") return null;
    const candidate = data as PlotData;
    if (candidate.version !== 1 || !Array.isArray(candidate.rows) || !candidate.rows.length
      || !candidate.rows.every(row => row && Number.isInteger(row.sourceRow) && row.sourceRow >= 5
        && Array.isArray(row.values) && row.values.length === 14 && row.values.every(value => typeof value === "string")
        && (!row.legacyValues || (typeof row.legacyValues === "object" && !Array.isArray(row.legacyValues)
          && Object.entries(row.legacyValues).every(([key, value]) => /^(?:[0-9]|1[0-3])$/.test(key) && typeof value === "string"))))) return null;
    if (new Set(candidate.rows.map(row => row.sourceRow)).size !== candidate.rows.length) return null;
    cached = candidate;
    cachedEncoded = encoded;
    return cached;
  } catch {
    return null;
  }
}
