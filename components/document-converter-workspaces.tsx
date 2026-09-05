"use client";

import { useRef, useState, type CSSProperties } from "react";
import { renderAsync as renderDocx } from "docx-preview";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { krutiDevToUnicode } from "@/lib/tools/unicode-to-krutidev";
import {
  parseXlsx,
  type ExcelBorderSide,
  type ExcelCellStyle,
  type ExcelMerge,
  type ParsedSheet,
  type ParsedWorkbook,
} from "@/lib/tools/xlsx-preview";

type PdfOrientation = "portrait" | "landscape";
type WordPdfMode = "original" | "unicode";

const PDF_RENDER_SCALE = 1.35;
const EXCEL_PDF_RENDER_SCALE = 2;
// DevLys/Kruti report legacy GDI font metrics that place their browser ink
// about half an em below Excel's cell baseline.
const EXCEL_LEGACY_BASELINE_SHIFT = "-0.42em";
const HINDI_FONT_STACK = '"Noto Sans Devanagari", "Nirmala UI", Mangal, sans-serif';
const LEGACY_FONT_STACK = '"DevLys 010", "Kruti Dev 010", serif';
const UNICODE_HINDI_FONT = "Noto Sans Devanagari";
const WORD_PREVIEW_CLASS = "office-word-docx";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

  function applyUnicodeFont(run: Element, documentNode: Document) {
    let runProperties = localElements(run, "rPr")[0];
    if (!runProperties) {
      runProperties = documentNode.createElementNS(WORDPROCESSING_NAMESPACE, "w:rPr");
      run.insertBefore(runProperties, run.firstChild);
    }
    let fonts = localElements(runProperties, "rFonts")[0];
    if (!fonts) {
      fonts = documentNode.createElementNS(WORDPROCESSING_NAMESPACE, "w:rFonts");
      runProperties.insertBefore(fonts, runProperties.firstChild);
    }
    for (const attribute of ["ascii", "hAnsi", "eastAsia", "cs"]) {
      fonts.setAttributeNS(WORDPROCESSING_NAMESPACE, `w:${attribute}`, UNICODE_HINDI_FONT);
    }
  }

  const contentPartNames = Object.keys(zip.files).filter((name) => /^word\/(?:document|header\d+|footer\d+|footnotes|endnotes|comments)\.xml$/u.test(name));

  for (const partName of contentPartNames) {
    const partFile = zip.file(partName);
    if (!partFile) continue;
    const partXml = parseXml(await partFile.async("string"));

    for (const run of localElements(partXml, "r")) {
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
      if (!runChanged) continue;
      applyUnicodeFont(run, partXml);
      convertedRuns += 1;
    }
    if (partName !== "word/document.xml" || convertedRuns) {
      zip.file(partName, new XMLSerializer().serializeToString(partXml));
    }
  }

  if (!convertedRuns) return { arrayBuffer, convertedRuns };
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

function makePdfCloneColorSafe(clonedDocument: Document, clonedElement: HTMLElement) {
  const elements = [clonedElement, ...Array.from(clonedElement.querySelectorAll<HTMLElement>("*"))];
  const colorFallbacks: Record<string, string> = {
    "background-color": "transparent",
    "border-bottom-color": "#94a3b8",
    "border-left-color": "#94a3b8",
    "border-right-color": "#94a3b8",
    "border-top-color": "#94a3b8",
    "caret-color": "#0f172a",
    color: "#0f172a",
    fill: "#0f172a",
    "outline-color": "transparent",
    stroke: "#0f172a",
    "text-decoration-color": "#0f172a",
  };

  for (const element of elements) {
    const computed = clonedDocument.defaultView?.getComputedStyle(element);
    if (!computed) continue;
    for (const [property, fallback] of Object.entries(colorFallbacks)) {
      const value = computed.getPropertyValue(property);
      if (/\b(?:lab|lch|oklab|oklch|color)\s*\(/iu.test(value)) {
        element.style.setProperty(property, element === clonedElement && property === "background-color" ? "#ffffff" : fallback, "important");
      }
    }
  }
}

function renderedWordPages(element: HTMLElement) {
  const pages = Array.from(element.querySelectorAll<HTMLElement>(`section.${WORD_PREVIEW_CLASS}`));
  return pages.length ? pages : [element];
}

async function exportWordPreviewToPdf(
  preview: HTMLElement,
  fileName: string,
  onProgress?: (completedPages: number, totalPages: number) => void,
) {
  await Promise.all([
    document.fonts.load(`400 16px ${HINDI_FONT_STACK}`, "हिन्दी कार्यालय सहायक"),
    document.fonts.load(`400 20px ${LEGACY_FONT_STACK}`, "dk;kZy; vads{k.k"),
  ]);
  await document.fonts.ready;
  const pages = renderedWordPages(preview);
  await Promise.all(pages.map(waitForImages));

  const pageGeometry = pages.map((page) => {
    const width = Math.ceil(Math.max(page.scrollWidth, page.clientWidth));
    const height = Math.ceil(Math.max(page.scrollHeight, page.clientHeight));
    if (!width || !height || width > 6000 || height > 18000) {
      throw new Error("किसी Word page का आकार PDF बनाने के लिए असामान्य रूप से बड़ा है। Word file में page break लगाकर फिर प्रयास करें।");
    }
    return { page, width, height, widthPoints: width * 0.75, heightPoints: height * 0.75 };
  });
  if (pageGeometry.length > 600) throw new Error("इस document में 600 से अधिक PDF pages हैं। कृपया इसे दो files में बाँटें।");

  let pdf: jsPDF | null = null;
  for (let pageIndex = 0; pageIndex < pageGeometry.length; pageIndex += 1) {
    const { page, width, height, widthPoints, heightPoints } = pageGeometry[pageIndex];
    const orientation = widthPoints > heightPoints ? "landscape" : "portrait";
    const pageCanvas = await html2canvas(page, {
      backgroundColor: "#ffffff",
      height,
      logging: false,
      onclone: (clonedDocument, clonedElement) => makePdfCloneColorSafe(clonedDocument, clonedElement),
      scale: PDF_RENDER_SCALE,
      useCORS: false,
      width,
      windowHeight: height,
      windowWidth: width,
    });

    if (!pdf) {
      pdf = new jsPDF({ orientation, unit: "pt", format: [widthPoints, heightPoints], compress: true });
    } else {
      pdf.addPage([widthPoints, heightPoints], orientation);
    }
    pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.94), "JPEG", 0, 0, widthPoints, heightPoints, undefined, "FAST");
    pageCanvas.width = 1;
    pageCanvas.height = 1;
    onProgress?.(pageIndex + 1, pageGeometry.length);
  }
  if (!pdf) throw new Error("PDF के लिए कोई Word page नहीं मिला।");
  pdf.save(fileName);
}

function excelPaperPoints(paperSize: number, orientation: PdfOrientation) {
  const portrait = paperSize === 1 ? [612, 792]
    : paperSize === 5 ? [612, 1008]
      : paperSize === 8 ? [841.89, 1190.55]
        : [595.28, 841.89];
  return orientation === "landscape"
    ? { width: Math.max(...portrait), height: Math.min(...portrait) }
    : { width: Math.min(...portrait), height: Math.max(...portrait) };
}

function excelHeaderFooterText(source: string, pageNumber: number, totalPages: number, sheetName: string, fileName: string) {
  const escapedAmpersand = "\u0000";
  return source
    .replace(/&&/gu, escapedAmpersand)
    .replace(/&"[^"]*"/gu, "")
    .replace(/&\d+/gu, "")
    .replace(/&P/giu, String(pageNumber))
    .replace(/&N/giu, String(totalPages))
    .replace(/&A/giu, sheetName)
    .replace(/&F/giu, fileName)
    .replace(/&[BDTEUGSXY]/giu, "")
    .replaceAll(escapedAmpersand, "&")
    .trim();
}

function excelHeaderFooterSections(source: string, pageNumber: number, totalPages: number, sheetName: string, fileName: string) {
  const sections = { left: "", center: "", right: "" };
  let position: keyof typeof sections = "right";
  for (const part of source.split(/(&[LCR])/giu)) {
    if (/^&L$/iu.test(part)) position = "left";
    else if (/^&C$/iu.test(part)) position = "center";
    else if (/^&R$/iu.test(part)) position = "right";
    else sections[position] += part;
  }
  return Object.fromEntries(Object.entries(sections).map(([key, value]) => [
    key, excelHeaderFooterText(value, pageNumber, totalPages, sheetName, fileName),
  ])) as typeof sections;
}

function addExcelHeaderFooter(
  page: HTMLElement,
  source: string,
  location: "footer" | "header",
  offsetPixels: number,
  pageNumber: number,
  totalPages: number,
  sheetName: string,
  fileName: string,
) {
  const sections = excelHeaderFooterSections(source, pageNumber, totalPages, sheetName, fileName);
  for (const [position, text] of Object.entries(sections)) {
    if (!text) continue;
    const element = document.createElement("div");
    element.textContent = text;
    element.style.position = "absolute";
    element.style[location === "header" ? "top" : "bottom"] = `${Math.max(4, offsetPixels - 9)}px`;
    element.style.font = "14px Arial, sans-serif";
    element.style.lineHeight = "18px";
    element.style.whiteSpace = "pre";
    element.style.backgroundColor = "#ffffff";
    element.style.left = "32px";
    element.style.right = "32px";
    element.style.textAlign = position;
    element.style.zIndex = "2147483647";
    page.append(element);
  }
}

export async function exportExcelPreviewToPdf(
  preview: HTMLElement,
  sheet: ParsedSheet,
  fileName: string,
  orientation: PdfOrientation,
  onProgress?: (completedPages: number, totalPages: number) => void,
) {
  await Promise.all([
    document.fonts.load(`400 16px ${HINDI_FONT_STACK}`, "हिन्दी कार्यालय सहायक"),
    document.fonts.load(`400 16px ${LEGACY_FONT_STACK}`, "lnL;rk lwph"),
  ]);
  await document.fonts.ready;
  const table = preview.querySelector<HTMLTableElement>("table[data-excel-table]");
  const tableBody = table?.tBodies[0];
  if (!table || !tableBody) throw new Error("Excel preview में printable table नहीं मिली।");
  const rowElements = Array.from(tableBody.rows);
  if (!rowElements.length) throw new Error("इस sheet में PDF बनाने योग्य data नहीं है।");

  const paper = excelPaperPoints(sheet.page.paperSize, orientation);
  const pageWidthPixels = paper.width / 0.75;
  const pageHeightPixels = paper.height / 0.75;
  const marginLeftPixels = sheet.page.marginLeftInches * 96;
  const marginRightPixels = sheet.page.marginRightInches * 96;
  const marginTopPixels = sheet.page.marginTopInches * 96;
  const marginBottomPixels = sheet.page.marginBottomInches * 96;
  const tableWidthPixels = table.getBoundingClientRect().width;
  const printableWidthPixels = pageWidthPixels - marginLeftPixels - marginRightPixels;
  const printableHeightPixels = pageHeightPixels - marginTopPixels - marginBottomPixels;
  const contentScale = Math.min(1, printableWidthPixels / Math.max(1, tableWidthPixels));
  const sourcePageHeight = printableHeightPixels / Math.max(0.01, contentScale);
  const tolerancePixels = 10 / 0.75 / Math.max(0.01, contentScale);
  const manualBreaks = new Set(sheet.manualRowBreaks);
  const repeatRowIndexes = new Set(rowElements.flatMap((row, index) => {
    const rowNumber = Number(row.dataset.rowNumber ?? 0) - 1;
    return sheet.repeatRows && rowNumber >= sheet.repeatRows.startRow && rowNumber <= sheet.repeatRows.endRow ? [index] : [];
  }));
  const repeatRowsHeight = Array.from(repeatRowIndexes)
    .reduce((total, index) => total + rowElements[index].getBoundingClientRect().height, 0);
  const groups: Array<{ start: number; end: number }> = [];
  let start = 0;
  let accumulatedHeight = 0;
  let currentPageHeight = sourcePageHeight;

  for (let index = 0; index < rowElements.length; index += 1) {
    const rowNumber = Number(rowElements[index].dataset.rowNumber ?? 0);
    const rowHeight = rowElements[index].getBoundingClientRect().height;
    const manualBreak = index > start && manualBreaks.has(rowNumber - 1);
    if (index > start && (manualBreak || accumulatedHeight + rowHeight > currentPageHeight + tolerancePixels)) {
      groups.push({ start, end: index - 1 });
      start = index;
      accumulatedHeight = 0;
      currentPageHeight = Math.max(rowHeight, sourcePageHeight - repeatRowsHeight);
    }
    accumulatedHeight += rowHeight;
  }
  groups.push({ start, end: rowElements.length - 1 });
  if (groups.length > 300) throw new Error("इस sheet में 300 से अधिक PDF pages बन रहे हैं। कृपया इसे दो files में बाँटें।");

  const pdf = new jsPDF({ orientation, unit: "pt", format: [paper.width, paper.height], compress: true });
  for (let pageIndex = 0; pageIndex < groups.length; pageIndex += 1) {
    const group = groups[pageIndex];
    const page = document.createElement("div");
    page.style.background = "#ffffff";
    page.style.height = `${pageHeightPixels}px`;
    page.style.left = "-12000px";
    page.style.overflow = "hidden";
    page.style.position = "fixed";
    page.style.top = "0";
    page.style.width = `${pageWidthPixels}px`;

    const content = document.createElement("div");
    content.style.left = `${marginLeftPixels}px`;
    content.style.position = "absolute";
    content.style.top = `${marginTopPixels}px`;
    content.style.transform = `scale(${contentScale})`;
    content.style.transformOrigin = "top left";
    content.style.width = `${tableWidthPixels}px`;
    const clonedTable = table.cloneNode(true) as HTMLTableElement;
    clonedTable.style.margin = "0";
    clonedTable.style.width = `${tableWidthPixels}px`;
    Array.from(clonedTable.tBodies[0].rows).forEach((row, index) => {
      const inPageGroup = index >= group.start && index <= group.end;
      const repeatedTitle = pageIndex > 0 && repeatRowIndexes.has(index);
      if (!inPageGroup && !repeatedTitle) row.remove();
    });
    const pageRows = Array.from(clonedTable.tBodies[0].rows);
    const lastPageRow = pageRows.at(-1);
    if (lastPageRow) {
      for (const cell of Array.from(lastPageRow.cells)) {
        const bottomBorder = cell.dataset.excelPageBottomBorder;
        if (bottomBorder) {
          cell.dataset.excelBorderBottom = bottomBorder;
          applyExcelCellBorderBackground(cell, {
            bottom: bottomBorder,
            left: cell.dataset.excelBorderLeft,
            right: cell.dataset.excelBorderRight,
            top: cell.dataset.excelBorderTop,
          });
        }
      }
    }
    content.append(clonedTable);
    page.append(content);
    addExcelHeaderFooter(page, sheet.page.oddHeader, "header", sheet.page.headerMarginInches * 96, pageIndex + 1, groups.length, sheet.name, fileName);
    addExcelHeaderFooter(page, sheet.page.oddFooter, "footer", sheet.page.footerMarginInches * 96, pageIndex + 1, groups.length, sheet.name, fileName);
    document.body.append(page);

    try {
      const canvas = await html2canvas(page, {
        backgroundColor: "#ffffff",
        height: Math.ceil(pageHeightPixels),
        logging: false,
        onclone: (clonedDocument, clonedElement) => makePdfCloneColorSafe(clonedDocument, clonedElement),
        scale: EXCEL_PDF_RENDER_SCALE,
        useCORS: false,
        width: Math.ceil(pageWidthPixels),
        windowHeight: Math.ceil(pageHeightPixels),
        windowWidth: Math.ceil(pageWidthPixels),
      });
      if (pageIndex > 0) pdf.addPage([paper.width, paper.height], orientation);
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", 0, 0, paper.width, paper.height, undefined, "FAST");
      canvas.width = 1;
      canvas.height = 1;
      onProgress?.(pageIndex + 1, groups.length);
    } finally {
      page.remove();
    }
  }
  pdf.save(fileName);
}

function PrivacyAside({ note, privacyText = "Conversion आपके browser में होती है। Document किसी server पर upload नहीं किया जाता।" }: { note: string; privacyText?: string }) {
  return (
    <aside className="space-y-4">
      <div className="rounded-3xl bg-[#173f35] p-6 text-white"><span className="text-3xl" aria-hidden="true">🔒</span><h2 className="mt-4 text-xl font-black">File निजी रहती है</h2><p className="mt-2 text-sm leading-6 text-white/70">{privacyText}</p></div>
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><strong className="block">ध्यान दें</strong>{note}</div>
    </aside>
  );
}

export function WordToPdfWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [wordMode, setWordMode] = useState<WordPdfMode>("original");
  const [hasPreview, setHasPreview] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  function changeWordMode(nextMode: WordPdfMode) {
    if (nextMode === wordMode) return;
    setWordMode(nextMode);
    setFile(null);
    setHasPreview(false);
    setMessage("");
    setError("");
    previewRef.current?.replaceChildren();
  }

  async function selectFile(selected: File) {
    setError(""); setMessage("");
    if (!selected.name.toLowerCase().endsWith(".docx")) { setError("केवल .docx Word file चुनें।"); return; }
    if (selected.size > 15 * 1024 * 1024) { setError("Word file का आकार 15 MB से कम रखें।"); return; }
    if (!previewRef.current) { setError("Word preview तैयार नहीं हो सकी। Page refresh करके फिर प्रयास करें।"); return; }
    setIsWorking(true);
    try {
      const sourceBuffer = await selected.arrayBuffer();
      const normalizedDocument = wordMode === "unicode"
        ? await normalizeLegacyHindiRuns(sourceBuffer)
        : { arrayBuffer: sourceBuffer, convertedRuns: 0 };
      if (wordMode === "original") {
        await document.fonts.load(`400 20px ${LEGACY_FONT_STACK}`, "dk;kZy; vads{k.k");
        await document.fonts.ready;
      }
      previewRef.current.replaceChildren();
      await renderDocx(normalizedDocument.arrayBuffer, previewRef.current, previewRef.current, {
        breakPages: true,
        className: WORD_PREVIEW_CLASS,
        experimental: true,
        ignoreLastRenderedPageBreak: false,
        inWrapper: true,
        renderComments: false,
        renderEndnotes: true,
        renderFooters: true,
        renderFootnotes: true,
        renderHeaders: true,
        useBase64URL: true,
      });
      if (!previewRef.current.querySelector(`section.${WORD_PREVIEW_CLASS}`)) throw new Error("इस Word file में पढ़ने योग्य content नहीं मिला।");
      setFile(selected);
      setHasPreview(true);
      if (wordMode === "original") {
        setMessage("DevLys/Kruti Dev font और Word की मूल page setting वाला preview तैयार है। अब PDF download कर सकते हैं।");
      } else {
        const legacyNote = normalizedDocument.convertedRuns ? `${normalizedDocument.convertedRuns} Kruti Dev/DevLys text runs Unicode Hindi में बदले गए। ` : "";
        setMessage(`${legacyNote}Unicode Hindi preview तैयार है। Font बदलने के कारण line spacing और page breaks मूल Word से अलग हो सकते हैं।`);
      }
    } catch (caughtError) {
      previewRef.current?.replaceChildren();
      setFile(null); setHasPreview(false); setError(caughtError instanceof Error ? caughtError.message : "Word file नहीं खुल सकी।");
    } finally { setIsWorking(false); }
  }

  async function makePdf() {
    if (!file || !previewRef.current) return;
    setIsWorking(true); setError(""); setMessage("PDF तैयार हो रही है…");
    try {
      await exportWordPreviewToPdf(
        previewRef.current,
        `${file.name.replace(/\.docx$/iu, "")}.pdf`,
        (completed, total) => setMessage(`PDF page ${completed}/${total} तैयार हो गया…`),
      );
      setMessage("PDF download हो गई।");
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "PDF नहीं बन सकी।"); setMessage(""); }
    finally { setIsWorking(false); }
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <fieldset className="mb-6">
          <legend className="mb-3 text-sm font-black text-slate-900">PDF का प्रकार चुनें</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={`cursor-pointer rounded-2xl border p-4 transition ${wordMode === "original" ? "border-emerald-700 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <input type="radio" name="word-pdf-mode" value="original" checked={wordMode === "original"} disabled={isWorking} className="sr-only" onChange={() => changeWordMode("original")} />
              <strong className="block text-sm text-slate-950">मूल Word जैसा</strong>
              <span className="mt-1 block text-xs leading-5 text-slate-600">DevLys/Kruti Dev font, spacing और page breaks सुरक्षित।</span>
            </label>
            <label className={`cursor-pointer rounded-2xl border p-4 transition ${wordMode === "unicode" ? "border-emerald-700 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <input type="radio" name="word-pdf-mode" value="unicode" checked={wordMode === "unicode"} disabled={isWorking} className="sr-only" onChange={() => changeWordMode("unicode")} />
              <strong className="block text-sm text-slate-950">Unicode Hindi</strong>
              <span className="mt-1 block text-xs leading-5 text-slate-600">Search/copy योग्य Hindi; layout थोड़ा बदल सकता है।</span>
            </label>
          </div>
        </fieldset>
        <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 bg-[#f8faf9] px-6 py-10 text-center hover:border-[#7aa596]"><span className="text-4xl" aria-hidden="true">📄</span><strong className="mt-3 block text-xl">Word file चुनें</strong><span className="mt-2 block text-sm text-slate-500">.docx • अधिकतम 15 MB</span><input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" disabled={isWorking} onChange={(event) => { const selected = event.target.files?.[0]; if (selected) void selectFile(selected); event.target.value = ""; }} /></label>
        {file && <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"><div className="min-w-0"><strong className="block truncate text-slate-900">{file.name}</strong><span className="text-xs font-semibold text-slate-500">{formatBytes(file.size)}</span></div><span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-800">Page size Word file से</span></div>}
        <div className={hasPreview ? "mt-7" : "pointer-events-none fixed -left-[10000px] top-0 w-[1000px] opacity-0"} aria-hidden={hasPreview ? undefined : true}>
          {hasPreview && <div className="mb-3 flex items-center justify-between gap-4"><h2 className="text-lg font-black text-slate-950">PDF Preview</h2><button type="button" onClick={() => void makePdf()} disabled={isWorking} className="rounded-full bg-[#173f35] px-6 py-3 font-black text-white disabled:opacity-50">{isWorking ? "तैयार हो रही है…" : "PDF Download करें"}</button></div>}
          <div className={hasPreview ? "max-h-[42rem] overflow-auto rounded-2xl border border-slate-300 bg-slate-200 p-3" : ""}><div ref={previewRef} className={`word-pdf-preview min-w-max ${wordMode === "original" ? "word-pdf-preview-original" : ""}`} /></div>
        </div>
        {error && <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
        {message && <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800">{message}</p>}
      </section>
      <PrivacyAside note="मूल Word जैसा mode DevLys/Kruti Dev font और page setting सुरक्षित रखता है। Unicode Hindi mode में font metrics बदलने के कारण spacing और page breaks अलग हो सकते हैं।" />
    </div>
  );
}

function localElements(parent: Document | Element, name: string) {
  return Array.from(parent.getElementsByTagNameNS("*", name));
}

function parseXml(source: string) {
  const documentNode = new DOMParser().parseFromString(source, "application/xml");
  if (documentNode.querySelector("parsererror")) throw new Error("Excel file का XML सही नहीं है।");
  return documentNode;
}

function excelBorderCss(border: ExcelBorderSide | undefined) {
  if (!border) return undefined;
  const width = border.style === "hair" ? "1px"
    : /medium/iu.test(border.style) ? "2px"
      : /thick/iu.test(border.style) ? "3px"
        : "1px";
  const style = border.style === "double" ? "double"
    : /dash|dot/iu.test(border.style) ? "dashed"
      : "solid";
  return `${width} ${style} ${border.color}`;
}

type ExcelBorderEdge = "bottom" | "left" | "right" | "top";

function excelCellBorderCss(style: ExcelCellStyle, edge: ExcelBorderEdge) {
  const border = edge === "bottom" ? style.borderBottom
    : edge === "left" ? style.borderLeft
      : edge === "right" ? style.borderRight
        : style.borderTop;
  return excelBorderCss(border);
}

function excelBorderLayerThickness(border?: string) {
  const width = border?.match(/^([\d.]+)px\s/iu)?.[1];
  return Math.max(1, Number(width) || 1);
}

function excelBorderLayerBackground(border: string | undefined, direction: "horizontal" | "vertical") {
  const match = border?.match(/^[\d.]+px\s+(solid|dashed|double)\s+(.+)$/iu);
  if (!match) return undefined;
  const [, style, color] = match;
  const axis = direction === "horizontal" ? "to right" : "to bottom";
  if (style.toLowerCase() === "dashed") {
    const dash = Math.max(3, excelBorderLayerThickness(border) * 3);
    return `repeating-linear-gradient(${axis}, ${color} 0, ${color} ${dash}px, transparent ${dash}px, transparent ${dash * 2}px)`;
  }
  if (style.toLowerCase() === "double") {
    const crossAxis = direction === "horizontal" ? "to bottom" : "to right";
    return `linear-gradient(${crossAxis}, ${color} 0 33%, transparent 33% 67%, ${color} 67% 100%)`;
  }
  return `linear-gradient(${color}, ${color})`;
}

type ExcelCellBorderBackground = {
  bottom?: string;
  left?: string;
  right?: string;
  top?: string;
};

function excelCellBorderBackgroundCss({ bottom, left, right, top }: ExcelCellBorderBackground): CSSProperties {
  const layers = [
    top ? { image: excelBorderLayerBackground(top, "horizontal"), position: "left top", size: `100% ${excelBorderLayerThickness(top)}px` } : undefined,
    right ? { image: excelBorderLayerBackground(right, "vertical"), position: "right top", size: `${excelBorderLayerThickness(right)}px 100%` } : undefined,
    bottom ? { image: excelBorderLayerBackground(bottom, "horizontal"), position: "left bottom", size: `100% ${excelBorderLayerThickness(bottom)}px` } : undefined,
    left ? { image: excelBorderLayerBackground(left, "vertical"), position: "left top", size: `${excelBorderLayerThickness(left)}px 100%` } : undefined,
  ].filter((layer): layer is { image: string; position: string; size: string } => Boolean(layer?.image));
  if (!layers.length) return {};
  return {
    backgroundImage: layers.map((layer) => layer.image).join(", "),
    backgroundPosition: layers.map((layer) => layer.position).join(", "),
    backgroundRepeat: layers.map(() => "no-repeat").join(", "),
    backgroundSize: layers.map((layer) => layer.size).join(", "),
  };
}

function applyExcelCellBorderBackground(element: HTMLElement, borders: ExcelCellBorderBackground) {
  const background = excelCellBorderBackgroundCss(borders);
  element.style.backgroundImage = background.backgroundImage?.toString() ?? "";
  element.style.backgroundPosition = background.backgroundPosition?.toString() ?? "";
  element.style.backgroundRepeat = background.backgroundRepeat?.toString() ?? "";
  element.style.backgroundSize = background.backgroundSize?.toString() ?? "";
}

function excelCellCss(style: ExcelCellStyle, value: string): CSSProperties {
  const isLegacy = /devlys|kruti\s*dev/iu.test(style.fontFamily);
  const lineHeight = 1.05;
  const autoCenterBottom = style.hasBorder && style.vertical === "bottom";
  return {
    backgroundColor: style.backgroundColor,
    boxSizing: "border-box",
    color: style.color,
    fontFamily: isLegacy ? `"${style.fontFamily}", ${LEGACY_FONT_STACK}` : `"${style.fontFamily}", Arial, sans-serif`,
    fontSize: `${style.fontSizePoints}pt`,
    fontStyle: style.italic ? "italic" : "normal",
    fontWeight: style.bold ? 700 : 400,
    lineHeight,
    overflow: style.wrapText ? "hidden" : "visible",
    overflowWrap: style.wrapText ? (isLegacy ? "normal" : "break-word") : undefined,
    padding: autoCenterBottom ? "1px 2px" : "0 2px",
    position: "relative",
    textAlign: style.horizontal ?? (/^-?\d+(?:\.\d+)?%?$/u.test(value.trim()) ? "right" : "left"),
    textDecoration: style.underline ? "underline" : undefined,
    textOverflow: style.shrinkToFit ? "clip" : undefined,
    verticalAlign: autoCenterBottom ? "middle" : style.vertical,
    whiteSpace: style.wrapText ? "pre-wrap" : "pre",
    wordBreak: style.wrapText ? "normal" : undefined,
  };
}

function excelMergeMaps(sheet: ParsedSheet) {
  const anchors = new Map<string, ExcelMerge>();
  const covered = new Set<string>();
  for (const merge of sheet.merges) {
    anchors.set(`${merge.startRow}:${merge.startColumn}`, merge);
    for (let row = merge.startRow; row <= merge.endRow; row += 1) {
      for (let column = merge.startColumn; column <= merge.endColumn; column += 1) {
        if (row !== merge.startRow || column !== merge.startColumn) covered.add(`${row}:${column}`);
      }
    }
  }
  return { anchors, covered };
}

function ExcelSheetPreview({ sheet, styles }: { sheet: ParsedSheet; styles: ExcelCellStyle[] }) {
  const { anchors, covered } = excelMergeMaps(sheet);
  const rowsByIndex = new Map(sheet.rows.map((row) => [row.index, row]));
  const borderAt = (rowIndex: number, column: number, edge: ExcelBorderEdge) => {
    const cell = rowsByIndex.get(rowIndex)?.cells[column];
    const style = cell ? (styles[cell.styleIndex] ?? styles[0]) : styles[0];
    return excelCellBorderCss(style, edge);
  };
  const borderAcross = (rowIndex: number, startColumn: number, endColumn: number, edge: ExcelBorderEdge) => {
    for (let column = startColumn; column <= endColumn; column += 1) {
      const border = borderAt(rowIndex, column, edge);
      if (border) return border;
    }
    return undefined;
  };
  const width = sheet.columnWidthsPixels.reduce((total, columnWidth) => total + columnWidth, 0);
  return (
    <table data-excel-table className="bg-white" style={{ borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed", width: `${width}px` }}>
      <colgroup>
        {sheet.columnWidthsPixels.map((columnWidth, index) => <col key={index} style={{ width: `${columnWidth}px` }} />)}
      </colgroup>
      <tbody>
        {sheet.rows.map((row) => {
          const fixedHeight = row.customHeight ? row.heightPoints : undefined;
          return (
            <tr key={row.index} data-row-number={row.index + 1} style={{ display: row.hidden ? "none" : undefined, height: fixedHeight ? `${fixedHeight}pt` : undefined }}>
              {Array.from({ length: sheet.maxColumn - sheet.minColumn + 1 }, (_, relativeColumn) => {
                const column = sheet.minColumn + relativeColumn;
                const key = `${row.index}:${column}`;
                if (covered.has(key)) return null;
                const cell = row.cells[column] ?? { styleIndex: 0, value: "" };
                const style = styles[cell.styleIndex] ?? styles[0];
                const merge = anchors.get(key);
                const endColumn = merge?.endColumn ?? column;
                const endRow = merge?.endRow ?? row.index;
                const pageBottomBorder = borderAcross(endRow, column, endColumn, "bottom")
                  ?? borderAcross(endRow + 1, column, endColumn, "top");
                const borderBottom = endRow === sheet.maxRow ? pageBottomBorder : undefined;
                const borderLeft = borderAt(row.index, column, "left") ?? borderAt(row.index, column - 1, "right");
                const borderRight = endColumn === sheet.maxColumn ? borderAt(row.index, endColumn, "right") : undefined;
                const borderTop = borderAcross(row.index, column, endColumn, "top")
                  ?? borderAcross(row.index - 1, column, endColumn, "bottom");
                return (
                  <td
                    key={column}
                    colSpan={merge ? merge.endColumn - merge.startColumn + 1 : undefined}
                    data-excel-border-bottom={borderBottom}
                    data-excel-border-left={borderLeft}
                    data-excel-border-right={borderRight}
                    data-excel-border-top={borderTop}
                    data-excel-page-bottom-border={pageBottomBorder}
                    rowSpan={merge ? merge.endRow - merge.startRow + 1 : undefined}
                    style={{
                      ...excelCellCss(style, cell.value),
                      ...excelCellBorderBackgroundCss({ bottom: borderBottom, left: borderLeft, right: borderRight, top: borderTop }),
                      height: fixedHeight ? `${fixedHeight}pt` : undefined,
                    }}
                  >
                    <span style={{
                      display: "inline-block",
                      position: "relative",
                      transform: /devlys|kruti\s*dev/iu.test(style.fontFamily) && style.hasBorder
                        ? `translateY(${EXCEL_LEGACY_BASELINE_SHIFT})`
                        : undefined,
                      zIndex: cell.value ? 1 : undefined,
                    }}>{cell.value}</span>
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function ExcelToPdfWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function selectFile(selected: File) {
    setError(""); setMessage("");
    if (!selected.name.toLowerCase().endsWith(".xlsx")) { setError("केवल .xlsx Excel file चुनें। पुरानी .xls file को पहले Excel में .xlsx के रूप में save करें।"); return; }
    if (selected.size > 20 * 1024 * 1024) { setError("Excel file का आकार 20 MB से कम रखें।"); return; }
    setIsWorking(true);
    try {
      const parsed = await parseXlsx(selected);
      const firstDataSheet = Math.max(0, parsed.sheets.findIndex((sheet) => sheet.hasData));
      setFile(selected); setWorkbook(parsed); setSheetIndex(firstDataSheet);
      const ignored = parsed.sheets.reduce((total, sheet) => total + sheet.ignoredOutlierCells, 0);
      setMessage(ignored
        ? "Preview तैयार है। PDF में LibreOffice, Excel की वास्तविक print range और settings का उपयोग करेगा।"
        : "Preview तैयार है। Sheet चुनें; PDF Excel की वास्तविक print settings से बनेगी।");
    } catch (caughtError) { setFile(null); setWorkbook(null); setError(caughtError instanceof Error ? caughtError.message : "Excel file नहीं खुल सकी।"); }
    finally { setIsWorking(false); }
  }

  function changeSheet(nextIndex: number) {
    setSheetIndex(nextIndex);
    setMessage("Sheet चुन ली गई है। PDF Excel की वास्तविक print settings से बनेगी।");
  }

  async function makePdf() {
    const activeSheet = workbook?.sheets[sheetIndex];
    if (!file || !activeSheet) return;
    setIsWorking(true); setError(""); setMessage("LibreOffice से PDF तैयार हो रही है…");
    try {
      const sheetName = activeSheet.name.replace(/[^a-z0-9\u0900-\u097f_-]+/giu, "-") || "sheet";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sheetIndex", String(sheetIndex));
      formData.append("sheetName", activeSheet.name);
      if (activeSheet.ignoredOutlierCells > 0) {
        formData.append("minColumn", String(activeSheet.minColumn));
        formData.append("maxColumn", String(activeSheet.maxColumn));
        formData.append("minRow", String(activeSheet.minRow));
        formData.append("maxRow", String(activeSheet.maxRow));
      }
      const response = await fetch("/api/excel-to-pdf", { method: "POST", body: formData });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error || "Excel की PDF नहीं बन सकी।");
      }
      const pdf = await response.blob();
      const downloadUrl = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${file.name.replace(/\.xlsx$/iu, "")}-${sheetName}.pdf`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1_000);
      setMessage("LibreOffice से बनी Excel sheet की PDF download हो गई।");
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "PDF नहीं बन सकी।"); setMessage(""); }
    finally { setIsWorking(false); }
  }

  const activeSheet = workbook?.sheets[sheetIndex];

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 bg-[#f8faf9] px-6 py-10 text-center hover:border-[#7aa596]"><span className="text-4xl" aria-hidden="true">📊</span><strong className="mt-3 block text-xl">Excel file चुनें</strong><span className="mt-2 block text-sm text-slate-500">.xlsx • अधिकतम 20 MB</span><input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" disabled={isWorking} onChange={(event) => { const selected = event.target.files?.[0]; if (selected) void selectFile(selected); event.target.value = ""; }} /></label>
        {file && <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"><div className="min-w-0"><strong className="block truncate text-slate-900">{file.name}</strong><span className="text-xs font-semibold text-slate-500">{formatBytes(file.size)}</span></div><span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-800">LibreOffice ready</span></div>}
        {workbook && <div className="mt-5 rounded-2xl border border-slate-200 p-4"><label className="text-sm font-extrabold text-slate-700">Sheet<select value={sheetIndex} onChange={(event) => changeSheet(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3">{workbook.sheets.map((sheet, index) => <option key={`${sheet.name}-${index}`} value={index}>{sheet.name}{sheet.hasData ? "" : " (खाली)"}</option>)}</select></label><p className="mt-3 text-xs leading-5 text-slate-500">Page size, orientation, margins, print titles और page breaks Excel file से लिए जाएँगे।</p></div>}
        {activeSheet && <div className="mt-7"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black text-slate-950">{activeSheet.name}</h2><p className="text-xs text-slate-500">{activeSheet.rows.length} rows • {activeSheet.columnWidthsPixels.length} columns • PDF LibreOffice engine से</p></div><button type="button" onClick={() => void makePdf()} disabled={isWorking || !activeSheet.hasData} className="rounded-full bg-[#173f35] px-6 py-3 font-black text-white disabled:opacity-50">{isWorking ? "तैयार हो रही है…" : "PDF Download करें"}</button></div><div className="max-h-[42rem] overflow-auto rounded-2xl border border-slate-300 bg-slate-200 p-3"><div className="inline-block min-h-80 min-w-full bg-white text-slate-950">{activeSheet.hasData ? <ExcelSheetPreview sheet={activeSheet} styles={workbook?.styles ?? []} /> : <p className="p-8 text-slate-500">इस sheet में data नहीं है।</p>}</div></div></div>}
        {error && <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
        {message && <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800">{message}</p>}
      </section>
      <PrivacyAside privacyText="Excel file conversion के लिए इसी server पर अस्थायी रूप से process होती है और PDF बनते ही upload व temporary files हटा दी जाती हैं।" note="सही output के लिए server पर LibreOffice और workbook में इस्तेमाल हुए fonts उपलब्ध होने चाहिए। PDF में Excel की saved print settings लागू होंगी।" />
    </div>
  );
}
