// Usage: node --experimental-strip-types scripts/prepare-jagrati-plots.mjs input.xlsx .env.jagrati
// Requires Python 3 with openpyxl. Generated data must stay outside version control.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { krutiDevToUnicode } from "../lib/tools/unicode-to-krutidev.ts";

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("Supply the input XLSX and a private output .env path.");
const source = JSON.parse(execFileSync("python3", ["-c", `
import sys,json,datetime,openpyxl
s=openpyxl.load_workbook(sys.argv[1],data_only=True).active
rows=[]
for cells in s.iter_rows(min_row=5,max_col=14):
 if not any(c.value is not None for c in cells):continue
 values=[]
 for c in cells:
  v=c.value
  if isinstance(v,(datetime.datetime,datetime.date)):v=v.strftime('%d-%m-%Y')
  elif v is None:v=''
  else:v=str(v)
  values.append({'value':v,'font':c.font.name or ''})
 rows.append({'sourceRow':cells[0].row,'cells':values})
print(json.dumps(rows,ensure_ascii=False))
`, input], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));

let maskedIds = 0;
let originalFontCells = 0;
const rows = source.map(row => {
  const legacyValues = {};
  const values = row.cells.map((cell, column) => {
    const legacy = /kruti|devlys/i.test(cell.font);
    // In this font sequence, pkS is चौ (the shared converter maps this alias to चै).
    let value = legacy ? krutiDevToUnicode(cell.value.replace(/pkS/g, "\uE000")).replace(/\uE000/g, "चौ").trim() : cell.value.trim();
    let original = cell.value.trim();
    // Preserve the remarks, but never publish a full Aadhaar number within them.
    value = value.replace(/(आधार[^\d]{0,70})((?:\d[ -]*){11}\d)(?!\d)/g, (match, label, number) => {
      maskedIds++;
      original = original.replace(number, legacy ? "¼vk/kkj uacj fNik;k x;k½" : "[आधार नंबर छिपाया गया]");
      return `${label}[आधार नंबर छिपाया गया]`;
    });
    // Keep malformed or unusual positional glyphs in the original font instead of guessing names.
    if (legacy && /[fZ]/.test(value)) { legacyValues[column] = original; originalFontCells++; }
    return value;
  });
  return { sourceRow: row.sourceRow, values, ...(Object.keys(legacyValues).length ? { legacyValues } : {}) };
});
if (!rows.length) throw new Error("Workbook contains no records.");
const encoded = gzipSync(Buffer.from(JSON.stringify({ version: 1, rows }))).toString("base64");
const chunks = encoded.match(/.{1,24000}/g);
if (chunks.length > 64) throw new Error("Dataset exceeds the supported size.");
const vars = [{ key: "JAGRATI_PLOT_DATA_CHUNKS", value: String(chunks.length) },
  ...chunks.map((value, i) => ({ key: `JAGRATI_PLOT_DATA_${i + 1}`, value }))];
writeFileSync(output, vars.map(item => `${item.key}=${item.value}`).join("\n") + "\n", { mode: 0o600 });
console.log(JSON.stringify({ records: rows.length, searchable: rows.filter(r => r.values[5]).length, columns: 14, chunks: chunks.length, encodedBytes: encoded.length, maskedIds, originalFontCells }));
