import { convertXlsxToPdf, LibreOfficeBusyError, LibreOfficeUnavailableError } from "@/lib/server/libreoffice-converter";

export const runtime = "nodejs";
export const maxDuration = 90;

const MAX_FILE_SIZE = 20 * 1024 * 1024;
let activeConversions = 0;

function safeDownloadName(sourceName: string, sheetName: string) {
  const workbookName = sourceName.replace(/\.xlsx$/iu, "").trim() || "excel";
  const safeSheetName = sheetName.trim().replace(/[\\/:*?"<>|]+/gu, "-") || "sheet";
  return `${workbookName}-${safeSheetName}.pdf`;
}

function contentDisposition(fileName: string) {
  const asciiName = fileName.normalize("NFKD").replace(/[^\x20-\x7E]+/gu, "").replace(/["\\]/gu, "-") || "excel-sheet.pdf";
  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

function formInteger(formData: FormData, key: string, maximum: number) {
  const value = formData.get(key);
  if (typeof value !== "string" || !/^\d+$/u.test(value)) return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= maximum ? number : undefined;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_FILE_SIZE + 1024 * 1024) {
    return Response.json({ error: "Excel file का आकार 20 MB से कम रखें।" }, { status: 413 });
  }
  if (activeConversions >= 2) {
    return Response.json({ error: "Server पर दो PDF बन रही हैं। थोड़ी देर बाद फिर प्रयास करें।" }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Excel upload सही नहीं है। File दोबारा चुनें।" }, { status: 400 });
  }
  const file = formData.get("file");
  const sheetIndexValue = formData.get("sheetIndex");
  const sheetNameValue = formData.get("sheetName");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx")) {
    return Response.json({ error: "केवल .xlsx Excel file चुनें।" }, { status: 400 });
  }
  if (!file.size || file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "Excel file का आकार 20 MB से कम रखें।" }, { status: 413 });
  }
  const sheetIndex = typeof sheetIndexValue === "string" ? Number(sheetIndexValue) : Number.NaN;
  if (!Number.isInteger(sheetIndex) || sheetIndex < 0 || sheetIndex > 999) {
    return Response.json({ error: "चुनी हुई sheet सही नहीं है।" }, { status: 400 });
  }
  const sheetName = typeof sheetNameValue === "string" ? sheetNameValue.slice(0, 120) : "sheet";
  const source = Buffer.from(await file.arrayBuffer());
  if (source[0] !== 0x50 || source[1] !== 0x4b) {
    return Response.json({ error: "यह सही .xlsx file नहीं है।" }, { status: 400 });
  }

  activeConversions += 1;
  try {
    const minColumn = formInteger(formData, "minColumn", 16_383);
    const maxColumn = formInteger(formData, "maxColumn", 16_383);
    const minRow = formInteger(formData, "minRow", 1_048_575);
    const maxRow = formInteger(formData, "maxRow", 1_048_575);
    const printArea = minColumn !== undefined && maxColumn !== undefined && minRow !== undefined && maxRow !== undefined
      && minColumn <= maxColumn && minRow <= maxRow
      ? { minColumn, maxColumn, minRow, maxRow }
      : undefined;
    const pdf = await convertXlsxToPdf(source, sheetIndex, printArea);
    const downloadName = safeDownloadName(file.name, sheetName);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": contentDisposition(downloadName),
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    const status = error instanceof LibreOfficeBusyError ? 429 : error instanceof LibreOfficeUnavailableError ? 503 : 422;
    const message = error instanceof Error ? error.message : "Excel की PDF नहीं बन सकी।";
    return Response.json({ error: message }, { status });
  } finally {
    activeConversions -= 1;
  }
}
