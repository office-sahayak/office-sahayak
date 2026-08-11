"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import mammoth from "mammoth";
import { krutiDevToUnicode } from "@/lib/tools/unicode-to-krutidev";

type PdfOrientation = "portrait" | "landscape";

const PDF_RENDER_SCALE = 1.35;
const PAGES_PER_RENDER = 3;
const HINDI_FONT_STACK = '"Noto Sans Devanagari", "Nirmala UI", Mangal, sans-serif';

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function sanitizeDocumentHtml(source: string) {
  const documentNode = new DOMParser().parseFromString(source, "text/html");
  documentNode.querySelectorAll("script, iframe, object, embed, form, input, button, textarea, select, link, style, meta").forEach((node) => node.remove());
  documentNode.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith("on") || name === "srcdoc" || name === "formaction") element.removeAttribute(attribute.name);
      if ((name === "href" || name === "src") && (value.startsWith("javascript:") || value.startsWith("vbscript:"))) element.removeAttribute(attribute.name);
      if (name === "style" && /url\s*\(|expression\s*\(/iu.test(value)) element.removeAttribute(attribute.name);
    }
  });
  return documentNode.body.innerHTML;
}

type WordFontKind = "legacy" | "modern" | undefined;

const WORDPROCESSING_NAMESPACE = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

function wordAttribute(element: Element | undefined, name: string) {
  return element?.getAttributeNS(WORDPROCESSING_NAMESPACE, name) ?? element?.getAttribute(`w:${name}`) ?? "";
}

function classifyWordFonts(element: Element | undefined): WordFontKind {
  if (!element) return undefined;
  const names = ["ascii", "hAnsi", "eastAsia", "cs"]
    .map((attribute) => wordAttribute(element, attribute))
    .filter(Boolean);
  if (!names.length) return undefined;
  return names.some((name) => /kruti\s*dev|devlys/iu.test(name)) ? "legacy" : "modern";
}

async function normalizeLegacyHindiRuns(arrayBuffer: ArrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) return { arrayBuffer, convertedRuns: 0 };

  const documentXml = parseXml(await documentFile.async("string"));
  const stylesFile = zip.file("word/styles.xml");
  const stylesXml = stylesFile ? parseXml(await stylesFile.async("string")) : null;
  const styles = new Map<string, { basedOn: string; fontKind: WordFontKind }>();

  if (stylesXml) {
    for (const style of localElements(stylesXml, "style")) {
      const styleId = wordAttribute(style, "styleId");
      if (!styleId) continue;
      const runProperties = localElements(style, "rPr")[0];
      styles.set(styleId, {
        basedOn: wordAttribute(localElements(style, "basedOn")[0], "val"),
        fontKind: classifyWordFonts(runProperties ? localElements(runProperties, "rFonts")[0] : undefined),
      });
    }
  }

  function styleFontKind(styleId: string, visited = new Set<string>()): WordFontKind {
    if (!styleId || visited.has(styleId)) return undefined;
    visited.add(styleId);
    const style = styles.get(styleId);
    if (!style) return undefined;
    return style.fontKind ?? styleFontKind(style.basedOn, visited);
  }

  const defaultRunProperties = stylesXml ? localElements(stylesXml, "rPrDefault")[0] : undefined;
  const defaultFontKind = classifyWordFonts(defaultRunProperties ? localElements(defaultRunProperties, "rFonts")[0] : undefined);
  let convertedRuns = 0;

  for (const run of localElements(documentXml, "r")) {
    const runProperties = localElements(run, "rPr")[0];
    const directFontKind = classifyWordFonts(runProperties ? localElements(runProperties, "rFonts")[0] : undefined);
    const runStyleId = wordAttribute(runProperties ? localElements(runProperties, "rStyle")[0] : undefined, "val");
    let paragraph: Element | null = run.parentElement;
    while (paragraph && paragraph.localName !== "p") paragraph = paragraph.parentElement;
    const paragraphProperties = paragraph ? localElements(paragraph, "pPr")[0] : undefined;
    const paragraphStyleId = wordAttribute(paragraphProperties ? localElements(paragraphProperties, "pStyle")[0] : undefined, "val");
    const fontKind = directFontKind ?? styleFontKind(runStyleId) ?? styleFontKind(paragraphStyleId) ?? defaultFontKind;
    if (fontKind !== "legacy") continue;

    let runChanged = false;
    for (const textNode of localElements(run, "t")) {
      const original = textNode.textContent ?? "";
      const converted = krutiDevToUnicode(original);
      if (converted !== original) {
        textNode.textContent = converted;
        runChanged = true;
      }
    }
    if (runChanged) convertedRuns += 1;
  }

  if (!convertedRuns) return { arrayBuffer, convertedRuns };
  zip.file("word/document.xml", new XMLSerializer().serializeToString(documentXml));
  return {
    arrayBuffer: await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" }),
    convertedRuns,
  };
}

async function waitForImages(element: HTMLElement) {
  await Promise.all(Array.from(element.querySelectorAll("img")).map((image) => {
    if (image.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    });
  }));
}

function makePdfCloneColorSafe(clonedElement: HTMLElement) {
  const elements = [clonedElement, ...Array.from(clonedElement.querySelectorAll<HTMLElement>("*"))];
  for (const element of elements) {
    const isTableHeader = element.tagName === "TH"
      || (element.tagName === "TD" && element.parentElement?.parentElement?.firstElementChild === element.parentElement);
    const style = element.style;
    style.setProperty("color", "#0f172a", "important");
    style.setProperty("background-color", element === clonedElement ? "#ffffff" : isTableHeader ? "#f1f5f9" : "transparent", "important");
    style.setProperty("background-image", "none", "important");
    style.setProperty("border-color", "#94a3b8", "important");
    style.setProperty("border-top-color", "#94a3b8", "important");
    style.setProperty("border-right-color", "#94a3b8", "important");
    style.setProperty("border-bottom-color", "#94a3b8", "important");
    style.setProperty("border-left-color", "#94a3b8", "important");
    style.setProperty("outline-color", "transparent", "important");
    style.setProperty("text-decoration-color", "#0f172a", "important");
    style.setProperty("text-emphasis-color", "#0f172a", "important");
    style.setProperty("caret-color", "#0f172a", "important");
    style.setProperty("column-rule-color", "#94a3b8", "important");
    style.setProperty("box-shadow", "none", "important");
    style.setProperty("text-shadow", "none", "important");
    style.setProperty("filter", "none", "important");
    style.setProperty("fill", "#0f172a", "important");
    style.setProperty("stroke", "#0f172a", "important");
  }
}

async function exportElementToPdf(
  element: HTMLElement,
  fileName: string,
  orientation: PdfOrientation,
  onProgress?: (completedPages: number, totalPages: number) => void,
) {
  await document.fonts.load(`400 16px ${HINDI_FONT_STACK}`, "हिन्दी कार्यालय सहायक");
  await document.fonts.ready;
  await waitForImages(element);

  const width = Math.ceil(Math.max(element.scrollWidth, element.clientWidth));
  const height = Math.ceil(Math.max(element.scrollHeight, element.clientHeight));
  if (!width || !height || width > 6000) throw new Error("Document की चौड़ाई PDF बनाने के लिए बहुत अधिक है।");

  const pdf = new jsPDF({ orientation, unit: "pt", format: "a4", compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2;
  const sourcePageHeight = Math.max(1, Math.floor(width * printableHeight / printableWidth));
  const totalPages = Math.ceil(height / sourcePageHeight);
  if (totalPages > 300) throw new Error("इस document में 300 से अधिक PDF pages बन रहे हैं। कृपया इसे दो files में बाँटें।");

  for (let firstPage = 0; firstPage < totalPages; firstPage += PAGES_PER_RENDER) {
    const sourceY = firstPage * sourcePageHeight;
    const chunkHeight = Math.min(sourcePageHeight * PAGES_PER_RENDER, height - sourceY);
    const chunkCanvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      height: chunkHeight,
      logging: false,
      onclone: (_clonedDocument, clonedElement) => {
        makePdfCloneColorSafe(clonedElement);
        clonedElement.style.setProperty("font-family", HINDI_FONT_STACK, "important");
        clonedElement.querySelectorAll<HTMLElement>("*").forEach((child) => {
          child.style.setProperty("font-family", HINDI_FONT_STACK, "important");
        });
      },
      scale: PDF_RENDER_SCALE,
      useCORS: false,
      width,
      windowHeight: chunkHeight,
      windowWidth: width,
      y: sourceY,
    });
    const renderedScale = chunkCanvas.width / width;
    const pagesInChunk = Math.min(PAGES_PER_RENDER, totalPages - firstPage);

    for (let offset = 0; offset < pagesInChunk; offset += 1) {
      const pageNumber = firstPage + offset;
      const pageSourceY = offset * sourcePageHeight;
      const remainingHeight = height - pageNumber * sourcePageHeight;
      const pageSourceHeight = Math.min(sourcePageHeight, remainingHeight);
      const pixelY = Math.round(pageSourceY * renderedScale);
      const pixelHeight = Math.max(1, Math.min(chunkCanvas.height - pixelY, Math.ceil(pageSourceHeight * renderedScale)));
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = chunkCanvas.width;
      pageCanvas.height = Math.max(1, pixelHeight);
      const context = pageCanvas.getContext("2d");
      if (!context) throw new Error("PDF page तैयार नहीं हो सका।");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      context.drawImage(chunkCanvas, 0, pixelY, chunkCanvas.width, pixelHeight, 0, 0, pageCanvas.width, pixelHeight);
      const renderedHeight = pageSourceHeight * printableWidth / width;
      if (pageNumber > 0) pdf.addPage();
      pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, printableWidth, renderedHeight, undefined, "FAST");
      pageCanvas.width = 1;
      pageCanvas.height = 1;
      onProgress?.(pageNumber + 1, totalPages);
    }
    chunkCanvas.width = 1;
    chunkCanvas.height = 1;
  }
  pdf.save(fileName);
}

function PrivacyAside({ note }: { note: string }) {
  return (
    <aside className="space-y-4">
      <div className="rounded-3xl bg-[#173f35] p-6 text-white"><span className="text-3xl" aria-hidden="true">🔒</span><h2 className="mt-4 text-xl font-black">File निजी रहती है</h2><p className="mt-2 text-sm leading-6 text-white/70">Conversion आपके browser में होती है। Document किसी server पर upload नहीं किया जाता।</p></div>
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><strong className="block">ध्यान दें</strong>{note}</div>
    </aside>
  );
}

export function WordToPdfWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [html, setHtml] = useState("");
  const [orientation, setOrientation] = useState<PdfOrientation>("portrait");
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  async function selectFile(selected: File) {
    setError(""); setMessage("");
    if (!selected.name.toLowerCase().endsWith(".docx")) { setError("केवल .docx Word file चुनें।"); return; }
    if (selected.size > 15 * 1024 * 1024) { setError("Word file का आकार 15 MB से कम रखें।"); return; }
    setIsWorking(true);
    try {
      const normalizedDocument = await normalizeLegacyHindiRuns(await selected.arrayBuffer());
      const result = await mammoth.convertToHtml(
        { arrayBuffer: normalizedDocument.arrayBuffer },
        { convertImage: mammoth.images.dataUri, ignoreEmptyParagraphs: false },
      );
      const safeHtml = sanitizeDocumentHtml(result.value);
      if (!safeHtml.trim()) throw new Error("इस Word file में पढ़ने योग्य content नहीं मिला।");
      setFile(selected);
      setHtml(safeHtml);
      const legacyNote = normalizedDocument.convertedRuns ? `${normalizedDocument.convertedRuns} Kruti Dev/DevLys text runs Unicode Hindi में बदले गए। ` : "";
      setMessage(result.messages.length ? `${legacyNote}Preview तैयार है। ${result.messages.length} formatting warning मिली—PDF से पहले preview जाँच लें।` : `${legacyNote}Preview तैयार है। अब PDF download कर सकते हैं।`);
    } catch (caughtError) {
      setFile(null); setHtml(""); setError(caughtError instanceof Error ? caughtError.message : "Word file नहीं खुल सकी।");
    } finally { setIsWorking(false); }
  }

  async function makePdf() {
    if (!file || !previewRef.current) return;
    setIsWorking(true); setError(""); setMessage("PDF तैयार हो रही है…");
    try {
      await exportElementToPdf(
        previewRef.current,
        `${file.name.replace(/\.docx$/iu, "")}.pdf`,
        orientation,
        (completed, total) => setMessage(`PDF page ${completed}/${total} तैयार हो गया…`),
      );
      setMessage("PDF download हो गई।");
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "PDF नहीं बन सकी।"); setMessage(""); }
    finally { setIsWorking(false); }
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 bg-[#f8faf9] px-6 py-10 text-center hover:border-[#7aa596]"><span className="text-4xl" aria-hidden="true">📄</span><strong className="mt-3 block text-xl">Word file चुनें</strong><span className="mt-2 block text-sm text-slate-500">.docx • अधिकतम 15 MB</span><input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" disabled={isWorking} onChange={(event) => { const selected = event.target.files?.[0]; if (selected) void selectFile(selected); event.target.value = ""; }} /></label>
        {file && <div className="mt-6 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-200 p-4"><div className="min-w-0"><strong className="block truncate text-slate-900">{file.name}</strong><span className="text-xs font-semibold text-slate-500">{formatBytes(file.size)}</span></div><label className="text-sm font-extrabold text-slate-700">Page <select value={orientation} onChange={(event) => setOrientation(event.target.value as PdfOrientation)} className="ml-2 rounded-xl border border-slate-300 bg-white px-3 py-2"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label></div>}
        {html && <div className="mt-7"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black text-slate-950">PDF Preview</h2><button type="button" onClick={() => void makePdf()} disabled={isWorking} className="rounded-full bg-[#173f35] px-6 py-3 font-black text-white disabled:opacity-50">{isWorking ? "तैयार हो रही है…" : "PDF Download करें"}</button></div><div className="max-h-[42rem] overflow-auto rounded-2xl border border-slate-300 bg-slate-100 p-3"><div ref={previewRef} className="word-pdf-preview mx-auto min-h-[900px] w-[794px] max-w-none bg-white px-14 py-12 text-[15px] leading-7 text-slate-950 shadow-sm [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-black [&_h2]:mb-4 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-black [&_img]:mx-auto [&_img]:max-w-full [&_li]:ml-6 [&_ol]:my-4 [&_p]:my-3 [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-400 [&_td]:p-2 [&_th]:border [&_th]:border-slate-400 [&_th]:bg-slate-100 [&_th]:p-2 [&_ul]:my-4" dangerouslySetInnerHTML={{ __html: html }} /></div></div>}
        {error && <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
        {message && <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800">{message}</p>}
      </section>
      <PrivacyAside note="Simple paragraphs, headings, lists, images और tables अच्छे से आते हैं। Complex Word layout, page headers, text boxes या exact fonts थोड़ा बदल सकते हैं।" />
    </div>
  );
}

interface ParsedSheet { name: string; rows: string[][] }
interface ParsedWorkbook { sheets: ParsedSheet[]; truncated: boolean }

function localElements(parent: Document | Element, name: string) {
  return Array.from(parent.getElementsByTagNameNS("*", name));
}

function parseXml(source: string) {
  const documentNode = new DOMParser().parseFromString(source, "application/xml");
  if (documentNode.querySelector("parsererror")) throw new Error("Excel file का XML सही नहीं है।");
  return documentNode;
}

function columnIndex(reference: string) {
  const letters = reference.match(/^[A-Z]+/iu)?.[0].toUpperCase() ?? "A";
  return Array.from(letters).reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function looksLikeDateFormat(format: string) {
  return /(^|[^\\])[dmyhs]/iu.test(format.replace(/\[[^\]]+\]/gu, ""));
}

function excelDate(serial: number, includeTime: boolean) {
  const milliseconds = Date.UTC(1899, 11, 30) + serial * 86_400_000;
  const date = new Date(milliseconds);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  if (!includeTime) return `${day}/${month}/${year}`;
  return `${day}/${month}/${year} ${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

async function parseXlsx(file: File): Promise<ParsedWorkbook> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const workbookSource = await zip.file("xl/workbook.xml")?.async("string");
  const relationshipsSource = await zip.file("xl/_rels/workbook.xml.rels")?.async("string");
  if (!workbookSource || !relationshipsSource) throw new Error("यह सही .xlsx workbook नहीं है।");

  const workbook = parseXml(workbookSource);
  const relationships = parseXml(relationshipsSource);
  const relationshipMap = new Map(localElements(relationships, "Relationship").map((element) => [element.getAttribute("Id") ?? "", element.getAttribute("Target") ?? ""]));
  const sheetMeta = localElements(workbook, "sheet").map((element) => ({
    name: element.getAttribute("name") ?? "Sheet",
    relationshipId: element.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") ?? element.getAttribute("r:id") ?? "",
  }));

  const sharedStringsSource = await zip.file("xl/sharedStrings.xml")?.async("string");
  const sharedStrings = sharedStringsSource
    ? localElements(parseXml(sharedStringsSource), "si").map((item) => localElements(item, "t").map((text) => text.textContent ?? "").join(""))
    : [];

  const customFormats = new Map<number, string>();
  const styleFormats: number[] = [];
  const stylesSource = await zip.file("xl/styles.xml")?.async("string");
  if (stylesSource) {
    const styles = parseXml(stylesSource);
    localElements(styles, "numFmt").forEach((element) => customFormats.set(Number(element.getAttribute("numFmtId")), element.getAttribute("formatCode") ?? ""));
    const cellXfs = localElements(styles, "cellXfs")[0];
    if (cellXfs) localElements(cellXfs, "xf").forEach((element) => styleFormats.push(Number(element.getAttribute("numFmtId") ?? 0)));
  }

  let truncated = false;
  const sheets: ParsedSheet[] = [];
  for (const metadata of sheetMeta) {
    const target = relationshipMap.get(metadata.relationshipId);
    if (!target) continue;
    const path = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\.\//u, "")}`;
    const sheetSource = await zip.file(path)?.async("string");
    if (!sheetSource) continue;
    const sheet = parseXml(sheetSource);
    const cells = localElements(sheet, "c");
    const rows: string[][] = [];
    for (const cell of cells) {
      const reference = cell.getAttribute("r") ?? "A1";
      const rowIndex = Math.max(0, Number(reference.match(/\d+$/u)?.[0] ?? 1) - 1);
      const colIndex = columnIndex(reference);
      if (rowIndex >= 250 || colIndex >= 40) { truncated = true; continue; }
      while (rows.length <= rowIndex) rows.push([]);
      while (rows[rowIndex].length <= colIndex) rows[rowIndex].push("");
      const type = cell.getAttribute("t") ?? "n";
      const valueElement = localElements(cell, "v")[0];
      const raw = valueElement?.textContent ?? "";
      let value = raw;
      if (type === "s") value = sharedStrings[Number(raw)] ?? "";
      else if (type === "inlineStr") value = localElements(cell, "t").map((item) => item.textContent ?? "").join("");
      else if (type === "b") value = raw === "1" ? "TRUE" : "FALSE";
      else if (type === "e") value = `Error: ${raw}`;
      else if (raw && Number.isFinite(Number(raw))) {
        const styleIndex = Number(cell.getAttribute("s") ?? 0);
        const formatId = styleFormats[styleIndex] ?? 0;
        const format = customFormats.get(formatId) ?? "";
        const builtInDate = (formatId >= 14 && formatId <= 22) || (formatId >= 45 && formatId <= 47);
        if (builtInDate || looksLikeDateFormat(format)) value = excelDate(Number(raw), /[hs]/iu.test(format) || (formatId >= 18 && formatId <= 22));
      }
      rows[rowIndex][colIndex] = value;
    }
    const usedRows = rows.map((row) => {
      const last = row.findLastIndex((value) => value !== "");
      return last >= 0 ? row.slice(0, last + 1) : [];
    });
    while (usedRows.length && usedRows[usedRows.length - 1].length === 0) usedRows.pop();
    sheets.push({ name: metadata.name, rows: usedRows });
  }
  if (!sheets.length) throw new Error("Workbook में कोई readable sheet नहीं मिली।");
  return { sheets, truncated };
}

export function ExcelToPdfWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [orientation, setOrientation] = useState<PdfOrientation>("landscape");
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  async function selectFile(selected: File) {
    setError(""); setMessage("");
    if (!selected.name.toLowerCase().endsWith(".xlsx")) { setError("केवल .xlsx Excel file चुनें। पुरानी .xls file को पहले Excel में .xlsx के रूप में save करें।"); return; }
    if (selected.size > 20 * 1024 * 1024) { setError("Excel file का आकार 20 MB से कम रखें।"); return; }
    setIsWorking(true);
    try {
      const parsed = await parseXlsx(selected);
      setFile(selected); setWorkbook(parsed); setSheetIndex(0);
      setMessage(parsed.truncated ? "Preview तैयार है। बड़ी sheet में पहली 250 rows और 40 columns लिए गए हैं।" : "Workbook तैयार है। Sheet चुनकर PDF download करें।");
    } catch (caughtError) { setFile(null); setWorkbook(null); setError(caughtError instanceof Error ? caughtError.message : "Excel file नहीं खुल सकी।"); }
    finally { setIsWorking(false); }
  }

  async function makePdf() {
    if (!file || !workbook || !previewRef.current) return;
    setIsWorking(true); setError(""); setMessage("PDF तैयार हो रही है…");
    try {
      const sheetName = workbook.sheets[sheetIndex]?.name.replace(/[^a-z0-9\u0900-\u097f_-]+/giu, "-") || "sheet";
      await exportElementToPdf(previewRef.current, `${file.name.replace(/\.xlsx$/iu, "")}-${sheetName}.pdf`, orientation);
      setMessage("Excel sheet की PDF download हो गई।");
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "PDF नहीं बन सकी।"); setMessage(""); }
    finally { setIsWorking(false); }
  }

  const activeSheet = workbook?.sheets[sheetIndex];

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 bg-[#f8faf9] px-6 py-10 text-center hover:border-[#7aa596]"><span className="text-4xl" aria-hidden="true">📊</span><strong className="mt-3 block text-xl">Excel file चुनें</strong><span className="mt-2 block text-sm text-slate-500">.xlsx • अधिकतम 20 MB</span><input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" disabled={isWorking} onChange={(event) => { const selected = event.target.files?.[0]; if (selected) void selectFile(selected); event.target.value = ""; }} /></label>
        {workbook && <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2"><label className="text-sm font-extrabold text-slate-700">Sheet<select value={sheetIndex} onChange={(event) => setSheetIndex(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3"><option value="" disabled>Sheet चुनें</option>{workbook.sheets.map((sheet, index) => <option key={`${sheet.name}-${index}`} value={index}>{sheet.name}</option>)}</select></label><label className="text-sm font-extrabold text-slate-700">Page<select value={orientation} onChange={(event) => setOrientation(event.target.value as PdfOrientation)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3"><option value="landscape">Landscape</option><option value="portrait">Portrait</option></select></label></div>}
        {activeSheet && <div className="mt-7"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black text-slate-950">{activeSheet.name}</h2><p className="text-xs text-slate-500">{activeSheet.rows.length} rows preview</p></div><button type="button" onClick={() => void makePdf()} disabled={isWorking || !activeSheet.rows.length} className="rounded-full bg-[#173f35] px-6 py-3 font-black text-white disabled:opacity-50">{isWorking ? "तैयार हो रही है…" : "PDF Download करें"}</button></div><div className="max-h-[42rem] overflow-auto rounded-2xl border border-slate-300 bg-slate-100 p-3"><div ref={previewRef} className="inline-block min-h-80 min-w-[1000px] bg-white p-8 text-sm text-slate-950"><h2 className="mb-5 text-xl font-black">{activeSheet.name}</h2>{activeSheet.rows.length ? <table className="border-collapse"><tbody>{activeSheet.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, colIndex) => <td key={colIndex} className={`min-w-28 whitespace-pre-wrap border border-slate-400 px-3 py-2 align-top ${rowIndex === 0 ? "bg-slate-100 font-bold" : ""}`}>{value}</td>)}</tr>)}</tbody></table> : <p className="text-slate-500">इस sheet में data नहीं है।</p>}</div></div></div>}
        {error && <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
        {message && <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800">{message}</p>}
      </section>
      <PrivacyAside note="यह tool .xlsx की cell values और basic table layout बनाता है। Charts, macros, conditional formatting, merged-cell design और exact print settings पूरी तरह समान नहीं रह सकते।" />
    </div>
  );
}
