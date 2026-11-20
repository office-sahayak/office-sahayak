import test from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { findPlotRecords, normalizePlotNumber, validPlotQuery, plotFields } from "../lib/jagrati-plots.ts";
import { getJagratiPlotData } from "../lib/server/jagrati-plot-data.ts";

function record(sourceRow, plot) {
  const values = Array(14).fill(""); values[5] = plot;
  return { sourceRow, values };
}

test("matches all duplicate rows without matching numeric prefixes or other fields", () => {
  const rows = [record(5, "131"), record(6, "131"), record(7, "1310"), record(8, "13"), record(9, "")];
  rows[4].values[4] = "131";
  assert.deepEqual(findPlotRecords(rows, "१३१").map(r => r.sourceRow), [5, 6]);
  assert.deepEqual(findPlotRecords(rows, ""), []);
  assert.deepEqual(findPlotRecords(rows, "999"), []);
});

test("normalizes letters, separators and Hindi digits while keeping sectors and slashes distinct", () => {
  for (const value of ["9-A", "9 A", "9a", "००९–A", "9(A)"]) assert.equal(normalizePlotNumber(value), "9A");
  assert.equal(normalizePlotNumber("65 A Sector C"), normalizePlotNumber("65 A Sec-C"));
  assert.equal(normalizePlotNumber("18 Informal"), normalizePlotNumber("18 INFARMAL"));
  assert.notEqual(normalizePlotNumber("26A/532"), normalizePlotNumber("26A532"));
  assert.notEqual(normalizePlotNumber("9"), normalizePlotNumber("9-A"));
  assert.notEqual(normalizePlotNumber("65A"), normalizePlotNumber("65A Sec-C"));
  assert.equal(findPlotRecords([record(5,"0")], "०").length, 1);
});

test("rejects invalid input and keeps every workbook column", () => {
  for (const value of [null, {}, [], "", " ", "ABC", "*", "<script>1</script>", "1".repeat(65)]) assert.equal(validPlotQuery(value), false);
  for (const value of ["131", "९-A", "26A/532", "18 INFARMAL"]) assert.equal(validPlotQuery(value), true);
  assert.equal(plotFields.length, 14);
});

test("server data requires complete valid chunks and invalidates its cache after updates", () => {
  const saved = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith("JAGRATI_PLOT_DATA_")));
  const keys = () => Object.keys(process.env).filter(key => key.startsWith("JAGRATI_PLOT_DATA_"));
  function set(data) {
    keys().forEach(key => delete process.env[key]);
    const encoded = gzipSync(Buffer.from(JSON.stringify(data))).toString("base64");
    process.env.JAGRATI_PLOT_DATA_CHUNKS = "2";
    process.env.JAGRATI_PLOT_DATA_1 = encoded.slice(0, 30);
    process.env.JAGRATI_PLOT_DATA_2 = encoded.slice(30);
  }
  try {
    set({ version: 1, rows: [record(5, "131")] });
    assert.equal(getJagratiPlotData().rows[0].values[5], "131");
    set({ version: 1, rows: [record(5, "132")] });
    assert.equal(getJagratiPlotData().rows[0].values[5], "132");
    delete process.env.JAGRATI_PLOT_DATA_2;
    assert.equal(getJagratiPlotData(), null);
    set({ version: 1, rows: [record(5, "1"), record(5, "2")] });
    assert.equal(getJagratiPlotData(), null);
    set({ version: 1, rows: [{ sourceRow: 5, values: ["1"] }] });
    assert.equal(getJagratiPlotData(), null);
  } finally {
    keys().forEach(key => delete process.env[key]);
    Object.assign(process.env, saved);
  }
});
