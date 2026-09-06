"use client";

import { useMemo, useState } from "react";
import { containsDevanagari, unicodeToKrutiDev } from "@/lib/tools/unicode-to-krutidev";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_PDF_PAGES = 10;
const PDF_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.worker.min.mjs";

interface NumericHint {
  bbox: { x0: number; x1: number; y0: number; y1: number };
  priority: number;
  text: string;
}

interface OcrBbox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

interface PhotoTextWord {
  bbox: OcrBbox;
  confidence: number;
  text: string;
}

interface PhotoTextBlock {
  paragraphs: Array<{
    lines: Array<{
      bbox: OcrBbox;
      words: PhotoTextWord[];
    }>;
  }>;
}

interface PreparedPage {
  blob: Blob;
  embeddedBlocks: PhotoTextBlock[] | null;
  embeddedText: string | null;
  height: number;
  numberHints: NumericHint[];
  png: Uint8Array;
  width: number;
}

interface RecognizedTableCell {
  columnSpan: number;
  text: string;
}

interface RecognizedTable {
  bbox: OcrBbox;
  columnRatios: number[];
  pageFrame: boolean;
  rows: RecognizedTableCell[][];
}

interface RecognizedPage {
  height: number;
  numericCorrections: number;
  png: Uint8Array;
  tables: RecognizedTable[];
  text: string;
  uncertainNumbers: number;
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
          embeddedBlocks: null,
          embeddedText: null,
          height: canvas.height,
          numberHints: [],
          png: new Uint8Array(await blob.arrayBuffer()),
          width: canvas.width,
        });
      } catch (error) {
        reject(error);
      }
    }, "image/png");
  });
}

interface PdfTextItem {
  hasEOL?: boolean;
  height: number;
  str: string;
  transform: number[];
  width: number;
}

function reliableEmbeddedHindiText(text: string) {
  const devanagari = (text.match(/[\u0900-\u097f]/g) ?? []).length;
  const letters = (text.match(/[A-Za-z\u0900-\u097f]/g) ?? []).length;
  return devanagari >= 20 && devanagari / Math.max(1, letters) >= 0.45;
}

function embeddedPageText(items: PdfTextItem[]) {
  return items.map((item) => `${item.str}${item.hasEOL ? "\n" : " "}`).join("").replace(/[ \t]+\n/g, "\n").trim();
}

function embeddedNumberHints(
  items: PdfTextItem[],
  scale: number,
  transform: (left: number[], right: number[]) => number[],
  viewportTransform: number[],
) {
  const hints: NumericHint[] = [];
  for (const item of items) {
    if (!/[0-9\u0966-\u096f]/.test(item.str)) continue;
    const device = transform(viewportTransform, item.transform);
    const sourceWidth = Math.max(1, item.width * scale);
    const sourceHeight = Math.max(8, Math.abs(device[3]), item.height * scale);
    const expression = /[0-9\u0966-\u096f]+/g;
    for (const match of item.str.matchAll(expression)) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      hints.push({
        bbox: {
          x0: device[4] + sourceWidth * (start / Math.max(1, item.str.length)),
          x1: device[4] + sourceWidth * (end / Math.max(1, item.str.length)),
          y0: device[5] - sourceHeight * 1.15,
          y1: device[5] + sourceHeight * 0.25,
        },
        priority: 100,
        text: match[0],
      });
    }
  }
  return hints;
}

function embeddedPageBlocks(
  items: PdfTextItem[],
  scale: number,
  transform: (left: number[], right: number[]) => number[],
  viewportTransform: number[],
) {
  const words = items.flatMap((item) => {
    const device = transform(viewportTransform, item.transform);
    const sourceWidth = Math.max(1, item.width * scale);
    const sourceHeight = Math.max(8, Math.abs(device[3]), item.height * scale);
    return Array.from(item.str.matchAll(/\S+/gu)).map((match) => {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      return {
        bbox: {
          x0: device[4] + sourceWidth * (start / Math.max(1, item.str.length)),
          x1: device[4] + sourceWidth * (end / Math.max(1, item.str.length)),
          y0: device[5] - sourceHeight * 1.15,
          y1: device[5] + sourceHeight * 0.25,
        },
        confidence: 100,
        text: match[0],
      } satisfies PhotoTextWord;
    });
  }).sort((left, right) => center(left.bbox).y - center(right.bbox).y || left.bbox.x0 - right.bbox.x0);

  const lines: Array<{ bbox: OcrBbox; words: PhotoTextWord[] }> = [];
  for (const word of words) {
    const wordCenter = center(word.bbox);
    const line = lines.findLast((candidate) => {
      const lineCenter = center(candidate.bbox);
      const height = Math.max(word.bbox.y1 - word.bbox.y0, candidate.bbox.y1 - candidate.bbox.y0);
      return Math.abs(wordCenter.y - lineCenter.y) <= height * 0.55;
    });
    if (line) {
      line.words.push(word);
      line.words.sort((left, right) => left.bbox.x0 - right.bbox.x0);
      line.bbox = line.words.reduce((bbox, current) => ({
        x0: Math.min(bbox.x0, current.bbox.x0),
        x1: Math.max(bbox.x1, current.bbox.x1),
        y0: Math.min(bbox.y0, current.bbox.y0),
        y1: Math.max(bbox.y1, current.bbox.y1),
      }), line.bbox);
    } else {
      lines.push({ bbox: { ...word.bbox }, words: [word] });
    }
  }

  return lines.length ? [{ paragraphs: [{ lines }] }] satisfies PhotoTextBlock[] : null;
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
    const scale = Math.min(4.25, 2600 / original.width);
    const viewport = page.getViewport({ scale });
    const textContent = await page.getTextContent();
    const textItems = textContent.items.filter((item): item is typeof item & PdfTextItem => (
      "str" in item && typeof item.str === "string" && Array.isArray(item.transform)
    ));
    const hiddenText = embeddedPageText(textItems);
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport, background: "#ffffff" }).promise;
    const preparedPage = await canvasToPng(canvas);
    preparedPage.embeddedText = reliableEmbeddedHindiText(hiddenText) ? hiddenText : null;
    preparedPage.embeddedBlocks = embeddedPageBlocks(
      textItems,
      scale,
      pdfjs.Util.transform,
      Array.from(viewport.transform),
    );
    preparedPage.numberHints = embeddedNumberHints(
      textItems,
      scale,
      pdfjs.Util.transform,
      Array.from(viewport.transform),
    );
    pages.push(preparedPage);
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
  const photoScale = optimizePhoto ? Math.max(1, Math.min(3, 2800 / Math.max(bitmap.width, bitmap.height))) : 1;
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

const NUMERIC_FRAGMENT = /[0-9\u0966-\u096fOoIl|\[\]]+/g;

function digitGroups(text: string) {
  return Array.from(text.matchAll(NUMERIC_FRAGMENT)).filter((match) => /[0-9\u0966-\u096f]/.test(match[0]));
}

function asciiDigits(text: string) {
  const devanagariDigits = "\u0966\u0967\u0968\u0969\u096a\u096b\u096c\u096d\u096e\u096f";
  return Array.from(text).map((character) => {
    const devanagari = devanagariDigits.indexOf(character);
    if (devanagari >= 0) return String(devanagari);
    if (/[oO]/.test(character)) return "0";
    if (/[Il|\[\]]/.test(character)) return "1";
    return character;
  }).join("").replace(/\D/g, "");
}

function center(bbox: OcrBbox) {
  return { x: (bbox.x0 + bbox.x1) / 2, y: (bbox.y0 + bbox.y1) / 2 };
}

function overlapRatio(first: OcrBbox, second: OcrBbox) {
  const overlap = Math.max(0, Math.min(first.y1, second.y1) - Math.max(first.y0, second.y0));
  return overlap / Math.max(1, Math.min(first.y1 - first.y0, second.y1 - second.y0));
}

function approximateFragmentBbox(word: PhotoTextWord, start: number, length: number) {
  const width = word.bbox.x1 - word.bbox.x0;
  const sourceLength = Math.max(1, word.text.length);
  return {
    x0: word.bbox.x0 + width * (start / sourceLength),
    x1: word.bbox.x0 + width * ((start + length) / sourceLength),
    y0: word.bbox.y0,
    y1: word.bbox.y1,
  };
}

function applyEmbeddedNumberHints(blocks: PhotoTextBlock[], hints: NumericHint[]) {
  const lockedWords = new Set<PhotoTextWord>();
  let corrections = 0;
  const usedHints = new Set<NumericHint>();

  for (const block of blocks) {
    for (const paragraph of block.paragraphs) {
      for (const line of paragraph.lines) {
        for (const word of line.words) {
          const groups = digitGroups(word.text);
          if (!groups.length) continue;
          let revised = word.text;
          let localCorrections = 0;
          let localMatches = 0;
          let offsetChange = 0;

          for (const group of groups) {
            const groupBbox = approximateFragmentBbox(word, group.index ?? 0, group[0].length);
            const groupCenter = center(groupBbox);
            const candidate = hints
              .filter((hint) => !usedHints.has(hint) && overlapRatio(groupBbox, hint.bbox) >= 0.25)
              .map((hint) => {
                const hintCenter = center(hint.bbox);
                const xDistance = Math.abs(groupCenter.x - hintCenter.x);
                const allowableDistance = Math.max(45, (word.bbox.y1 - word.bbox.y0) * 4.5);
                const sourceDigits = asciiDigits(group[0]);
                const hintDigits = asciiDigits(hint.text);
                const lengthPenalty = Math.abs(sourceDigits.length - hintDigits.length) * 14;
                return { hint, score: hint.priority - (xDistance / allowableDistance) * 35 - lengthPenalty };
              })
              .filter(({ hint, score }) => score >= 45 && asciiDigits(hint.text).length > 0)
              .sort((left, right) => right.score - left.score)[0]?.hint;

            if (!candidate) continue;
            localMatches += 1;
            const replacement = candidate.text;
            const start = (group.index ?? 0) + offsetChange;
            if (asciiDigits(group[0]) !== asciiDigits(replacement)) {
              revised = `${revised.slice(0, start)}${replacement}${revised.slice(start + group[0].length)}`;
              offsetChange += replacement.length - group[0].length;
              localCorrections += 1;
            }
            usedHints.add(candidate);
          }

          if (localMatches) lockedWords.add(word);
          if (localCorrections) {
            word.text = revised;
            corrections += localCorrections;
          }
        }
      }
    }
  }

  return { corrections, lockedWords };
}

function createNumericCrop(bitmap: ImageBitmap, bbox: OcrBbox) {
  const wordHeight = Math.max(8, bbox.y1 - bbox.y0);
  const paddingX = wordHeight * 0.45;
  const paddingY = wordHeight * 0.55;
  const left = Math.max(0, Math.floor(bbox.x0 - paddingX));
  const top = Math.max(0, Math.floor(bbox.y0 - paddingY));
  const right = Math.min(bitmap.width, Math.ceil(bbox.x1 + paddingX));
  const bottom = Math.min(bitmap.height, Math.ceil(bbox.y1 + paddingY));
  const sourceWidth = Math.max(1, right - left);
  const sourceHeight = Math.max(1, bottom - top);
  const scale = Math.max(2, Math.min(4, 110 / wordHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(sourceWidth * scale);
  canvas.height = Math.ceil(sourceHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("अंकों की दोबारा जाँच नहीं हो सकी।");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, left, top, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function replaceDigitGroups(source: string, replacements: string[]) {
  let replacementIndex = 0;
  return source.replace(NUMERIC_FRAGMENT, (fragment) => {
    if (!/[0-9\u0966-\u096f]/.test(fragment)) return fragment;
    const replacement = replacements[replacementIndex];
    replacementIndex += 1;
    return replacement ?? fragment;
  });
}

async function refinePdfNumbers(
  worker: Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>>,
  source: Blob,
  blocks: PhotoTextBlock[],
  hints: NumericHint[],
  singleWordMode: import("tesseract.js").PSM,
  automaticMode: import("tesseract.js").PSM,
) {
  const embedded = applyEmbeddedNumberHints(blocks, hints);
  const candidates = blocks.flatMap((block) => block.paragraphs.flatMap((paragraph) => (
    paragraph.lines.flatMap((line) => line.words)
  ))).filter((word) => {
    const groups = digitGroups(word.text);
    return groups.some((group) => asciiDigits(group[0]).length >= 2)
      && (word.confidence < 92 || /[./:-]/.test(word.text));
  }).slice(0, 24);

  let corrections = embedded.corrections;
  let uncertainNumbers = 0;
  const bitmap = await createImageBitmap(source);
  try {
    await worker.setParameters({
      classify_bln_numeric_mode: "1",
      preserve_interword_spaces: "1",
      tessedit_char_whitelist: "0123456789\u0966\u0967\u0968\u0969\u096a\u096b\u096c\u096d\u096e\u096f./:-",
      tessedit_pageseg_mode: singleWordMode,
      user_defined_dpi: "300",
    });

    for (const word of candidates) {
      if (embedded.lockedWords.has(word)) continue;
      const originalGroups = digitGroups(word.text);
      const crop = createNumericCrop(bitmap, word.bbox);
      const result = await worker.recognize(crop, {}, { text: true });
      const refinedGroups = digitGroups(result.data.text.trim());
      const sameGroupCount = refinedGroups.length === originalGroups.length && refinedGroups.length > 0;
      const refinedConfidence = result.data.confidence ?? 0;
      const shouldUseRefined = sameGroupCount && (
        refinedConfidence >= 85 || (word.confidence < 90 && refinedConfidence >= word.confidence - 8)
      );

      if (shouldUseRefined) {
        const replacements = refinedGroups.map((group) => group[0]);
        const revised = replaceDigitGroups(word.text, replacements);
        if (asciiDigits(revised) !== asciiDigits(word.text)) {
          word.text = revised;
          corrections += 1;
        }
      } else if (word.confidence < 70) {
        uncertainNumbers += 1;
      }
    }
  } finally {
    bitmap.close();
    await worker.setParameters({
      classify_bln_numeric_mode: "0",
      preserve_interword_spaces: "1",
      tessedit_char_whitelist: "",
      tessedit_pageseg_mode: automaticMode,
      user_defined_dpi: "300",
    });
  }

  return { corrections, uncertainNumbers };
}

function blockRecognitionText(blocks: PhotoTextBlock[] | null, fallback: string) {
  if (!blocks?.length) return fallback;
  const paragraphs = blocks.flatMap((block) => block.paragraphs.flatMap((paragraph) => {
    const lines = paragraph.lines.map((line) => line.words.map((word) => word.text.trim()).filter(Boolean).join(" ")).filter(Boolean);
    return lines.length ? [lines.join("\n")] : [];
  }));
  return paragraphs.join("\n\n").trim() || fallback;
}

function keepPhotoWord(word: PhotoTextWord) {
  const token = word.text.trim();
  if (!token) return false;
  if (containsDevanagari(token)) return true;
  if (/[@]|https?:|www\./i.test(token)) return true;
  if (/^[।|]?[0-9०-९][0-9०-९.,:/()|-]*$/.test(token)) return true;
  if (/^[0-9०-९oOlI|aAzZsSwW]{1,3}[.,)।:-]*$/.test(token)) return true;
  if (/^(?:NCD|ICMIS|IOMIS|RTI|PDF|PAN|GST|IFSC)[.,:/()|-]*$/i.test(token)) return true;
  if (/^[A-Z]{2,10}[.,:/()|-]*$/.test(token)) return true;
  return word.confidence >= 70;
}

function cleanPhotoRecognition(blocks: PhotoTextBlock[] | null, fallback: string) {
  if (!blocks?.length) return fallback;
  const paragraphs: string[] = [];

  for (const block of blocks) {
    for (const paragraph of block.paragraphs) {
      const lines = paragraph.lines.flatMap((line) => {
        const words = line.words.flatMap((word) => {
          return keepPhotoWord(word) ? [word.text.trim()] : [];
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

interface DetectedLine {
  end: number;
  position: number;
  start: number;
}

function longestDarkRun(
  mask: Uint8Array,
  width: number,
  height: number,
  position: number,
  direction: "horizontal" | "vertical",
) {
  const length = direction === "horizontal" ? width : height;
  let best: { darkPixels: number; end: number; start: number } | null = null;
  let currentDarkPixels = 0;
  let currentStart = -1;
  let lastDark = -10;

  for (let offset = 0; offset < length; offset += 1) {
    const pixel = direction === "horizontal"
      ? mask[position * width + offset]
      : mask[offset * width + position];
    if (!pixel) continue;
    if (currentStart < 0 || offset - lastDark > 3) {
      if (currentStart >= 0 && (!best || lastDark - currentStart > best.end - best.start)) {
        best = { darkPixels: currentDarkPixels, end: lastDark, start: currentStart };
      }
      currentStart = offset;
      currentDarkPixels = 0;
    }
    currentDarkPixels += 1;
    lastDark = offset;
  }

  if (currentStart >= 0 && (!best || lastDark - currentStart > best.end - best.start)) {
    best = { darkPixels: currentDarkPixels, end: lastDark, start: currentStart };
  }
  return best;
}

function mergeParallelLines(lines: DetectedLine[]) {
  const groups: Array<{ lines: DetectedLine[]; start: number; end: number }> = [];
  for (const line of lines.sort((left, right) => left.position - right.position)) {
    const group = groups.findLast((candidate) => {
      const previous = candidate.lines.at(-1);
      if (!previous || line.position - previous.position > 2) return false;
      const overlap = Math.max(0, Math.min(line.end, candidate.end) - Math.max(line.start, candidate.start));
      const shortest = Math.max(1, Math.min(line.end - line.start, candidate.end - candidate.start));
      return overlap / shortest >= 0.72;
    });
    if (group) {
      group.lines.push(line);
      group.start = Math.min(group.start, line.start);
      group.end = Math.max(group.end, line.end);
    } else {
      groups.push({ lines: [line], start: line.start, end: line.end });
    }
  }
  return groups.map((group) => ({
    end: group.end,
    position: group.lines.reduce((sum, line) => sum + line.position, 0) / group.lines.length,
    start: group.start,
  }));
}

function mergedPositions(values: number[], tolerance: number) {
  const groups: number[][] = [];
  for (const value of [...values].sort((left, right) => left - right)) {
    const group = groups.at(-1);
    if (group && value - group.at(-1)! <= tolerance) group.push(value);
    else groups.push([value]);
  }
  return groups.map((group) => group.reduce((sum, value) => sum + value, 0) / group.length);
}

function wordsInReadingOrder(words: PhotoTextWord[]) {
  const lines: PhotoTextWord[][] = [];
  for (const word of [...words].sort((left, right) => center(left.bbox).y - center(right.bbox).y || left.bbox.x0 - right.bbox.x0)) {
    const wordCenter = center(word.bbox);
    const line = lines.findLast((candidate) => {
      const candidateBbox = candidate.reduce((bbox, current) => ({
        x0: Math.min(bbox.x0, current.bbox.x0),
        x1: Math.max(bbox.x1, current.bbox.x1),
        y0: Math.min(bbox.y0, current.bbox.y0),
        y1: Math.max(bbox.y1, current.bbox.y1),
      }), candidate[0].bbox);
      const candidateCenter = center(candidateBbox);
      const height = Math.max(word.bbox.y1 - word.bbox.y0, candidateBbox.y1 - candidateBbox.y0);
      return Math.abs(wordCenter.y - candidateCenter.y) <= height * 0.55;
    });
    if (line) line.push(word);
    else lines.push([word]);
  }
  return lines.map((line) => line.sort((left, right) => left.bbox.x0 - right.bbox.x0).map((word) => word.text.trim()).filter(Boolean).join(" ")).filter(Boolean).join("\n");
}

function flattenWords(blocks: PhotoTextBlock[] | null, cleanPhoto: boolean) {
  return blocks?.flatMap((block) => block.paragraphs.flatMap((paragraph) => (
    paragraph.lines.flatMap((line) => line.words)
  ))).filter((word) => !cleanPhoto || keepPhotoWord(word)) ?? [];
}

async function detectEditableTables(source: Blob, blocks: PhotoTextBlock[] | null, cleanPhoto: boolean) {
  if (!blocks?.length) return [];
  const bitmap = await createImageBitmap(source);
  try {
    const detectionScale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * detectionScale));
    canvas.height = Math.max(1, Math.round(bitmap.height * detectionScale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return [];
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const mask = new Uint8Array(canvas.width * canvas.height);
    for (let pixel = 0, offset = 0; pixel < mask.length; pixel += 1, offset += 4) {
      const gray = pixels[offset] * 0.299 + pixels[offset + 1] * 0.587 + pixels[offset + 2] * 0.114;
      mask[pixel] = gray < 185 && pixels[offset + 3] > 128 ? 1 : 0;
    }

    const horizontal: DetectedLine[] = [];
    const minimumHorizontal = Math.max(60, canvas.width * 0.12);
    for (let y = 0; y < canvas.height; y += 1) {
      const run = longestDarkRun(mask, canvas.width, canvas.height, y, "horizontal");
      if (!run) continue;
      const span = run.end - run.start + 1;
      if (span >= minimumHorizontal && run.darkPixels / span >= 0.7) {
        horizontal.push({ end: run.end, position: y, start: run.start });
      }
    }

    const vertical: DetectedLine[] = [];
    const minimumVertical = Math.max(35, canvas.height * 0.025);
    for (let x = 0; x < canvas.width; x += 1) {
      const run = longestDarkRun(mask, canvas.width, canvas.height, x, "vertical");
      if (!run) continue;
      const span = run.end - run.start + 1;
      if (span >= minimumVertical && run.darkPixels / span >= 0.7) {
        vertical.push({ end: run.end, position: x, start: run.start });
      }
    }

    const horizontalLines = mergeParallelLines(horizontal);
    const verticalLines = mergeParallelLines(vertical);
    const lineCount = horizontalLines.length + verticalLines.length;
    const parents = Array.from({ length: lineCount }, (_, index) => index);
    const root = (sourceIndex: number) => {
      let index = sourceIndex;
      while (parents[index] !== index) {
        parents[index] = parents[parents[index]];
        index = parents[index];
      }
      return index;
    };
    const join = (leftIndex: number, rightIndex: number) => {
      const leftRoot = root(leftIndex);
      const rightRoot = root(rightIndex);
      if (leftRoot !== rightRoot) parents[rightRoot] = leftRoot;
    };
    const intersectionTolerance = 3;
    horizontalLines.forEach((horizontalLine, horizontalIndex) => {
      verticalLines.forEach((verticalLine, verticalIndex) => {
        if (
          verticalLine.position >= horizontalLine.start - intersectionTolerance
          && verticalLine.position <= horizontalLine.end + intersectionTolerance
          && horizontalLine.position >= verticalLine.start - intersectionTolerance
          && horizontalLine.position <= verticalLine.end + intersectionTolerance
        ) {
          join(horizontalIndex, horizontalLines.length + verticalIndex);
        }
      });
    });

    const components = new Map<number, number[]>();
    for (let index = 0; index < lineCount; index += 1) {
      const component = components.get(root(index)) ?? [];
      component.push(index);
      components.set(root(index), component);
    }

    const scaleX = bitmap.width / canvas.width;
    const scaleY = bitmap.height / canvas.height;
    const words = flattenWords(blocks, cleanPhoto);
    const tables: RecognizedTable[] = [];
    for (const component of components.values()) {
      const tableHorizontal = component.filter((index) => index < horizontalLines.length).map((index) => horizontalLines[index]);
      const tableVertical = component.filter((index) => index >= horizontalLines.length).map((index) => verticalLines[index - horizontalLines.length]);
      if (tableHorizontal.length < 2 || tableVertical.length < 2) continue;
      const orderedHorizontalStarts = tableHorizontal.map((line) => line.start).sort((left, right) => left - right);
      const orderedHorizontalEnds = tableHorizontal.map((line) => line.end).sort((left, right) => left - right);
      const horizontalStart = orderedHorizontalStarts[Math.floor(orderedHorizontalStarts.length / 2)];
      const horizontalEnd = orderedHorizontalEnds[Math.floor(orderedHorizontalEnds.length / 2)];
      const xPositions = mergedPositions([
        ...tableVertical.map((line) => line.position),
        horizontalStart,
        horizontalEnd,
      ], 3);
      const yPositions = mergedPositions(tableHorizontal.map((line) => line.position), 3);
      if (xPositions.length < 2 || yPositions.length < 2 || xPositions.length > 25 || yPositions.length > 100) continue;
      const width = xPositions.at(-1)! - xPositions[0];
      const height = yPositions.at(-1)! - yPositions[0];
      if (width * height < canvas.width * canvas.height * 0.001) continue;
      const pageFrame = xPositions.length === 2 && yPositions.length === 2
        && width >= canvas.width * 0.75 && height >= canvas.height * 0.65;
      if (xPositions.length === 2 && yPositions.length === 2 && !pageFrame) continue;

      const sourceX = xPositions.map((position) => position * scaleX);
      const sourceY = yPositions.map((position) => position * scaleY);
      const sourceVertical = tableVertical.map((line) => ({
        end: line.end * scaleY,
        position: line.position * scaleX,
        start: line.start * scaleY,
      }));
      const bbox = {
        x0: sourceX[0],
        x1: sourceX.at(-1)!,
        y0: sourceY[0],
        y1: sourceY.at(-1)!,
      };
      const tableWords = words.filter((word) => {
        const wordCenter = center(word.bbox);
        return wordCenter.x >= bbox.x0 - 4 && wordCenter.x <= bbox.x1 + 4
          && wordCenter.y >= bbox.y0 - 4 && wordCenter.y <= bbox.y1 + 4;
      });
      const rows: RecognizedTableCell[][] = [];
      for (let rowIndex = 0; rowIndex < sourceY.length - 1; rowIndex += 1) {
        const top = sourceY[rowIndex];
        const bottom = sourceY[rowIndex + 1];
        const rowHeight = Math.max(1, bottom - top);
        const activeBoundaries = [0];
        for (let columnIndex = 1; columnIndex < sourceX.length - 1; columnIndex += 1) {
          const boundary = sourceX[columnIndex];
          const boundaryPresent = sourceVertical.some((line) => {
            const overlap = Math.max(0, Math.min(bottom, line.end) - Math.max(top, line.start));
            return Math.abs(line.position - boundary) <= 5 && overlap >= Math.max(3, rowHeight * 0.3);
          });
          if (boundaryPresent) activeBoundaries.push(columnIndex);
        }
        activeBoundaries.push(sourceX.length - 1);

        const row: RecognizedTableCell[] = [];
        for (let boundaryIndex = 0; boundaryIndex < activeBoundaries.length - 1; boundaryIndex += 1) {
          const leftIndex = activeBoundaries[boundaryIndex];
          const rightIndex = activeBoundaries[boundaryIndex + 1];
          const left = sourceX[leftIndex];
          const right = sourceX[rightIndex];
          const cellWords = tableWords.filter((word) => {
            const wordCenter = center(word.bbox);
            return wordCenter.x >= left - 3 && wordCenter.x < right + 3
              && wordCenter.y >= top - 3 && wordCenter.y < bottom + 3;
          });
          row.push({ columnSpan: rightIndex - leftIndex, text: wordsInReadingOrder(cellWords) });
        }
        rows.push(row);
      }

      const columnWidths = sourceX.slice(1).map((position, index) => position - sourceX[index]);
      const totalWidth = columnWidths.reduce((sum, value) => sum + value, 0);
      tables.push({
        bbox,
        columnRatios: columnWidths.map((value) => value / Math.max(1, totalWidth)),
        pageFrame,
        rows,
      });
    }
    return tables.sort((left, right) => left.bbox.y0 - right.bbox.y0 || left.bbox.x0 - right.bbox.x0);
  } finally {
    bitmap.close();
  }
}

function textWithTableMarkers(
  blocks: PhotoTextBlock[] | null,
  fallback: string,
  tables: RecognizedTable[],
  cleanPhoto: boolean,
) {
  if (!tables.length) return cleanPhoto ? cleanPhotoRecognition(blocks, fallback) : blockRecognitionText(blocks, fallback);
  if (!blocks?.length) return `${fallback.trim()}\n\n${tables.map((_, index) => `[[TABLE:${index + 1}]]`).join("\n\n")}`.trim();
  const elements: Array<{ order: number; text: string }> = [];
  for (const block of blocks) {
    for (const paragraph of block.paragraphs) {
      for (const line of paragraph.lines) {
        const outsideWords = line.words.filter((word) => {
          if (cleanPhoto && !keepPhotoWord(word)) return false;
          const wordCenter = center(word.bbox);
          return !tables.some((table) => wordCenter.x >= table.bbox.x0 - 4 && wordCenter.x <= table.bbox.x1 + 4
            && wordCenter.y >= table.bbox.y0 - 4 && wordCenter.y <= table.bbox.y1 + 4);
        });
        const text = wordsInReadingOrder(outsideWords);
        if (text) elements.push({ order: line.bbox.y0, text });
      }
    }
  }
  tables.forEach((table, index) => elements.push({ order: table.bbox.y0, text: `[[TABLE:${index + 1}]]` }));
  return elements.sort((left, right) => left.order - right.order).map((element) => element.text).join("\n").trim();
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
  const {
    AlignmentType,
    BorderStyle,
    Document,
    HeightRule,
    Packer,
    Paragraph,
    SectionType,
    Table,
    TableCell,
    TableLayoutType,
    TableRow,
    TextRun,
    VerticalAlign,
    WidthType,
  } = await import("docx");
  const editableRuns = (text: string, inTable = false, pageFrame = false) => text.split(/(\s+)/).filter(Boolean).map((part) => {
    const isHindi = containsDevanagari(part);
    return new TextRun({
      text: isHindi ? unicodeToKrutiDev(part) : part,
      font: isHindi ? legacyFont : "Arial",
      size: isHindi
        ? (pageFrame ? 32 : (inTable ? (compact ? 19 : 21) : (compact ? 24 : 28)))
        : (pageFrame ? 26 : (inTable ? (compact ? 17 : 19) : (compact ? 20 : 22))),
    });
  });
  const editableParagraph = (paragraph: { isNumbered: boolean; text: string }) => {
    if (!paragraph.text) return new Paragraph({ text: "" });
    return new Paragraph({
      alignment: paragraph.text.length >= 60 ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
      children: editableRuns(paragraph.text),
      indent: paragraph.isNumbered ? { hanging: 360, left: 360 } : undefined,
      spacing: { after: compact ? 0 : 60, line: compact ? 260 : 300 },
    });
  };
  const pageWidth = 11906;
  const pageMargin = compact ? 360 : 720;
  const usableWidth = pageWidth - pageMargin * 2;
  const tableBorder = { color: "000000", size: 4, style: BorderStyle.SINGLE };
  const editableTable = (table: RecognizedTable) => {
    const approximateWidths = table.columnRatios.map((ratio) => Math.max(180, Math.round(usableWidth * ratio)));
    const approximateTotal = approximateWidths.reduce((sum, width) => sum + width, 0);
    const columnWidths = approximateWidths.map((width) => Math.max(180, Math.round(width * usableWidth / approximateTotal)));
    return new Table({
      borders: {
        bottom: tableBorder,
        insideHorizontal: tableBorder,
        insideVertical: tableBorder,
        left: tableBorder,
        right: tableBorder,
        top: tableBorder,
      },
      columnWidths,
      layout: TableLayoutType.FIXED,
      margins: { bottom: 45, left: 70, right: 70, top: 45 },
      rows: table.rows.map((row, rowIndex) => {
        let columnIndex = 0;
        const cells = row.map((cell) => {
          const width = columnWidths.slice(columnIndex, columnIndex + cell.columnSpan).reduce((sum, value) => sum + value, 0);
          columnIndex += cell.columnSpan;
          const lines = cell.text.split(/\n+/u).map((line) => line.trim()).filter(Boolean);
          const isCompactValue = cell.text.length <= 12 || /^[0-9०-९.,:/()&%+\-\s]+$/u.test(cell.text);
          return new TableCell({
            borders: {
              bottom: tableBorder,
              left: tableBorder,
              right: tableBorder,
              top: tableBorder,
            },
            children: (lines.length ? lines : [""]).map((line) => new Paragraph({
              alignment: table.pageFrame || isCompactValue ? AlignmentType.CENTER : AlignmentType.LEFT,
              children: editableRuns(line, true, table.pageFrame),
              spacing: table.pageFrame
                ? { after: 150, line: 320 }
                : { after: 0, line: compact ? 210 : 230 },
            })),
            columnSpan: cell.columnSpan > 1 ? cell.columnSpan : undefined,
            verticalAlign: VerticalAlign.CENTER,
            width: { size: width, type: WidthType.DXA },
          });
        });
        return new TableRow({
          cantSplit: true,
          children: cells,
          height: table.pageFrame ? { rule: HeightRule.ATLEAST, value: 12000 } : undefined,
          tableHeader: rowIndex === 0 && !table.pageFrame,
        });
      }),
      width: { size: usableWidth, type: WidthType.DXA },
    });
  };

  const sections = pages.map((page, pageIndex) => {
    const children: Array<InstanceType<typeof Paragraph> | InstanceType<typeof Table>> = [];
    const insertedTables = new Set<number>();
    const marker = /\[\[TABLE:(\d+)\]\]/gu;
    let cursor = 0;
    for (const match of page.text.matchAll(marker)) {
      const start = match.index ?? 0;
      children.push(...groupEditableParagraphs(page.text.slice(cursor, start)).map(editableParagraph));
      const tableIndex = Number(match[1]) - 1;
      const table = page.tables[tableIndex];
      if (table && !insertedTables.has(tableIndex)) {
        children.push(editableTable(table), new Paragraph({ text: "" }));
        insertedTables.add(tableIndex);
      }
      cursor = start + match[0].length;
    }
    children.push(...groupEditableParagraphs(page.text.slice(cursor)).map(editableParagraph));
    page.tables.forEach((table, tableIndex) => {
      if (!insertedTables.has(tableIndex)) children.push(editableTable(table), new Paragraph({ text: "" }));
    });

    return {
      properties: {
        type: pageIndex ? SectionType.NEXT_PAGE : undefined,
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: pageMargin, right: pageMargin, bottom: pageMargin, left: pageMargin },
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

  const totalCharacters = useMemo(() => pages.reduce((sum, page) => (
    sum + page.text.length + page.tables.reduce((tableSum, table) => (
      tableSum + table.rows.reduce((rowSum, row) => rowSum + row.reduce((cellSum, cell) => cellSum + cell.text.length, 0), 0)
    ), 0)
  ), 0), [pages]);
  const totalTables = useMemo(() => pages.reduce((sum, page) => sum + page.tables.length, 0), [pages]);

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
        const preparedPage = prepared[index];
        if (isPdf && preparedPage.embeddedText) {
          setStatus(`Page ${index + 1}/${prepared.length} में editable tables पहचानी जा रही हैं…`);
          const tables = await detectEditableTables(preparedPage.blob, preparedPage.embeddedBlocks, false).catch(() => []);
          recognized.push({
            height: preparedPage.height,
            numericCorrections: 0,
            png: preparedPage.png,
            tables,
            text: repairOrderedListNumbers(textWithTableMarkers(
              preparedPage.embeddedBlocks,
              preparedPage.embeddedText,
              tables,
              false,
            )),
            uncertainNumbers: 0,
            width: preparedPage.width,
          });
          setProgress(15 + Math.round(((index + 1) / prepared.length) * 80));
          continue;
        }

        setStatus(`Page ${index + 1}/${prepared.length} साफ़ करके Hindi text पढ़ा जा रहा है…`);
        const ocrImage = await enhanceForOcr(preparedPage.blob, printedTextOnly, true);
        const result = await worker.recognize(ocrImage, {}, { blocks: true, text: true });
        const blocks = result.data.blocks as PhotoTextBlock[] | null;
        let numericCorrections = 0;
        let uncertainNumbers = 0;
        if (isPdf && blocks?.length) {
          setStatus(`Page ${index + 1}/${prepared.length} की तारीख और अंक दोबारा जाँचे जा रहे हैं…`);
          const numericResult = await refinePdfNumbers(
            worker,
            preparedPage.blob,
            blocks,
            preparedPage.numberHints,
            PSM.SINGLE_WORD,
            PSM.AUTO,
          );
          numericCorrections = numericResult.corrections;
          uncertainNumbers = numericResult.uncertainNumbers;
        }
        setStatus(`Page ${index + 1}/${prepared.length} में editable tables पहचानी जा रही हैं…`);
        const tables = await detectEditableTables(ocrImage, blocks, !isPdf).catch(() => []);
        const extractedText = textWithTableMarkers(blocks, result.data.text.trim(), tables, !isPdf);
        recognized.push({
          height: preparedPage.height,
          numericCorrections,
          png: preparedPage.png,
          tables,
          text: repairOrderedListNumbers(extractedText),
          uncertainNumbers,
          width: preparedPage.width,
        });
        setProgress(15 + Math.round(((index + 1) / prepared.length) * 80));
      }

      setPages(recognized);
      setProgress(100);
      const recognizedTables = recognized.reduce((sum, page) => sum + page.tables.length, 0);
      setStatus(recognizedTables
        ? `Hindi text और ${recognizedTables} editable table तैयार हैं। जाँचकर Word download करें।`
        : "Hindi text तैयार है। गलतियाँ जाँचकर Word download करें।");
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

  function updateTableCell(pageIndex: number, tableIndex: number, rowIndex: number, cellIndex: number, text: string) {
    setPages((current) => current.map((page, currentPageIndex) => {
      if (currentPageIndex !== pageIndex) return page;
      return {
        ...page,
        tables: page.tables.map((table, currentTableIndex) => {
          if (currentTableIndex !== tableIndex) return table;
          return {
            ...table,
            rows: table.rows.map((row, currentRowIndex) => (
              currentRowIndex === rowIndex
                ? row.map((cell, currentCellIndex) => (currentCellIndex === cellIndex ? { ...cell, text } : cell))
                : row
            )),
          };
        }),
      };
    }));
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
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                    {pages.length} pages • {totalCharacters} अक्षर{totalTables ? ` • ${totalTables} tables` : ""}
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {pages.map((page, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 p-4">
                      <label htmlFor={`ocr-page-${index}`} className="font-black text-slate-900">Page {index + 1}</label>
                      <textarea id={`ocr-page-${index}`} value={page.text} onChange={(event) => updatePageText(index, event.target.value)} rows={index === 0 ? 10 : 6} className="mt-3 w-full resize-y rounded-xl border border-slate-300 bg-[#fbfcfc] p-4 font-medium leading-7 text-slate-800 outline-none focus:border-[#2f6a59] focus:ring-4 focus:ring-[#2f6a59]/10" />
                      {page.tables.length > 0 && (
                        <div className="mt-4 space-y-4">
                          <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-bold leading-5 text-sky-900">
                            नीचे की tables Word में वास्तविक editable tables बनेंगी। ऊपर के <code>[[TABLE:n]]</code> चिन्ह न हटाएँ।
                          </p>
                          {page.tables.map((table, tableIndex) => (
                            <div key={tableIndex} className="overflow-x-auto rounded-xl border border-slate-300">
                              <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                                Table {tableIndex + 1}
                              </div>
                              <table className="w-full min-w-[640px] table-fixed border-collapse bg-white">
                                <colgroup>
                                  {table.columnRatios.map((ratio, columnIndex) => (
                                    <col key={columnIndex} style={{ width: `${ratio * 100}%` }} />
                                  ))}
                                </colgroup>
                                <tbody>
                                  {table.rows.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                      {row.map((cell, cellIndex) => (
                                        <td key={cellIndex} colSpan={cell.columnSpan} className="border border-slate-300 p-1 align-top">
                                          <textarea
                                            aria-label={`Page ${index + 1}, table ${tableIndex + 1}, row ${rowIndex + 1}, cell ${cellIndex + 1}`}
                                            value={cell.text}
                                            onChange={(event) => updateTableCell(index, tableIndex, rowIndex, cellIndex, event.target.value)}
                                            rows={Math.max(1, Math.min(4, cell.text.split("\n").length))}
                                            className="min-h-9 w-full resize-y rounded-md border-0 bg-transparent px-2 py-1 text-sm leading-5 text-slate-800 outline-none focus:bg-emerald-50"
                                          />
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>
                      )}
                      {page.numericCorrections > 0 && (
                        <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold leading-5 text-emerald-800">
                          {page.numericCorrections} तारीख/अंक दूसरी जाँच से सुधारे गए हैं।
                        </p>
                      )}
                      {page.uncertainNumbers > 0 && (
                        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-900">
                          {page.uncertainNumbers} अंक पूरी तरह स्पष्ट नहीं हैं—मूल PDF देखकर एक बार जाँच लें।
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => download("kruti")} disabled={Boolean(downloadMode)} className="rounded-2xl bg-[#173f35] px-5 py-4 text-left font-black text-white disabled:opacity-50">
                    <span className="block text-lg">Kruti Dev 010 Word</span>
                    <span className="mt-1 block text-xs font-semibold text-white/65">{downloadMode === "kruti" ? "बन रही है…" : "Editable text + tables"}</span>
                  </button>
                  <button type="button" onClick={() => download("devlys")} disabled={Boolean(downloadMode)} className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-left font-black text-slate-950 disabled:opacity-50">
                    <span className="block text-lg">DevLys 010 Word</span>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">{downloadMode === "devlys" ? "बन रही है…" : "Editable text + tables"}</span>
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
            <div className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e7f3ee] text-xs font-black text-[#173f35]">3</span><span className="pt-1 leading-5">Grid वाली tables Word में cell-by-cell editable</span></div>
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
