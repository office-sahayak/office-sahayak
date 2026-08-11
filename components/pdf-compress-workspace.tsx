"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";

const PDF_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.worker.min.mjs";
const MAX_FILE_BYTES = 60 * 1024 * 1024;
const MAX_RASTER_PAGES = 40;

type CompressionMode = "safe" | "balanced" | "strong";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { reject(new Error("Page image तैयार नहीं हुई।")); return; }
      resolve(await blob.arrayBuffer());
    }, "image/jpeg", quality);
  });
}

function downloadPdf(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

export function PdfCompressWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState<CompressionMode>("balanced");
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function selectFile(selected: File) {
    setError(""); setMessage(""); setProgress(0);
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) { setError("केवल PDF file चुनें।"); return; }
    if (selected.size > MAX_FILE_BYTES) { setError("PDF का आकार 60 MB से कम रखें।"); return; }
    setIsWorking(true);
    try {
      const document = await PDFDocument.load(await selected.arrayBuffer());
      if (!document.getPageCount()) throw new Error("PDF में कोई page नहीं मिला।");
      setFile(selected); setPageCount(document.getPageCount()); setMessage(`${document.getPageCount()} pages की PDF तैयार है।`);
    } catch { setFile(null); setPageCount(0); setError("PDF खुल नहीं सकी। यह password-protected या damaged हो सकती है।"); }
    finally { setIsWorking(false); }
  }

  async function compressPdf() {
    if (!file) { setError("पहले PDF चुनें।"); return; }
    if (mode !== "safe" && pageCount > MAX_RASTER_PAGES) { setError(`Balanced/Strong mode में अधिकतम ${MAX_RASTER_PAGES} pages की PDF चुनें।`); return; }
    setIsWorking(true); setError(""); setMessage("PDF compress हो रही है…"); setProgress(0);

    try {
      let outputBytes: Uint8Array;
      if (mode === "safe") {
        const document = await PDFDocument.load(await file.arrayBuffer());
        document.setProducer("Office Sahayak PDF Compressor");
        outputBytes = await document.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
        setProgress(100);
      } else {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
        const source = await loadingTask.promise;
        const output = await PDFDocument.create();
        const settings = mode === "balanced" ? { scale: 1.45, quality: 0.72 } : { scale: 1.15, quality: 0.5 };

        for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
          setMessage(`Page ${pageNumber}/${source.numPages} compress हो रहा है…`);
          const page = await source.getPage(pageNumber);
          const pageSize = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: settings.scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.floor(viewport.width));
          canvas.height = Math.max(1, Math.floor(viewport.height));
          const context = canvas.getContext("2d", { alpha: false });
          if (!context) throw new Error("Browser PDF page तैयार नहीं कर पाया।");
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          const jpeg = await output.embedJpg(await canvasToJpeg(canvas, settings.quality));
          const outputPage = output.addPage([pageSize.width, pageSize.height]);
          outputPage.drawImage(jpeg, { x: 0, y: 0, width: pageSize.width, height: pageSize.height });
          canvas.width = 1; canvas.height = 1;
          page.cleanup();
          setProgress(Math.round(pageNumber / source.numPages * 100));
        }
        await loadingTask.destroy();
        outputBytes = await output.save({ useObjectStreams: true });
      }

      const baseName = file.name.replace(/\.pdf$/iu, "");
      downloadPdf(outputBytes, `${baseName}-compressed.pdf`);
      const savedPercent = Math.round((1 - outputBytes.length / file.size) * 100);
      setMessage(savedPercent > 0
        ? `Compressed PDF download हो गई: ${formatBytes(file.size)} से ${formatBytes(outputBytes.length)} (${savedPercent}% छोटी)।`
        : `PDF download हो गई, लेकिन इस file में पहले से compression होने के कारण size ${formatBytes(outputBytes.length)} रहा।`);
    } catch (caughtError) {
      setMessage("");
      setError(caughtError instanceof Error ? caughtError.message : "PDF compress नहीं हो सकी।");
    } finally { setIsWorking(false); }
  }

  const modes: Array<{ id: CompressionMode; title: string; detail: string }> = [
    { id: "safe", title: "Safe Optimize", detail: "Text और original quality सुरक्षित; size में थोड़ा फर्क" },
    { id: "balanced", title: "Balanced", detail: "अच्छी readability और कम file size" },
    { id: "strong", title: "Strong", detail: "सबसे छोटा size; scanned sharing के लिए" },
  ];

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 bg-[#f8faf9] px-6 py-12 text-center transition hover:border-[#7aa596]"><span className="text-4xl" aria-hidden="true">📄</span><strong className="mt-3 block text-xl text-slate-950">PDF चुनें</strong><span className="mt-2 block text-sm text-slate-500">एक PDF • अधिकतम 60 MB</span><input type="file" accept="application/pdf,.pdf" className="sr-only" disabled={isWorking} onChange={(event) => { const selected = event.target.files?.[0]; if (selected) void selectFile(selected); event.target.value = ""; }} /></label>

        {file && <div className="mt-6 rounded-2xl border border-slate-200 p-4"><div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-xl" aria-hidden="true">PDF</span><div className="min-w-0 flex-1"><strong className="block truncate text-slate-900">{file.name}</strong><span className="text-xs font-semibold text-slate-500">{pageCount} pages • {formatBytes(file.size)}</span></div><button type="button" onClick={() => { setFile(null); setPageCount(0); setMessage(""); setError(""); }} disabled={isWorking} className="rounded-full bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">हटाएँ</button></div></div>}

        {file && <fieldset className="mt-7"><legend className="text-sm font-extrabold text-slate-700">Compression चुनें</legend><div className="mt-3 grid gap-3 sm:grid-cols-3">{modes.map((item) => <label key={item.id} className={`cursor-pointer rounded-2xl border p-4 ${mode === item.id ? "border-[#2f6a59] bg-[#eaf4ef]" : "border-slate-200 bg-white"}`}><input type="radio" name="compression-mode" value={item.id} checked={mode === item.id} onChange={() => setMode(item.id)} className="mr-2 accent-[#173f35]" /><strong className="text-sm text-slate-900">{item.title}</strong><span className="mt-2 block text-xs leading-5 text-slate-500">{item.detail}</span></label>)}</div></fieldset>}

        {file && <button type="button" onClick={() => void compressPdf()} disabled={isWorking} className="mt-7 min-h-13 w-full rounded-full bg-[#173f35] px-7 py-3 font-black text-white hover:bg-[#0f3028] disabled:opacity-50">{isWorking ? "Compress हो रही है…" : "Compress करके Download करें"}</button>}
        {isWorking && progress > 0 && <div className="mt-4"><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#2f6a59] transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-center text-xs font-bold text-slate-500">{progress}%</p></div>}
        {error && <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
        {message && <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800">{message}</p>}
      </section>

      <aside className="space-y-4"><div className="rounded-3xl bg-[#173f35] p-6 text-white"><span className="text-3xl" aria-hidden="true">🔒</span><h2 className="mt-4 text-xl font-black">PDF निजी रहती है</h2><p className="mt-2 text-sm leading-6 text-white/70">File आपके browser में compress होती है। PDF किसी server पर upload नहीं की जाती।</p></div><div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><strong className="block">Mode का अंतर</strong>Balanced और Strong mode हर page को image बनाते हैं, इसलिए selectable text, links और forms हट सकते हैं। ऐसे documents के लिए Safe Optimize चुनें।</div><div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600">पहले से compressed PDF कभी-कभी और छोटी नहीं होती। Result original से बड़ा हो तो original file इस्तेमाल करें।</div></aside>
    </div>
  );
}
