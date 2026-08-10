"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";

const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_SEPARATE_PAGES = 100;

type SplitMode = "extract" | "separate";

interface ParsedRange {
  indices: number[];
  error: string | null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parsePageRanges(value: string, pageCount: number): ParsedRange {
  if (!value.trim()) return { indices: [], error: "कम से कम एक page number लिखें।" };

  const result: number[] = [];
  const seen = new Set<number>();

  for (const rawToken of value.split(",")) {
    const token = rawToken.trim();
    const match = token.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) {
      return { indices: [], error: `“${token || "खाली"}” सही page format नहीं है।` };
    }

    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    if (start < 1 || end < 1 || start > pageCount || end > pageCount) {
      return { indices: [], error: `Page 1 से ${pageCount} के बीच चुनें।` };
    }
    if (start > end) {
      return { indices: [], error: `Range “${token}” में पहला page छोटा होना चाहिए।` };
    }

    for (let page = start; page <= end; page += 1) {
      const index = page - 1;
      if (!seen.has(index)) {
        result.push(index);
        seen.add(index);
      }
    }
  }

  return { indices: result, error: null };
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PdfSplitWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState<SplitMode>("extract");
  const [ranges, setRanges] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedRange = useMemo(
    () => (pageCount ? parsePageRanges(ranges, pageCount) : { indices: [], error: null }),
    [pageCount, ranges],
  );

  async function selectFile(selected: File) {
    setError(null);
    setMessage(null);

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("केवल PDF file चुनें।");
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setError("PDF का आकार 100 MB से कम रखें।");
      return;
    }

    setIsWorking(true);
    try {
      const document = await PDFDocument.load(await selected.arrayBuffer());
      const count = document.getPageCount();
      if (!count) throw new Error("इस PDF में कोई page नहीं मिला।");

      setFile(selected);
      setPageCount(count);
      setRanges(`1-${Math.min(3, count)}`);
      setMode("extract");
      setMessage(`${count} pages की PDF तैयार है।`);
    } catch (caughtError) {
      setFile(null);
      setPageCount(0);
      setRanges("");
      setError(
        caughtError instanceof Error && caughtError.message === "इस PDF में कोई page नहीं मिला।"
          ? caughtError.message
          : "PDF खुल नहीं सकी। यह password-protected या damaged हो सकती है।",
      );
    } finally {
      setIsWorking(false);
    }
  }

  function resetFile() {
    setFile(null);
    setPageCount(0);
    setRanges("");
    setMessage(null);
    setError(null);
  }

  async function extractPages() {
    if (!file || parsedRange.error || !parsedRange.indices.length) {
      setError(parsedRange.error ?? "पहले PDF और pages चुनें।");
      return;
    }

    setIsWorking(true);
    setError(null);
    setMessage("चुने हुए pages तैयार हो रहे हैं…");

    try {
      const source = await PDFDocument.load(await file.arrayBuffer());
      const output = await PDFDocument.create();
      const pages = await output.copyPages(source, parsedRange.indices);
      pages.forEach((page) => output.addPage(page));
      const bytes = await output.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      downloadBlob(blob, `office-sahayak-pages-${ranges.replace(/\s+/g, "")}.pdf`);
      setMessage(`${pages.length} चुने हुए pages की PDF download हो गई।`);
    } catch {
      setMessage(null);
      setError("Pages निकालते समय समस्या आई। PDF बदलकर दोबारा प्रयास करें।");
    } finally {
      setIsWorking(false);
    }
  }

  async function splitEveryPage() {
    if (!file) {
      setError("पहले PDF file चुनें।");
      return;
    }
    if (pageCount > MAX_SEPARATE_PAGES) {
      setError(`अलग-अलग PDF mode में अधिकतम ${MAX_SEPARATE_PAGES} pages की PDF इस्तेमाल करें।`);
      return;
    }

    setIsWorking(true);
    setError(null);
    setMessage("अलग-अलग PDFs तैयार हो रही हैं…");

    try {
      const source = await PDFDocument.load(await file.arrayBuffer());
      const zip = new JSZip();
      const digits = String(pageCount).length;

      for (let index = 0; index < pageCount; index += 1) {
        setMessage(`Page ${index + 1}/${pageCount} तैयार हो रहा है…`);
        const output = await PDFDocument.create();
        const [page] = await output.copyPages(source, [index]);
        output.addPage(page);
        const bytes = await output.save();
        zip.file(`page-${String(index + 1).padStart(digits, "0")}.pdf`, bytes);
      }

      setMessage("ZIP file तैयार हो रही है…");
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      downloadBlob(blob, "office-sahayak-split-pages.zip");
      setMessage(`${pageCount} अलग PDFs की ZIP download हो गई।`);
    } catch {
      setMessage(null);
      setError("PDF को अलग करते समय समस्या आई। दोबारा प्रयास करें।");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        {!file ? (
          <div
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (event.currentTarget === event.target) setIsDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              const droppedFiles = Array.from(event.dataTransfer.files);
              if (droppedFiles.length !== 1) {
                setError("एक बार में केवल एक PDF चुनें।");
                return;
              }
              void selectFile(droppedFiles[0]);
            }}
            className={`rounded-3xl border-2 border-dashed px-6 py-14 text-center transition sm:py-18 ${
              isDragging ? "border-[#2f6a59] bg-[#eaf4ef]" : "border-slate-300 bg-[#f8faf9] hover:border-[#7aa596]"
            }`}
          >
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-sky-50 text-3xl" aria-hidden="true">✂️</span>
            <h2 className="mt-5 text-2xl font-black text-slate-950">एक PDF file चुनें</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">PDF को यहाँ drop करें या अपने कंप्यूटर से चुनें।</p>
            <label htmlFor="split-pdf-file" className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-full bg-[#173f35] px-6 py-3 font-bold text-white shadow-lg shadow-[#173f35]/15 transition hover:-translate-y-0.5 hover:bg-[#0f3028]">
              PDF चुनें
            </label>
            <input
              id="split-pdf-file"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={isWorking}
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) void selectFile(selected);
                event.target.value = "";
              }}
            />
            <p className="mt-4 text-xs font-medium text-slate-400">एक PDF • अधिकतम 100 MB</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-[#f8faf9] p-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-sky-50 text-2xl" aria-hidden="true">📘</span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-slate-950">{file.name}</strong>
                <span className="mt-1 block text-xs font-semibold text-slate-500">{pageCount} pages • {formatBytes(file.size)}</span>
              </span>
              <button type="button" onClick={resetFile} disabled={isWorking} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:text-rose-700 disabled:opacity-50">बदलें</button>
            </div>

            <div className="mt-8">
              <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#b4552d]">Split तरीका</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">आप क्या बनाना चाहते हैं?</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("extract");
                    setError(null);
                    setMessage(null);
                  }}
                  aria-pressed={mode === "extract"}
                  className={`rounded-2xl border p-5 text-left transition ${mode === "extract" ? "border-[#2f6a59] bg-[#edf5f1] shadow-sm" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <span className="text-2xl" aria-hidden="true">📑</span>
                  <strong className="mt-3 block text-slate-950">चुने हुए pages</strong>
                  <span className="mt-1 block text-sm leading-6 text-slate-500">Pages चुनकर एक नई PDF बनाएँ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("separate");
                    setError(null);
                    setMessage(null);
                  }}
                  aria-pressed={mode === "separate"}
                  className={`rounded-2xl border p-5 text-left transition ${mode === "separate" ? "border-[#2f6a59] bg-[#edf5f1] shadow-sm" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <span className="text-2xl" aria-hidden="true">🗂️</span>
                  <strong className="mt-3 block text-slate-950">हर page अलग</strong>
                  <span className="mt-1 block text-sm leading-6 text-slate-500">हर page की PDF बनाकर ZIP पाएँ</span>
                </button>
              </div>
            </div>

            {mode === "extract" ? (
              <div className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
                <label htmlFor="page-ranges" className="block text-base font-black text-slate-950">कौन-से pages चाहिए?</label>
                <p className="mt-1 text-sm leading-6 text-slate-500">उदाहरण: <strong>1-3, 5, 8-10</strong></p>
                <input
                  id="page-ranges"
                  value={ranges}
                  onChange={(event) => {
                    setRanges(event.target.value);
                    setError(null);
                    setMessage(null);
                  }}
                  inputMode="text"
                  placeholder={`1-${pageCount}`}
                  className={`mt-4 min-h-14 w-full rounded-2xl border bg-white px-4 py-3 text-lg font-bold text-slate-900 outline-none transition ${parsedRange.error ? "border-rose-300 focus:ring-4 focus:ring-rose-100" : "border-slate-300 focus:border-[#2f6a59] focus:ring-4 focus:ring-[#2f6a59]/10"}`}
                  aria-describedby="page-range-help"
                />
                <div id="page-range-help" className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className={parsedRange.error ? "font-semibold text-rose-600" : "font-semibold text-[#2f6a59]"}>
                    {parsedRange.error ?? `${parsedRange.indices.length} pages चुने गए`}
                  </span>
                  <span className="text-slate-400">कुल {pageCount} pages</span>
                </div>
                <button
                  type="button"
                  onClick={extractPages}
                  disabled={Boolean(parsedRange.error) || !parsedRange.indices.length || isWorking}
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#173f35] px-6 py-3 font-black text-white transition hover:bg-[#0f3028] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isWorking ? "PDF तैयार हो रही है…" : "चुने हुए pages डाउनलोड करें"}
                </button>
              </div>
            ) : (
              <div className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
                <h3 className="text-lg font-black text-slate-950">{pageCount} अलग PDF files बनेंगी</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  प्रत्येक page की अलग PDF बनेगी और सभी files एक ZIP में download होंगी। अधिकतम {MAX_SEPARATE_PAGES} pages।
                </p>
                <button
                  type="button"
                  onClick={splitEveryPage}
                  disabled={pageCount > MAX_SEPARATE_PAGES || isWorking}
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#173f35] px-6 py-3 font-black text-white transition hover:bg-[#0f3028] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isWorking ? "ZIP तैयार हो रही है…" : "सभी pages की ZIP डाउनलोड करें"}
                </button>
              </div>
            )}
          </div>
        )}

        <div aria-live="polite" className="mt-5">
          {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
          {message && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p>}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-3xl bg-[#173f35] p-6 text-white">
          <span className="text-3xl" aria-hidden="true">🔒</span>
          <h2 className="mt-4 text-xl font-black">पूरी तरह निजी</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">PDF आपके browser में split होती है। File किसी server पर upload नहीं होती।</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black text-slate-950">दो आसान विकल्प</h2>
          <div className="mt-5 space-y-4 text-sm text-slate-600">
            <div className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e7f3ee] text-xs font-black text-[#173f35]">1</span>
              <span className="pt-1 leading-5">ज़रूरी pages चुनकर एक PDF बनाएँ</span>
            </div>
            <div className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e7f3ee] text-xs font-black text-[#173f35]">2</span>
              <span className="pt-1 leading-5">हर page की अलग PDF वाली ZIP पाएँ</span>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          <strong className="block">ध्यान दें</strong>
          Password-protected या damaged PDFs split नहीं होंगी।
        </div>
      </aside>
    </div>
  );
}
