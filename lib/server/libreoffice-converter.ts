import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import JSZip from "jszip";

const CONVERSION_TIMEOUT_MS = 75_000;
const OUTPUT_LIMIT = 12_000;

export class LibreOfficeUnavailableError extends Error {}

export interface ExcelPrintArea {
  maxColumn: number;
  maxRow: number;
  minColumn: number;
  minRow: number;
}

function xmlText(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function xmlAttributeText(value: string) {
  return xmlText(value).replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function decodedXmlAttribute(value: string) {
  return value
    .replace(/&#(\d+);/gu, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/giu, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function excelColumnName(columnIndex: number) {
  let value = columnIndex + 1;
  let name = "";
  while (value > 0) {
    value -= 1;
    name = String.fromCharCode(65 + (value % 26)) + name;
    value = Math.floor(value / 26);
  }
  return name;
}

function withPrintArea(workbookXml: string, selectedSheetIndex: number, sheetName: string, printArea: ExcelPrintArea) {
  const withoutPreviousArea = workbookXml.replace(/<definedName\b[^>]*>[\s\S]*?<\/definedName>/gu, (definition) => {
    const isPrintArea = /\bname=(?:"_xlnm\.Print_Area"|'_xlnm\.Print_Area')/u.test(definition);
    const localSheetId = definition.match(/\blocalSheetId=(?:"(\d+)"|'(\d+)')/u);
    return isPrintArea && Number(localSheetId?.[1] ?? localSheetId?.[2]) === selectedSheetIndex ? "" : definition;
  });
  const quotedSheetName = sheetName.replaceAll("'", "''");
  const range = `'${quotedSheetName}'!$${excelColumnName(printArea.minColumn)}$${printArea.minRow + 1}:$${excelColumnName(printArea.maxColumn)}$${printArea.maxRow + 1}`;
  const definition = `<definedName name="_xlnm.Print_Area" localSheetId="${selectedSheetIndex}">${xmlText(range)}</definedName>`;
  if (/<definedNames\b[^>]*>/u.test(withoutPreviousArea)) {
    return withoutPreviousArea.replace(/<\/definedNames>/u, `${definition}</definedNames>`);
  }
  return withoutPreviousArea.replace(/<\/workbook>/u, `<definedNames>${definition}</definedNames></workbook>`);
}

function withSheetVisibility(workbookXml: string, selectedSheetIndex: number, printArea?: ExcelPrintArea) {
  let sheetIndex = 0;
  let selectedSheetName = "";
  const updatedXml = workbookXml.replace(/<sheet\b[^>]*\/>/gu, (sheetTag) => {
    const currentIndex = sheetIndex;
    sheetIndex += 1;
    const withoutState = sheetTag.replace(/\sstate=(?:"[^"]*"|'[^']*')/gu, "");
    if (currentIndex !== selectedSheetIndex) return withoutState.replace(/\/>$/u, ' state="hidden"/>');
    const name = withoutState.match(/\bname=(?:"([^"]*)"|'([^']*)')/u);
    selectedSheetName = decodedXmlAttribute(name?.[1] ?? name?.[2] ?? "Sheet");
    return withoutState;
  });

  if (!sheetIndex || selectedSheetIndex < 0 || selectedSheetIndex >= sheetIndex) {
    throw new Error("चुनी हुई Excel sheet नहीं मिली। File दोबारा चुनें।");
  }
  return printArea ? withPrintArea(updatedXml, selectedSheetIndex, selectedSheetName, printArea) : updatedXml;
}

async function workbookForSelectedSheet(source: Buffer, selectedSheetIndex: number, printArea?: ExcelPrintArea) {
  const zip = await JSZip.loadAsync(source);
  const workbookFile = zip.file("xl/workbook.xml");
  if (!workbookFile) throw new Error("यह सही .xlsx workbook नहीं है।");
  const workbookXml = await workbookFile.async("string");
  zip.file("xl/workbook.xml", withSheetVisibility(workbookXml, selectedSheetIndex, printArea));
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

function libreOfficeCandidates() {
  const candidates = [
    process.env.LIBREOFFICE_PATH,
    process.platform === "win32" ? path.join(process.env.ProgramFiles ?? "C:\\Program Files", "LibreOffice", "program", "soffice.com") : undefined,
    process.platform === "win32" ? path.join(process.env.ProgramFiles ?? "C:\\Program Files", "LibreOffice", "program", "soffice.exe") : undefined,
    process.platform === "win32" ? path.join(process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)", "LibreOffice", "program", "soffice.com") : undefined,
    process.platform === "win32" ? path.join(process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)", "LibreOffice", "program", "soffice.exe") : undefined,
    process.platform === "darwin" ? "/Applications/LibreOffice.app/Contents/MacOS/soffice" : undefined,
    "soffice",
    "libreoffice",
  ].filter((candidate): candidate is string => Boolean(candidate));
  return [...new Set(candidates)];
}

async function existingAbsoluteCandidate(candidate: string) {
  if (!path.isAbsolute(candidate)) return true;
  try {
    await access(candidate, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

interface CommandResult {
  code: number | null;
  stderr: string;
  stdout: string;
}

function runCommand(command: string, args: string[], environment: NodeJS.ProcessEnv) {
  return new Promise<CommandResult>((resolve, reject) => {
    const child = spawn(command, args, {
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stderr = "";
    let stdout = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, CONVERSION_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      if (stdout.length < OUTPUT_LIMIT) stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < OUTPUT_LIMIT) stderr += chunk.toString("utf8");
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error("Excel conversion में बहुत समय लगा। Workbook को छोटा करके फिर प्रयास करें।"));
        return;
      }
      resolve({ code, stderr, stdout });
    });
  });
}

async function runLibreOffice(args: string[], environment: NodeJS.ProcessEnv) {
  for (const candidate of libreOfficeCandidates()) {
    if (!(await existingAbsoluteCandidate(candidate))) continue;
    try {
      const result = await runCommand(candidate, args, environment);
      if (result.code === 0) return result;
      const detail = (result.stderr || result.stdout).trim();
      throw new Error(detail ? `LibreOffice conversion असफल रही: ${detail.slice(0, 500)}` : "LibreOffice conversion असफल रही।");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw error;
    }
  }
  throw new LibreOfficeUnavailableError("इस server पर LibreOffice उपलब्ध नहीं है। LibreOffice install करें या LIBREOFFICE_PATH सेट करें।");
}

async function createFontConfig(temporaryDirectory: string) {
  const fontsDirectory = path.join(temporaryDirectory, "fonts");
  const cacheDirectory = path.join(temporaryDirectory, "font-cache");
  await Promise.all([mkdir(fontsDirectory), mkdir(cacheDirectory)]);
  const bundledFont = path.join(process.cwd(), "public", "fonts", "devlys-010-normal.ttf");
  try {
    await copyFile(bundledFont, path.join(fontsDirectory, "devlys-010-normal.ttf"));
  } catch {
    // System-installed fonts are still available when the optional bundled font is absent.
  }
  const fontConfigPath = path.join(temporaryDirectory, "fonts.conf");
  await writeFile(fontConfigPath, `<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n<fontconfig><dir>${xmlAttributeText(fontsDirectory)}</dir><dir prefix="default">fonts</dir><cachedir>${xmlAttributeText(cacheDirectory)}</cachedir></fontconfig>`, "utf8");
  return fontConfigPath;
}

export async function convertXlsxToPdf(source: Buffer, selectedSheetIndex: number, printArea?: ExcelPrintArea) {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "office-sahayak-excel-"));
  const inputPath = path.join(temporaryDirectory, "workbook.xlsx");
  const outputDirectory = path.join(temporaryDirectory, "output");
  const profileDirectory = path.join(temporaryDirectory, "libreoffice-profile");

  try {
    await Promise.all([mkdir(outputDirectory), mkdir(profileDirectory)]);
    const selectedWorkbook = await workbookForSelectedSheet(source, selectedSheetIndex, printArea);
    await writeFile(inputPath, selectedWorkbook);
    const fontConfigPath = await createFontConfig(temporaryDirectory);
    const argumentsList = [
      "--headless",
      "--nologo",
      "--nolockcheck",
      "--nodefault",
      "--nofirststartwizard",
      `-env:UserInstallation=${pathToFileURL(profileDirectory).href}`,
      "--convert-to",
      "pdf",
      "--outdir",
      outputDirectory,
      inputPath,
    ];
    await runLibreOffice(argumentsList, {
      ...process.env,
      FONTCONFIG_FILE: fontConfigPath,
    });

    const outputFiles = await readdir(outputDirectory);
    const pdfName = outputFiles.find((name) => name.toLowerCase().endsWith(".pdf"));
    if (!pdfName) throw new Error("LibreOffice ने PDF file नहीं बनाई। चुनी हुई sheet में printable data जाँचें।");
    return await readFile(path.join(outputDirectory, pdfName));
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}
