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

type LegacyFontName = "Kruti Dev 010" | "DevLys 010";

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
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
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
    const scale = Math.min(3.5, 2200 / original.width);
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

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("OCR के लिए page साफ़ नहीं हो सका।"));
    }, "image/png");
  });
}

function histogramPoint(histogram: Uint32Array, target: number) {
  let count = 0;
  for (let value = 0; value < histogram.length; value += 1) {
    count += histogram[value];
    if (count >= target) return value;
  }
  return 255;
}

async function enhanceForOcr(source: Blob, printedTextOnly: boolean, optimizePhoto = false) {
  const bitmap = await createImageBitmap(source);
  const photoScale = optimizePhoto ? Math.min(3, 2800 / Math.max(bitmap.width, bitmap.height)) : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * photoScale));
  canvas.height = Math.max(1, Math.round(bitmap.height * photoScale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("OCR के लिए page साफ़ नहीं हो सका।");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;
  const grayscale = new Uint8Array(pixels.length / 4);
  const histogram = new Uint32Array(256);

  for (let offset = 0, pixel = 0; offset < pixels.length; offset += 4, pixel += 1) {
    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];
    const high = Math.max(red, green, blue);
    const low = Math.min(red, green, blue);
    const isColoredMark = printedTextOnly && high - low > 35 && high > 70;
    const gray = isColoredMark ? 255 : Math.round(red * 0.299 + green * 0.587 + blue * 0.114);
    grayscale[pixel] = gray;
    histogram[gray] += 1;
  }

  const total = grayscale.length;
  const blackPoint = histogramPoint(histogram, total * 0.005);
  const whitePoint = Math.max(blackPoint + 1, histogramPoint(histogram, total * 0.995));

  const enhancedGrayscale = new Uint8Array(total);
  for (let pixel = 0; pixel < grayscale.length; pixel += 1) {
    const normalized = Math.min(1, Math.max(0, (grayscale[pixel] - blackPoint) / (whitePoint - blackPoint)));
    enhancedGrayscale[pixel] = Math.round(255 * Math.pow(normalized, 1.3));
  }

  const outputGrayscale = optimizePhoto ? new Uint8Array(enhancedGrayscale) : enhancedGrayscale;
  if (optimizePhoto && canvas.width > 2 && canvas.height > 2) {
    for (let row = 1; row < canvas.height - 1; row += 1) {
      for (let column = 1; column < canvas.width - 1; column += 1) {
        const pixel = row * canvas.width + column;
        const neighbourAverage = (
          enhancedGrayscale[pixel - canvas.width]
          + enhancedGrayscale[pixel + canvas.width]
          + enhancedGrayscale[pixel - 1]
          + enhancedGrayscale[pixel + 1]
        ) / 4;
        outputGrayscale[pixel] = Math.round(Math.min(255, Math.max(0, enhancedGrayscale[pixel] * 1.65 - neighbourAverage * 0.65)));
      }
    }
  }

  for (let offset = 0, pixel = 0; offset < pixels.length; offset += 4, pixel += 1) {
    const enhanced = outputGrayscale[pixel];
    pixels[offset] = enhanced;
    pixels[offset + 1] = enhanced;
    pixels[offset + 2] = enhanced;
    pixels[offset + 3] = 255;
  }

  context.putImageData(image, 0, 0);
  return canvasToBlob(canvas);
}

function normalizeListNumber(token: string) {
  const devanagariDigits = "०१२३४५६७८९";
  let normalized = Array.from(token.replace(/^।/, "")).map((character) => {
    const digit = devanagariDigits.indexOf(character);
    return digit >= 0 ? String(digit) : character;
  }).join("");
  normalized = normalized.replace(/[oO]/g, "0").replace(/[lI|]/g, "1");
  if (/^[aA][14]$/.test(normalized)) return 11;
  normalized = normalized.replace(/^[zZsSwW]+|[zZsSwW]+$/g, "");
  return /^\d{1,2}$/.test(normalized) ? Number(normalized) : null;
}

function repairOrderedListNumbers(text: string) {
  const lines = text.replace(/\r/g, "").split("\n");
  const candidates = lines.flatMap((line, lineIndex) => {
    const match = line.match(/^(\s*)([0-9०-९oOlI|aAzZsSwW।]{1,3})\s*[.,)।:-]*\s+(.+)$/);
    if (!match) return [];
    return [{ lineIndex, match, value: normalizeListNumber(match[2]) }];
  });

  const groups: typeof candidates[] = [];
  for (const candidate of candidates) {
    const current = groups.at(-1);
    if (!current || candidate.lineIndex - current.at(-1)!.lineIndex > 4) groups.push([candidate]);
    else current.push(candidate);
  }
  const group = groups.sort((left, right) => right.length - left.length)[0];
  if (!group || group.length < 6) return text;

  const startOffsets = group.flatMap((candidate, position) => (
    candidate.value && candidate.value <= 9 ? [candidate.value - position] : []
  )).sort((left, right) => left - right);
  if (startOffsets.length < 4) return text;
  const inferredStart = startOffsets[Math.floor(startOffsets.length / 2)];
  const consistentOffsets = startOffsets.filter((offset) => Math.abs(offset - inferredStart) <= 1);
  if (inferredStart < 1 || inferredStart > 50 || consistentOffsets.length < 4) return text;

  group.forEach((candidate, position) => {
    lines[candidate.lineIndex] = `${candidate.match[1]}${inferredStart + position}. ${candidate.match[3]}`;
  });
  return lines.join("\n");
}

interface PhotoTextBlock {
  paragraphs: Array<{
    lines: Array<{
      words: Array<{ confidence: number; text: string }>;
    }>;
  }>;
}

function cleanPhotoRecognition(blocks: PhotoTextBlock[] | null, fallback: string) {
  if (!blocks?.length) return fallback;
  const paragraphs: string[] = [];

  for (const block of blocks) {
    for (const paragraph of block.paragraphs) {
      const lines = paragraph.lines.flatMap((line) => {
        const words = line.words.flatMap((word) => {
          const token = word.text.trim();
          if (!token) return [];
          if (containsDevanagari(token)) return [token];
          if (/[@]|https?:|www\./i.test(token)) return [token];
          if (/^[।|]?[0-9०-९][0-9०-९.,:/()|-]*$/.test(token)) return [token];
          if (/^[0-9०-९oOlI|aAzZsSwW]{1,3}[.,)।:-]*$/.test(token)) return [token];
          if (/^(?:NCD|ICMIS|IOMIS|RTI|PDF|PAN|GST|IFSC)[.,:/()|-]*$/i.test(token)) return [token];
          if (/^[A-Z]{2,10}[.,:/()|-]*$/.test(token)) return [token];
          return word.confidence >= 70 ? [token] : [];
        });
        return words.length ? [words.join(" ")] : [];
      });
      if (lines.length) paragraphs.push(lines.join("\n"));
    }
  }

  const cleaned = paragraphs.join("\n\n").trim();
  const cleanedHindi = (cleaned.match(/[\u0900-\u097f]/g) ?? []).length;
  const fallbackHindi = (fallback.match(/[\u0900-\u097f]/g) ?? []).length;
  return cleaned && cleanedHindi >= fallbackHindi * 0.8 ? cleaned : fallback;
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

function groupEditableParagraphs(text: string) {
  const paragraphs: Array<{ isNumbered: boolean; text: string }> = [];
  let buffer: string[] = [];
  let bufferIsNumbered = false;

  function flush() {
    if (!buffer.length) return;
    paragraphs.push({ isNumbered: bufferIsNumbered, text: buffer.join(" ") });
    buffer = [];
    bufferIsNumbered = false;
  }

  for (const sourceLine of text.replace(/\r/g, "").split("\n")) {
    const line = sourceLine.trim();
    if (!line) {
      flush();
      if (paragraphs.at(-1)?.text) paragraphs.push({ isNumbered: false, text: "" });
      continue;
    }

    const isNumberedLine = /^[0-9०-९]{1,3}\s*[.,)।:-]+/.test(line);
    const endsParagraph = /[।|.!?;:]$/.test(line);
    const isShortLine = line.length < 45;

    if (isNumberedLine) {
      flush();
      buffer = [line];
      bufferIsNumbered = true;
      if (endsParagraph) flush();
      continue;
    }

    if (buffer.length) {
      buffer.push(line);
      if (endsParagraph || isShortLine) flush();
      continue;
    }

    if (isShortLine) {
      paragraphs.push({ isNumbered: false, text: line });
      continue;
    }

    buffer = [line];
    if (endsParagraph) flush();
  }

  flush();
  return paragraphs;
}

async function createEditableWord(pages: RecognizedPage[], legacyFont: LegacyFontName, compact = false) {
  const { AlignmentType, Document, Packer, Paragraph, SectionType, TextRun } = await import("docx");
  const sections = pages.map((page, pageIndex) => {
    const editableParagraphs = groupEditableParagraphs(page.text);
    const children = editableParagraphs.map((paragraph) => {
      if (!paragraph.text) return new Paragraph({ text: "" });
      const shouldJustify = paragraph.text.length >= 60;
      const runs = paragraph.text.split(/(\s+)/).filter(Boolean).map((part) => {
        const isHindi = containsDevanagari(part);
        return new TextRun({
          text: isHindi ? unicodeToKrutiDev(part) : part,
          font: isHindi ? legacyFont : "Arial",
          size: isHindi ? (compact ? 24 : 28) : (compact ? 20 : 22),
        });
      });
      return new Paragraph({
        alignment: shouldJustify ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
        children: runs,
        indent: paragraph.isNumbered ? { hanging: 360, left: 360 } : undefined,
        spacing: { after: compact ? 0 : 60, line: compact ? 260 : 300 },
      });
    });

    return {
      properties: {
        type: pageIndex ? SectionType.NEXT_PAGE : undefined,
        page: {
          size: { width: 11906, height: 16838 },
          margin: compact
            ? { top: 360, right: 360, bottom: 360, left: 360 }
            : { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children: children.length ? children : [new Paragraph({ text: "" })],
    };
  });

  const documentFile = new Document({
    creator: "Office Sahayak",
    description: `Hindi OCR text converted for ${legacyFont}`,
    sections,
  });
  return Packer.toBlob(documentFile);
}

export function HindiKrutidevWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<RecognizedPage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [printedTextOnly, setPrintedTextOnly] = useState(true);
  const [downloadMode, setDownloadMode] = useState<"kruti" | "devlys" | "both" | null>(null);
  const [imageQualityWarning, setImageQualityWarning] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("File चुनकर Hindi text निकालें।");
  const [error, setError] = useState<string | null>(null);

  const totalCharacters = useMemo(() => pages.reduce((sum, page) => sum + page.text.length, 0), [pages]);

  async function chooseFile(selected: File) {
    setError(null);
    setImageQualityWarning(null);
    if (!isSupportedFile(selected)) {
      setError("केवल PDF, JPG, JPEG या PNG file चुनें।");
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setError("File का आकार 20 MB से कम रखें।");
      return;
    }

    const isPdf = selected.type === "application/pdf" || selected.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      try {
        const bitmap = await createImageBitmap(selected);
        const isLowResolution = bitmap.width < 1200 || bitmap.height < 1600;
        bitmap.close();
        if (isLowResolution) {
          setImageQualityWarning("यह photo कम resolution की है। सही Hindi text के लिए WhatsApp वाली compressed image की जगह original camera photo या Adobe Scan/Microsoft Lens से बनी PDF इस्तेमाल करें।");
        }
      } catch {
        setImageQualityWarning("Photo की quality जाँची नहीं जा सकी। साफ़, सीधी और बिना shadow वाली image इस्तेमाल करें।");
      }
    }

    setFile(selected);
    setPages([]);
    setProgress(0);
    setStatus("File तैयार है। अब Hindi text निकालें।");
  }

  function reset() {
    setFile(null);
    setPages([]);
    setImageQualityWarning(null);
    setProgress(0);
    setStatus("File चुनकर Hindi text निकालें।");
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
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const prepared = isPdf
        ? await preparePdf(file, (page, total) => {
            setProgress(Math.round((page / total) * 12));
            setStatus(`PDF page ${page}/${total} तैयार हो रहा है…`);
          })
        : await prepareImage(file);

      const { createWorker, OEM, PSM } = await import("tesseract.js");
      setStatus("Hindi पढ़ने की सुविधा पहली बार load हो रही है…");
      worker = await createWorker(["hin", "eng"], OEM.LSTM_ONLY, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            const pageProgress = Math.round(message.progress * (78 / prepared.length));
            setProgress((current) => Math.max(current, 15 + pageProgress));
          }
        },
      });
      await worker.setParameters({
        preserve_interword_spaces: "1",
        tessedit_pageseg_mode: isPdf ? PSM.AUTO : PSM.SINGLE_BLOCK,
        user_defined_dpi: "300",
      });

      const recognized: RecognizedPage[] = [];
      for (let index = 0; index < prepared.length; index += 1) {
        setStatus(`Page ${index + 1}/${prepared.length} साफ़ करके Hindi text पढ़ा जा रहा है…`);
        const ocrImage = await enhanceForOcr(prepared[index].blob, printedTextOnly, !isPdf);
        const result = await worker.recognize(ocrImage, {}, { blocks: !isPdf, text: true });
        const extractedText = isPdf
          ? result.data.text.trim()
          : cleanPhotoRecognition(result.data.blocks, result.data.text.trim());
        recognized.push({
          height: prepared[index].height,
          png: prepared[index].png,
          text: isPdf ? extractedText : repairOrderedListNumbers(extractedText),
          width: prepared[index].width,
        });
        setProgress(15 + Math.round(((index + 1) / prepared.length) * 80));
      }

      setPages(recognized);
      setProgress(100);
      setStatus("Hindi text तैयार है। गलतियाँ जाँचकर Word download करें।");
    } catch (caughtError) {
      setProgress(0);
      setStatus("Hindi text नहीं निकाला जा सका।");
      setError(caughtError instanceof Error ? caughtError.message : "File पढ़ते समय समस्या आई। दोबारा प्रयास करें।");
    } finally {
      if (worker) await worker.terminate().catch(() => undefined);
      setIsWorking(false);
    }
  }

  function updatePageText(index: number, text: string) {
    setPages((current) => current.map((page, pageIndex) => (pageIndex === index ? { ...page, text } : page)));
  }

  async function download(type: "kruti" | "devlys" | "both") {
    if (!pages.length) return;
    setDownloadMode(type);
    setError(null);
    try {
      const compact = file ? !(file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) : false;
      if (type === "kruti") {
        saveBlob(await createEditableWord(pages, "Kruti Dev 010", compact), "office-sahayak-krutidev-010.docx");
      } else if (type === "devlys") {
        saveBlob(await createEditableWord(pages, "DevLys 010", compact), "office-sahayak-devlys-010.docx");
      } else {
        const [{ default: JSZip }, krutiDev, devLys] = await Promise.all([
          import("jszip"),
          createEditableWord(pages, "Kruti Dev 010", compact),
          createEditableWord(pages, "DevLys 010", compact),
        ]);
        const zip = new JSZip();
        zip.file("krutidev-010-editable.docx", krutiDev);
        zip.file("devlys-010-editable.docx", devLys);
        saveBlob(await zip.generateAsync({ type: "blob" }), "office-sahayak-hindi-font-word-files.zip");
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
              void chooseFile(dropped[0]);
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
              if (selected) void chooseFile(selected);
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

            {imageQualityWarning && (
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900" role="status">
                {imageQualityWarning}
              </p>
            )}

            {!pages.length && (
              <div className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-xl font-black text-slate-950">Hindi text पहचानें</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">File आपके browser में ही पढ़ी जाएगी। पहली बार Hindi language data load होने में थोड़ा समय लग सकता है।</p>
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <input type="checkbox" checked={printedTextOnly} onChange={(event) => setPrintedTextOnly(event.target.checked)} disabled={isWorking} className="mt-1 size-4 accent-[#173f35]" />
                  <span>
                    <strong className="block text-sm text-emerald-950">सिर्फ साफ़ printed text पढ़ें</strong>
                    <span className="mt-1 block text-xs leading-5 text-emerald-800">Blue signatures और coloured highlight को text से हटाता है। Handwritten text भी चाहिए तो इसे बंद करें।</span>
                  </span>
                </label>
                <button type="button" onClick={runOcr} disabled={isWorking} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#173f35] px-6 py-3 font-black text-white transition hover:bg-[#0f3028] disabled:cursor-not-allowed disabled:opacity-50">
                  {isWorking ? "Hindi text निकाला जा रहा है…" : "Hindi text निकालें"}
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
                    <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#b4552d]">निकला हुआ text</p>
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
                  <button type="button" onClick={() => download("kruti")} disabled={Boolean(downloadMode)} className="rounded-2xl bg-[#173f35] px-5 py-4 text-left font-black text-white disabled:opacity-50">
                    <span className="block text-lg">Kruti Dev 010 Word</span>
                    <span className="mt-1 block text-xs font-semibold text-white/65">{downloadMode === "kruti" ? "बन रही है…" : "Editable • Justified paragraphs"}</span>
                  </button>
                  <button type="button" onClick={() => download("devlys")} disabled={Boolean(downloadMode)} className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-left font-black text-slate-950 disabled:opacity-50">
                    <span className="block text-lg">DevLys 010 Word</span>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">{downloadMode === "devlys" ? "बन रही है…" : "Editable • Justified paragraphs"}</span>
                  </button>
                </div>
                <button type="button" onClick={() => download("both")} disabled={Boolean(downloadMode)} className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#b4552d] px-6 py-3 font-black text-white transition hover:bg-[#964322] disabled:opacity-50">
                  {downloadMode === "both" ? "दोनों editable files की ZIP बन रही है…" : "Kruti Dev + DevLys दोनों डाउनलोड करें"}
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
          <p className="mt-2 text-sm leading-6 text-white/70">PDF या फोटो किसी server या MeshAPI पर upload नहीं होती। File आपके browser में ही पढ़ी जाती है।</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black text-slate-950">दो editable Word files</h2>
          <div className="mt-5 space-y-4 text-sm text-slate-600">
            <div className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e7f3ee] text-xs font-black text-[#173f35]">1</span><span className="pt-1 leading-5">Kruti Dev 010 में justified Hindi text</span></div>
            <div className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e7f3ee] text-xs font-black text-[#173f35]">2</span><span className="pt-1 leading-5">DevLys 010 में वही editable text</span></div>
          </div>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          <strong className="block">दोनों fonts installed रखें</strong>
          Files को <strong>Desktop Microsoft Word</strong> में खोलें। कंप्यूटर में <strong>Kruti Dev 010</strong> और <strong>DevLys 010</strong> font installed होना चाहिए; Word Online में ये सही नहीं दिख सकते।
        </div>
      </aside>
    </div>
  );
}
