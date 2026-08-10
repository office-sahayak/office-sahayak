"use client";

import { useMemo, useState } from "react";
import { containsDevanagari, unicodeToKrutiDev } from "@/lib/tools/unicode-to-krutidev";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_PDF_PAGES = 10;
const PDF_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.worker.min.mjs";

interface PreparedPage {
  blob: Blob;
  height: number;
  png: Uint8Array;
  width: number;
}

interface RecognizedPage {
  height: number;
  png: Uint8Array;
  text: string;
  width: number;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isSupportedFile(file: File) {
  const extension = file.name.toLowerCase().split(".").pop();
  return ["application/pdf", "image/jpeg", "image/png"].includes(file.type) || ["pdf", "jpg", "jpeg", "png"].includes(extension ?? "");
}

function canvasToPng(canvas: HTMLCanvasElement) {
  return new Promise<PreparedPage>((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error("चित्र तैयार नहीं हो सका।"));
        return;
      }
      try {
        resolve({
          blob,
          height: canvas.height,
          png: new Uint8Array(await blob.arrayBuffer()),
          width: canvas.width,
        });
      } catch (error) {
        reject(error);
      }
    }, "image/png");
  });
}

async function prepareImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const maxDimension = 2200;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("चित्र पढ़ा नहीं जा सका।");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return [await canvasToPng(canvas)];
}

async function preparePdf(file: File, onPage: (page: number, total: number) => void) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await loadingTask.promise;

  if (pdf.numPages > MAX_PDF_PAGES) {
    await loadingTask.destroy();
    throw new Error(`अभी अधिकतम ${MAX_PDF_PAGES} pages की PDF इस्तेमाल करें।`);
  }

  const pages: PreparedPage[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    onPage(pageNumber, pdf.numPages);
    const page = await pdf.getPage(pageNumber);
    const original = page.getViewport({ scale: 1 });
    const scale = Math.min(2.5, 2000 / original.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport, background: "#ffffff" }).promise;
    pages.push(await canvasToPng(canvas));
    page.cleanup();
  }

  await loadingTask.destroy();
  return pages;
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function createEditableWord(pages: RecognizedPage[]) {
  const { Document, Packer, Paragraph, SectionType, TextRun } = await import("docx");
  const sections = pages.map((page, pageIndex) => {
    const lines = page.text.replace(/\r/g, "").split("\n");
    const children = lines.map((line) => {
      if (!line) return new Paragraph({ text: "" });
      const runs = line.split(/(\s+)/).filter(Boolean).map((part) => {
        const isHindi = containsDevanagari(part);
        return new TextRun({
          text: isHindi ? unicodeToKrutiDev(part) : part,
          font: isHindi ? "Kruti Dev 010" : "Arial",
          size: isHindi ? 28 : 22,
        });
      });
      return new Paragraph({ children: runs, spacing: { after: 80, line: 340 } });
    });

    return {
      properties: pageIndex ? { type: SectionType.NEXT_PAGE } : {},
      children: children.length ? children : [new Paragraph({ text: "" })],
    };
  });

  const documentFile = new Document({
    creator: "Office Sahayak",
    description: "Hindi OCR text converted for Kruti Dev 010",
    sections,
  });
  return Packer.toBlob(documentFile);
}

async function createLayoutWord(pages: RecognizedPage[]) {
  const { AlignmentType, Document, ImageRun, Packer, PageOrientation, Paragraph, SectionType } = await import("docx");
  const sections = pages.map((page, pageIndex) => {
    const landscape = page.width > page.height;
    const maxWidth = landscape ? 1010 : 740;
    const maxHeight = landscape ? 700 : 1040;
    const scale = Math.min(maxWidth / page.width, maxHeight / page.height);
    const image = new ImageRun({
      type: "png",
      data: page.png,
      transformation: {
        width: Math.max(1, Math.round(page.width * scale)),
        height: Math.max(1, Math.round(page.height * scale)),
      },
      altText: {
        title: `Original page ${pageIndex + 1}`,
        description: `Uploaded document page ${pageIndex + 1}`,
        name: `page-${pageIndex + 1}.png`,
      },
    });

    return {
      properties: {
        type: pageIndex ? SectionType.NEXT_PAGE : undefined,
        page: {
          size: { orientation: landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT },
          margin: { top: 240, right: 240, bottom: 240, left: 240 },
        },
      },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [image], spacing: { after: 0, before: 0 } })],
    };
  });

  const documentFile = new Document({
    creator: "Office Sahayak",
    description: "Original document layout preserved as page images",
    sections,
  });
  return Packer.toBlob(documentFile);
}

export function HindiKrutidevWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<RecognizedPage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [downloadMode, setDownloadMode] = useState<"editable" | "layout" | "both" | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("File चुनकर OCR शुरू करें।");
  const [error, setError] = useState<string | null>(null);

  const totalCharacters = useMemo(() => pages.reduce((sum, page) => sum + page.text.length, 0), [pages]);

  function chooseFile(selected: File) {
    setError(null);
    if (!isSupportedFile(selected)) {
      setError("केवल PDF, JPG, JPEG या PNG file चुनें।");
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setError("File का आकार 20 MB से कम रखें।");
      return;
    }
    setFile(selected);
    setPages([]);
    setProgress(0);
    setStatus("File तैयार है। अब Hindi OCR शुरू करें।");
  }

  function reset() {
    setFile(null);
    setPages([]);
    setProgress(0);
    setStatus("File चुनकर OCR शुरू करें।");
    setError(null);
  }

  async function runOcr() {
    if (!file) return;
    setIsWorking(true);
    setPages([]);
    setError(null);
    setProgress(2);
    setStatus("Pages तैयार हो रहे हैं…");

    let worker: Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>> | null = null;
    try {
      const prepared = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
        ? await preparePdf(file, (page, total) => {
            setProgress(Math.round((page / total) * 12));
            setStatus(`PDF page ${page}/${total} तैयार हो रहा है…`);
          })
        : await prepareImage(file);

      const { createWorker, OEM } = await import("tesseract.js");
      setStatus("Hindi OCR engine पहली बार load हो रहा है…");
      worker = await createWorker(["hin", "eng"], OEM.LSTM_ONLY, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            const pageProgress = Math.round(message.progress * (78 / prepared.length));
            setProgress((current) => Math.max(current, 15 + pageProgress));
          }
        },
      });
      await worker.setParameters({ preserve_interword_spaces: "1", user_defined_dpi: "300" });

      const recognized: RecognizedPage[] = [];
      for (let index = 0; index < prepared.length; index += 1) {
        setStatus(`Page ${index + 1}/${prepared.length} का Hindi text पढ़ा जा रहा है…`);
        const result = await worker.recognize(prepared[index].blob);
        recognized.push({
          height: prepared[index].height,
          png: prepared[index].png,
          text: result.data.text.trim(),
          width: prepared[index].width,
        });
        setProgress(15 + Math.round(((index + 1) / prepared.length) * 80));
      }

      setPages(recognized);
      setProgress(100);
      setStatus("OCR पूरा हुआ। Text जाँचकर Word download करें।");
    } catch (caughtError) {
      setProgress(0);
      setStatus("OCR पूरा नहीं हो सका।");
      setError(caughtError instanceof Error ? caughtError.message : "File पढ़ते समय समस्या आई। दोबारा प्रयास करें।");
    } finally {
      if (worker) await worker.terminate().catch(() => undefined);
      setIsWorking(false);
    }
  }

  function updatePageText(index: number, text: string) {
    setPages((current) => current.map((page, pageIndex) => (pageIndex === index ? { ...page, text } : page)));
  }

  async function download(type: "editable" | "layout" | "both") {
    if (!pages.length) return;
    setDownloadMode(type);
    setError(null);
    try {
      if (type === "editable") {
        saveBlob(await createEditableWord(pages), "office-sahayak-krutidev-editable.docx");
      } else if (type === "layout") {
        saveBlob(await createLayoutWord(pages), "office-sahayak-original-layout.docx");
      } else {
        const [{ default: JSZip }, editable, layout] = await Promise.all([
          import("jszip"),
          createEditableWord(pages),
          createLayoutWord(pages),
        ]);
        const zip = new JSZip();
        zip.file("krutidev-editable.docx", editable);
        zip.file("original-layout.docx", layout);
        saveBlob(await zip.generateAsync({ type: "blob" }), "office-sahayak-word-files.zip");
      }
    } catch {
      setError("Word file बनाते समय समस्या आई। कृपया दोबारा प्रयास करें।");
    } finally {
      setDownloadMode(null);
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
              const dropped = Array.from(event.dataTransfer.files);
              if (dropped.length !== 1) {
                setError("एक बार में केवल एक file चुनें।");
                return;
              }
              chooseFile(dropped[0]);
            }}
            className={`rounded-3xl border-2 border-dashed px-6 py-14 text-center transition sm:py-18 ${isDragging ? "border-[#2f6a59] bg-[#eaf4ef]" : "border-slate-300 bg-[#f8faf9] hover:border-[#7aa596]"}`}
          >
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-orange-50 text-3xl" aria-hidden="true">कृ</span>
            <h2 className="mt-5 text-2xl font-black text-slate-950">Hindi PDF या फोटो चुनें</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Scanned PDF, JPG, JPEG या PNG को यहाँ drop करें।</p>
            <label htmlFor="hindi-ocr-file" className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-full bg-[#173f35] px-6 py-3 font-bold text-white shadow-lg shadow-[#173f35]/15 transition hover:-translate-y-0.5 hover:bg-[#0f3028]">
              File चुनें
            </label>
            <input id="hindi-ocr-file" type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) chooseFile(selected);
              event.target.value = "";
            }} />
            <p className="mt-4 text-xs font-medium text-slate-400">अधिकतम 20 MB • PDF में अधिकतम {MAX_PDF_PAGES} pages</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-[#f8faf9] p-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-orange-50 text-2xl" aria-hidden="true">📄</span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-slate-950">{file.name}</strong>
                <span className="mt-1 block text-xs font-semibold text-slate-500">{formatBytes(file.size)}</span>
              </span>
              <button type="button" onClick={reset} disabled={isWorking || Boolean(downloadMode)} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:text-rose-700 disabled:opacity-50">बदलें</button>
            </div>

            {!pages.length && (
              <div className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-xl font-black text-slate-950">Hindi text पहचानें</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">OCR आपके browser में चलेगा। पहली बार Hindi language data load होने में थोड़ा समय लग सकता है।</p>
                <button type="button" onClick={runOcr} disabled={isWorking} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#173f35] px-6 py-3 font-black text-white transition hover:bg-[#0f3028] disabled:cursor-not-allowed disabled:opacity-50">
                  {isWorking ? "Hindi OCR चल रहा है…" : "Hindi OCR शुरू करें"}
                </button>
              </div>
            )}

            {(isWorking || progress > 0) && (
              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4" aria-live="polite">
                <div className="flex items-center justify-between gap-4 text-sm font-bold text-emerald-900"><span>{status}</span><span>{progress}%</span></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-[#2f6a59] transition-all" style={{ width: `${progress}%` }} /></div>
              </div>
            )}

            {pages.length > 0 && (
              <div className="mt-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#b4552d]">OCR परिणाम</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">Text जाँचें और सुधारें</h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{pages.length} pages • {totalCharacters} अक्षर</span>
                </div>

                <div className="mt-5 space-y-4">
                  {pages.map((page, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 p-4">
                      <label htmlFor={`ocr-page-${index}`} className="font-black text-slate-900">Page {index + 1}</label>
                      <textarea id={`ocr-page-${index}`} value={page.text} onChange={(event) => updatePageText(index, event.target.value)} rows={index === 0 ? 10 : 6} className="mt-3 w-full resize-y rounded-xl border border-slate-300 bg-[#fbfcfc] p-4 font-medium leading-7 text-slate-800 outline-none focus:border-[#2f6a59] focus:ring-4 focus:ring-[#2f6a59]/10" />
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => download("editable")} disabled={Boolean(downloadMode)} className="rounded-2xl bg-[#173f35] px-5 py-4 text-left font-black text-white disabled:opacity-50">
                    <span className="block text-lg">Editable Kruti Dev Word</span>
                    <span className="mt-1 block text-xs font-semibold text-white/65">{downloadMode === "editable" ? "बन रही है…" : "Text बदल और edit कर पाएँगे"}</span>
                  </button>
                  <button type="button" onClick={() => download("layout")} disabled={Boolean(downloadMode)} className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-left font-black text-slate-950 disabled:opacity-50">
                    <span className="block text-lg">Original Layout Word</span>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">{downloadMode === "layout" ? "बन रही है…" : "हर page का रूप वैसा ही रहेगा"}</span>
                  </button>
                </div>
                <button type="button" onClick={() => download("both")} disabled={Boolean(downloadMode)} className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#b4552d] px-6 py-3 font-black text-white transition hover:bg-[#964322] disabled:opacity-50">
                  {downloadMode === "both" ? "दोनों files की ZIP बन रही है…" : "दोनों Word files डाउनलोड करें"}
                </button>
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
      </section>

      <aside className="space-y-4">
        <div className="rounded-3xl bg-[#173f35] p-6 text-white">
          <span className="text-3xl" aria-hidden="true">🔒</span>
          <h2 className="mt-4 text-xl font-black">File पूरी तरह निजी</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">PDF या फोटो किसी server या MeshAPI पर upload नहीं होती। OCR आपके browser में चलता है।</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black text-slate-950">दो Word files</h2>
          <div className="mt-5 space-y-4 text-sm text-slate-600">
            <div className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e7f3ee] text-xs font-black text-[#173f35]">1</span><span className="pt-1 leading-5">Kruti Dev 010 में editable Hindi text</span></div>
            <div className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e7f3ee] text-xs font-black text-[#173f35]">2</span><span className="pt-1 leading-5">Original page layout वाला Word</span></div>
          </div>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          <strong className="block">Kruti Dev font ज़रूरी है</strong>
          Editable Word सही दिखाने के लिए कंप्यूटर में <strong>Kruti Dev 010</strong> font installed होना चाहिए। धुंधली scan में OCR text सुधारना पड़ सकता है।
        </div>
      </aside>
    </div>
  );
}
