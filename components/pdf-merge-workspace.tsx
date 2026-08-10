"use client";

import { useMemo, useState } from "react";
import { PDFDocument } from "pdf-lib";

const MAX_FILES = 15;
const MAX_TOTAL_BYTES = 150 * 1024 * 1024;

interface SelectedPdf {
  id: string;
  file: File;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function PdfMergeWorkspace() {
  const [files, setFiles] = useState<SelectedPdf[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalSize = useMemo(
    () => files.reduce((sum, item) => sum + item.file.size, 0),
    [files],
  );

  function addFiles(fileList: FileList | File[]) {
    setError(null);
    setMessage(null);

    const incoming = Array.from(fileList);
    const invalid = incoming.find(
      (file) => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"),
    );

    if (invalid) {
      setError(`“${invalid.name}” PDF file नहीं है। केवल PDF चुनें।`);
      return;
    }

    const existingKeys = new Set(files.map((item) => fileKey(item.file)));
    const unique = incoming.filter((file) => !existingKeys.has(fileKey(file)));

    if (files.length + unique.length > MAX_FILES) {
      setError(`एक बार में अधिकतम ${MAX_FILES} PDF जोड़ी जा सकती हैं।`);
      return;
    }

    const nextTotal = totalSize + unique.reduce((sum, file) => sum + file.size, 0);
    if (nextTotal > MAX_TOTAL_BYTES) {
      setError("सभी files का कुल आकार 150 MB से कम रखें।");
      return;
    }

    if (!unique.length) {
      setError("यह PDF पहले से सूची में मौजूद है।");
      return;
    }

    setFiles((current) => [
      ...current,
      ...unique.map((file) => ({
        id: typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${fileKey(file)}-${Date.now()}`,
        file,
      })),
    ]);
  }

  function moveFile(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= files.length) return;

    setFiles((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setMessage(null);
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((item) => item.id !== id));
    setMessage(null);
    setError(null);
  }

  async function mergePdfs() {
    if (files.length < 2) {
      setError("मर्ज करने के लिए कम से कम 2 PDF जोड़ें।");
      return;
    }

    setIsMerging(true);
    setError(null);
    setMessage("PDF तैयार हो रही है…");

    try {
      const mergedDocument = await PDFDocument.create();
      let totalPages = 0;

      for (let index = 0; index < files.length; index += 1) {
        const item = files[index];
        setMessage(`${index + 1}/${files.length}: ${item.file.name} जोड़ी जा रही है…`);

        let sourceDocument: PDFDocument;
        try {
          sourceDocument = await PDFDocument.load(await item.file.arrayBuffer());
        } catch {
          throw new Error(`“${item.file.name}” खुल नहीं सकी। यह password-protected या damaged PDF हो सकती है।`);
        }

        const copiedPages = await mergedDocument.copyPages(
          sourceDocument,
          sourceDocument.getPageIndices(),
        );
        copiedPages.forEach((page) => mergedDocument.addPage(page));
        totalPages += copiedPages.length;
      }

      const mergedBytes = await mergedDocument.save();
      const blob = new Blob([new Uint8Array(mergedBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `office-sahayak-merged-${date}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      setMessage(`${totalPages} pages की merged PDF download हो गई।`);
    } catch (caughtError) {
      setMessage(null);
      setError(caughtError instanceof Error ? caughtError.message : "PDF मर्ज नहीं हो सकी। दोबारा प्रयास करें।");
    } finally {
      setIsMerging(false);
    }
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
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
            addFiles(event.dataTransfer.files);
          }}
          className={`rounded-3xl border-2 border-dashed px-6 py-12 text-center transition sm:py-16 ${
            isDragging ? "border-[#2f6a59] bg-[#eaf4ef]" : "border-slate-300 bg-[#f8faf9] hover:border-[#7aa596]"
          }`}
        >
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#e7f3ee] text-3xl" aria-hidden="true">📄</span>
          <h2 className="mt-5 text-2xl font-black text-slate-950">अपनी PDF files यहाँ जोड़ें</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Files को drag-and-drop करें या अपने कंप्यूटर से चुनें।
          </p>
          <label htmlFor="pdf-files" className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-full bg-[#173f35] px-6 py-3 font-bold text-white shadow-lg shadow-[#173f35]/15 transition hover:-translate-y-0.5 hover:bg-[#0f3028]">
            PDF चुनें
          </label>
          <input
            id="pdf-files"
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="sr-only"
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <p className="mt-4 text-xs font-medium text-slate-400">2–15 PDFs • कुल अधिकतम 150 MB</p>
        </div>

        {files.length > 0 && (
          <div className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#b4552d]">File क्रम</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">ऊपर से नीचे इसी क्रम में जुड़ेंगी</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFiles([]);
                  setMessage(null);
                  setError(null);
                }}
                disabled={isMerging}
                className="text-sm font-bold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-rose-700 disabled:opacity-50"
              >
                सभी हटाएँ
              </button>
            </div>

            <ol className="mt-5 space-y-3">
              {files.map((item, index) => (
                <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-sm font-black text-rose-700">{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm text-slate-900 sm:text-base">{item.file.name}</strong>
                    <span className="mt-0.5 block text-xs font-medium text-slate-400">{formatBytes(item.file.size)}</span>
                  </span>
                  <div className="flex shrink-0 items-center gap-1" aria-label={`${item.file.name} का क्रम बदलें`}>
                    <button type="button" onClick={() => moveFile(index, -1)} disabled={index === 0 || isMerging} aria-label="ऊपर ले जाएँ" className="grid size-9 place-items-center rounded-full bg-slate-100 font-bold text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-35">↑</button>
                    <button type="button" onClick={() => moveFile(index, 1)} disabled={index === files.length - 1 || isMerging} aria-label="नीचे ले जाएँ" className="grid size-9 place-items-center rounded-full bg-slate-100 font-bold text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-35">↓</button>
                    <button type="button" onClick={() => removeFile(item.id)} disabled={isMerging} aria-label={`${item.file.name} हटाएँ`} className="grid size-9 place-items-center rounded-full bg-rose-50 font-bold text-rose-600 hover:bg-rose-100 disabled:opacity-35">×</button>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-2xl bg-[#102b24] p-5 text-white sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white/60">{files.length} files • {formatBytes(totalSize)}</p>
                <p className="mt-1 font-bold">क्रम सही है? अब PDF मर्ज करें।</p>
              </div>
              <button
                type="button"
                onClick={mergePdfs}
                disabled={files.length < 2 || isMerging}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 py-3 font-black text-[#173f35] transition hover:bg-[#e7f3ee] disabled:cursor-not-allowed disabled:opacity-45 sm:mt-0 sm:w-auto"
              >
                {isMerging ? "मर्ज हो रही है…" : "मर्ज करके डाउनलोड करें"}
              </button>
            </div>
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
          <h2 className="mt-4 text-xl font-black">आपकी files निजी हैं</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            सारी processing इसी browser में होती है। आपकी PDF किसी server पर upload नहीं होती।
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black text-slate-950">कैसे इस्तेमाल करें?</h2>
          <ol className="mt-5 space-y-4 text-sm text-slate-600">
            {["कम से कम 2 PDF चुनें", "तीर से उनका क्रम बदलें", "मर्ज करके PDF डाउनलोड करें"].map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e7f3ee] text-xs font-black text-[#173f35]">{index + 1}</span>
                <span className="pt-1 leading-5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          <strong className="block">ध्यान दें</strong>
          Password-protected या damaged PDFs मर्ज नहीं होंगी।
        </div>
      </aside>
    </div>
  );
}
