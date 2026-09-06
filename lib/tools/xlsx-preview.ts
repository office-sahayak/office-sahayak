import JSZip from "jszip";

export type ExcelHorizontalAlignment = "center" | "justify" | "left" | "right";
export type ExcelVerticalAlignment = "bottom" | "middle" | "top";

export interface ExcelBorderSide {
  color: string;
  style: string;
}

export interface ExcelCellStyle {
  backgroundColor: string;
  bold: boolean;
  hasBorder: boolean;
  borderBottom?: ExcelBorderSide;
  borderLeft?: ExcelBorderSide;
  borderRight?: ExcelBorderSide;
  borderTop?: ExcelBorderSide;
  color: string;
  fontFamily: string;
  fontSizePoints: number;
  horizontal?: ExcelHorizontalAlignment;
  italic: boolean;
  shrinkToFit: boolean;
  underline: boolean;
  vertical: ExcelVerticalAlignment;
  wrapText: boolean;
}

export interface ExcelCell {
  styleIndex: number;
  value: string;
}

export interface ExcelRow {
  cells: Record<number, ExcelCell>;
  customHeight: boolean;
  heightPoints?: number;
  hidden: boolean;
  index: number;
}

export interface ExcelMerge {
  endColumn: number;
  endRow: number;
  startColumn: number;
  startRow: number;
}

export interface ExcelPageSettings {
  footerMarginInches: number;
  headerMarginInches: number;
  oddFooter: string;
  oddHeader: string;
  orientation: "landscape" | "portrait";
  paperSize: number;
  marginBottomInches: number;
  marginLeftInches: number;
  marginRightInches: number;
  marginTopInches: number;
}

export interface ParsedSheet {
  columnWidthsPixels: number[];
  hasData: boolean;
  ignoredOutlierCells: number;
  manualRowBreaks: number[];
  maxColumn: number;
  maxRow: number;
  merges: ExcelMerge[];
  minColumn: number;
  minRow: number;
  name: string;
  page: ExcelPageSettings;
  repeatRows?: {
    endRow: number;
    startRow: number;
  };
  rows: ExcelRow[];
}

export interface ParsedWorkbook {
  sheets: ParsedSheet[];
  styles: ExcelCellStyle[];
}

const RELATIONSHIP_NAMESPACE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

const indexedColors = [
  "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff",
  "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff",
  "#800000", "#008000", "#000080", "#808000", "#800080", "#008080", "#c0c0c0", "#808080",
];

const builtInNumberFormats = new Map<number, string>([
  [9, "0%"], [10, "0.00%"], [14, "mm-dd-yy"], [15, "d-mmm-yy"], [16, "d-mmm"],
  [17, "mmm-yy"], [18, "h:mm AM/PM"], [19, "h:mm:ss AM/PM"], [20, "h:mm"],
  [21, "h:mm:ss"], [22, "m/d/yy h:mm"], [45, "mm:ss"], [46, "[h]:mm:ss"], [47, "mmss.0"],
]);

function localElements(parent: Document | Element, name: string) {
  return Array.from(parent.getElementsByTagNameNS("*", name));
}

function parseXml(source: string) {
  const documentNode = new DOMParser().parseFromString(source, "application/xml");
  if (documentNode.querySelector("parsererror")) throw new Error("Excel file का XML सही नहीं है।");
  return documentNode;
}

function numericAttribute(element: Element | undefined, name: string, fallback: number) {
  const value = element?.getAttribute(name);
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanAttribute(element: Element | undefined, name: string) {
  const value = element?.getAttribute(name);
  return value === "1" || value === "true";
}

function columnIndex(reference: string) {
  const letters = reference.match(/^[A-Z]+/iu)?.[0].toUpperCase() ?? "A";
  return Array.from(letters).reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function cellReference(reference: string) {
  return {
    column: columnIndex(reference),
    row: Math.max(0, Number(reference.match(/\d+$/u)?.[0] ?? 1) - 1),
  };
}

function rangeReference(reference: string) {
  const cleaned = reference.replace(/\$/gu, "").split("!").pop()?.replace(/^'|'$/gu, "") ?? "A1";
  const [start, end = start] = cleaned.split(":");
  const startCell = cellReference(start);
  const endCell = cellReference(end);
  return {
    minColumn: Math.min(startCell.column, endCell.column),
    maxColumn: Math.max(startCell.column, endCell.column),
    minRow: Math.min(startCell.row, endCell.row),
    maxRow: Math.max(startCell.row, endCell.row),
  };
}

function resolveZipPath(basePath: string, target: string) {
  if (target.startsWith("/")) return target.slice(1);
  const parts = `${basePath}/${target}`.split("/");
  const resolved: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") resolved.pop();
    else resolved.push(part);
  }
  return resolved.join("/");
}

function themeColors(themeSource: string | undefined) {
  if (!themeSource) return [] as string[];
  const theme = parseXml(themeSource);
  const scheme = localElements(theme, "clrScheme")[0];
  if (!scheme) return [] as string[];
  const colors = new Map(Array.from(scheme.children).map((item) => {
    const color = item.firstElementChild;
    return [item.localName, `#${color?.getAttribute("val") ?? color?.getAttribute("lastClr") ?? "000000"}`];
  }));
  return ["lt1", "dk1", "lt2", "dk2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"]
    .map((name) => colors.get(name) ?? "#000000");
}

function excelColor(element: Element | undefined, theme: string[], fallback: string) {
  if (!element) return fallback;
  const rgb = element.getAttribute("rgb");
  if (rgb) return `#${rgb.slice(-6)}`;
  const themeIndex = Number(element.getAttribute("theme"));
  if (Number.isInteger(themeIndex) && theme[themeIndex]) return theme[themeIndex];
  const indexed = Number(element.getAttribute("indexed"));
  if (Number.isInteger(indexed) && indexedColors[indexed]) return indexedColors[indexed];
  return fallback;
}

function borderSide(element: Element | undefined, theme: string[]): ExcelBorderSide | undefined {
  const style = element?.getAttribute("style");
  if (!element || !style) return undefined;
  return { style, color: excelColor(localElements(element, "color")[0], theme, "#000000") };
}

function horizontalAlignment(value: string | null): ExcelHorizontalAlignment | undefined {
  if (value === "center" || value === "centerContinuous") return "center";
  if (value === "right") return "right";
  if (value === "justify" || value === "distributed" || value === "fill") return "justify";
  if (value === "left") return "left";
  return undefined;
}

function verticalAlignment(value: string | null): ExcelVerticalAlignment {
  if (value === "center" || value === "distributed" || value === "justify") return "middle";
  if (value === "top") return "top";
  return "bottom";
}

function parseStyles(stylesSource: string | undefined, theme: string[]) {
  const fallback: ExcelCellStyle = {
    backgroundColor: "transparent", bold: false, color: "#000000", fontFamily: "Calibri, Arial, sans-serif",
    fontSizePoints: 11, hasBorder: false, italic: false, shrinkToFit: false, underline: false, vertical: "bottom", wrapText: false,
  };
  if (!stylesSource) return { styles: [fallback], numberFormats: [""] };
  const documentNode = parseXml(stylesSource);
  const fonts = localElements(localElements(documentNode, "fonts")[0] ?? documentNode, "font").map((font) => ({
    family: localElements(font, "name")[0]?.getAttribute("val") ?? "Calibri",
    size: numericAttribute(localElements(font, "sz")[0], "val", 11),
    bold: localElements(font, "b").length > 0,
    italic: localElements(font, "i").length > 0,
    underline: localElements(font, "u").length > 0,
    color: excelColor(localElements(font, "color")[0], theme, "#000000"),
  }));
  const fills = localElements(localElements(documentNode, "fills")[0] ?? documentNode, "fill").map((fill) => {
    const pattern = localElements(fill, "patternFill")[0];
    return pattern?.getAttribute("patternType") === "solid"
      ? excelColor(localElements(pattern, "fgColor")[0], theme, "transparent")
      : "transparent";
  });
  const borders = localElements(localElements(documentNode, "borders")[0] ?? documentNode, "border").map((border) => ({
    bottom: borderSide(localElements(border, "bottom")[0], theme),
    left: borderSide(localElements(border, "left")[0], theme),
    right: borderSide(localElements(border, "right")[0], theme),
    top: borderSide(localElements(border, "top")[0], theme),
  }));
  const customFormats = new Map(localElements(documentNode, "numFmt").map((format) => [
    numericAttribute(format, "numFmtId", 0), format.getAttribute("formatCode") ?? "",
  ]));
  const cellXfs = localElements(documentNode, "cellXfs")[0];
  const xfs = cellXfs ? Array.from(cellXfs.children).filter((element) => element.localName === "xf") : [];
  const numberFormats: string[] = [];
  const styles = xfs.map((xf) => {
    const font = fonts[numericAttribute(xf, "fontId", 0)] ?? fonts[0];
    const fill = fills[numericAttribute(xf, "fillId", 0)] ?? "transparent";
    const border = borders[numericAttribute(xf, "borderId", 0)] ?? {};
    const alignment = localElements(xf, "alignment")[0];
    const numberFormatId = numericAttribute(xf, "numFmtId", 0);
    numberFormats.push(customFormats.get(numberFormatId) ?? builtInNumberFormats.get(numberFormatId) ?? "");
    return {
      backgroundColor: fill,
      bold: font?.bold ?? false,
      borderBottom: border.bottom,
      borderLeft: border.left,
      borderRight: border.right,
      borderTop: border.top,
      color: font?.color ?? "#000000",
      fontFamily: font?.family ?? "Calibri",
      fontSizePoints: font?.size ?? 11,
      hasBorder: numericAttribute(xf, "borderId", 0) > 0,
      horizontal: horizontalAlignment(alignment?.getAttribute("horizontal") ?? null),
      italic: font?.italic ?? false,
      shrinkToFit: booleanAttribute(alignment, "shrinkToFit"),
      underline: font?.underline ?? false,
      vertical: verticalAlignment(alignment?.getAttribute("vertical") ?? null),
      wrapText: booleanAttribute(alignment, "wrapText"),
    } satisfies ExcelCellStyle;
  });
  return { styles: styles.length ? styles : [fallback], numberFormats };
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

function displayNumber(raw: string, format: string) {
  const numeric = Number(raw);
  if (!raw || !Number.isFinite(numeric)) return raw;
  if (looksLikeDateFormat(format)) return excelDate(numeric, /[hs]/iu.test(format));
  if (format.includes("%")) {
    const decimals = format.match(/0\.(0+)/u)?.[1].length ?? 0;
    return `${(numeric * 100).toFixed(decimals)}%`;
  }
  return raw;
}

function dominantRange(cells: Array<{ column: number; row: number; value: string }>) {
  const nonEmpty = cells.filter((cell) => cell.value.trim() !== "");
  if (!nonEmpty.length) return { minColumn: 0, maxColumn: 0, minRow: 0, maxRow: 0, ignored: 0 };
  const counts = new Map<number, number>();
  for (const cell of nonEmpty) counts.set(cell.column, (counts.get(cell.column) ?? 0) + 1);
  const columns = Array.from(counts.keys()).sort((left, right) => left - right);
  const clusters: number[][] = [];
  for (const column of columns) {
    const current = clusters.at(-1);
    if (!current || column - current.at(-1)! > 4) clusters.push([column]);
    else current.push(column);
  }
  const cluster = clusters.sort((left, right) => {
    const rightScore = right.reduce((total, column) => total + (counts.get(column) ?? 0), 0);
    const leftScore = left.reduce((total, column) => total + (counts.get(column) ?? 0), 0);
    return rightScore - leftScore || left[0] - right[0];
  })[0];
  // A single accidental value just beyond an otherwise dense table should
  // not widen every printed page. Excel's used range often retains these
  // cells even after the user has cleared the surrounding columns.
  while (cluster.length > 1) {
    const last = cluster.at(-1)!;
    const previous = cluster.at(-2)!;
    if ((counts.get(last) ?? 0) !== 1 || last - previous <= 1) break;
    cluster.pop();
  }
  while (cluster.length > 1) {
    const first = cluster[0];
    const next = cluster[1];
    if ((counts.get(first) ?? 0) !== 1 || next - first <= 1) break;
    cluster.shift();
  }
  const minColumn = cluster[0];
  const maxColumn = cluster.at(-1)!;
  const selected = nonEmpty.filter((cell) => cell.column >= minColumn && cell.column <= maxColumn);
  return {
    minColumn,
    maxColumn,
    minRow: Math.min(...selected.map((cell) => cell.row)),
    maxRow: Math.max(...selected.map((cell) => cell.row)),
    ignored: nonEmpty.length - selected.length,
  };
}

function excelColumnWidthPixels(width: number) {
  return Math.max(8, Math.floor(width * 7 + 5));
}

function sheetPrintArea(definedNames: Element[], sheetIndex: number) {
  const definition = definedNames.find((element) => element.getAttribute("name") === "_xlnm.Print_Area"
    && Number(element.getAttribute("localSheetId")) === sheetIndex);
  const firstArea = definition?.textContent?.split(",")[0];
  return firstArea ? rangeReference(firstArea) : undefined;
}

function sheetPrintTitleRows(definedNames: Element[], sheetIndex: number) {
  const definition = definedNames.find((element) => element.getAttribute("name") === "_xlnm.Print_Titles"
    && Number(element.getAttribute("localSheetId")) === sheetIndex);
  const match = definition?.textContent?.match(/!\$?(\d+):\$?(\d+)/u);
  if (!match) return undefined;
  const startRow = Math.max(0, Number(match[1]) - 1);
  const endRow = Math.max(0, Number(match[2]) - 1);
  return { startRow: Math.min(startRow, endRow), endRow: Math.max(startRow, endRow) };
}

export async function parseXlsx(file: File): Promise<ParsedWorkbook> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const workbookSource = await zip.file("xl/workbook.xml")?.async("string");
  const relationshipsSource = await zip.file("xl/_rels/workbook.xml.rels")?.async("string");
  if (!workbookSource || !relationshipsSource) throw new Error("यह सही .xlsx workbook नहीं है।");

  const workbook = parseXml(workbookSource);
  const relationships = parseXml(relationshipsSource);
  const relationshipMap = new Map(localElements(relationships, "Relationship").map((element) => [
    element.getAttribute("Id") ?? "", element.getAttribute("Target") ?? "",
  ]));
  const sheetMeta = localElements(workbook, "sheet").map((element) => ({
    name: element.getAttribute("name") ?? "Sheet",
    relationshipId: element.getAttributeNS(RELATIONSHIP_NAMESPACE, "id") ?? element.getAttribute("r:id") ?? "",
  }));
  const definedNames = localElements(workbook, "definedName");

  const sharedStringsSource = await zip.file("xl/sharedStrings.xml")?.async("string");
  const sharedStrings = sharedStringsSource
    ? localElements(parseXml(sharedStringsSource), "si").map((item) => localElements(item, "t").map((text) => text.textContent ?? "").join(""))
    : [];
  const themeSource = await zip.file("xl/theme/theme1.xml")?.async("string");
  const stylesSource = await zip.file("xl/styles.xml")?.async("string");
  const parsedStyles = parseStyles(stylesSource, themeColors(themeSource));

  const sheets: ParsedSheet[] = [];
  for (let sheetIndex = 0; sheetIndex < sheetMeta.length; sheetIndex += 1) {
    const metadata = sheetMeta[sheetIndex];
    const target = relationshipMap.get(metadata.relationshipId);
    if (!target) continue;
    const path = resolveZipPath("xl", target);
    const sheetSource = await zip.file(path)?.async("string");
    if (!sheetSource) continue;
    const sheet = parseXml(sheetSource);
    const parsedCells: Array<{ column: number; row: number; styleIndex: number; value: string }> = [];

    for (const cell of localElements(sheet, "c")) {
      const reference = cell.getAttribute("r") ?? "A1";
      const { column, row } = cellReference(reference);
      const type = cell.getAttribute("t") ?? "n";
      const valueElement = localElements(cell, "v")[0];
      const raw = valueElement?.textContent ?? "";
      let value = raw;
      if (type === "s") value = sharedStrings[Number(raw)] ?? "";
      else if (type === "inlineStr") value = localElements(cell, "t").map((item) => item.textContent ?? "").join("");
      else if (type === "b") value = raw === "1" ? "TRUE" : "FALSE";
      else if (type === "e") value = `Error: ${raw}`;
      const styleIndex = Number(cell.getAttribute("s") ?? 0);
      if ((type === "n" || !type) && raw) value = displayNumber(raw, parsedStyles.numberFormats[styleIndex] ?? "");
      parsedCells.push({ column, row, styleIndex, value });
    }

    const detectedRange = sheetPrintArea(definedNames, sheetIndex) ?? dominantRange(parsedCells);
    const hasData = parsedCells.some((cell) => cell.value.trim() !== ""
      && cell.column >= detectedRange.minColumn && cell.column <= detectedRange.maxColumn
      && cell.row >= detectedRange.minRow && cell.row <= detectedRange.maxRow);
    const rowElements = new Map(localElements(sheet, "row").map((row) => [Number(row.getAttribute("r") ?? 1) - 1, row]));
    const cellsByRow = new Map<number, Record<number, ExcelCell>>();
    for (const cell of parsedCells) {
      if (cell.column < detectedRange.minColumn || cell.column > detectedRange.maxColumn
        || cell.row < detectedRange.minRow || cell.row > detectedRange.maxRow) continue;
      const rowCells = cellsByRow.get(cell.row) ?? {};
      rowCells[cell.column] = { styleIndex: cell.styleIndex, value: cell.value };
      cellsByRow.set(cell.row, rowCells);
    }
    const sheetFormat = localElements(sheet, "sheetFormatPr")[0];
    const defaultRowHeight = numericAttribute(sheetFormat, "defaultRowHeight", 15);
    const rows: ExcelRow[] = [];
    for (let rowIndex = detectedRange.minRow; rowIndex <= detectedRange.maxRow; rowIndex += 1) {
      const row = rowElements.get(rowIndex);
      rows.push({
        cells: cellsByRow.get(rowIndex) ?? {},
        // Some Excel writers persist an explicit `ht` value without also
        // writing customHeight="1".  The height is still authoritative and
        // must be honoured, especially for tall wrapped heading rows.
        customHeight: Boolean(row?.hasAttribute("ht")) || booleanAttribute(row, "customHeight"),
        heightPoints: row?.hasAttribute("ht") ? numericAttribute(row, "ht", defaultRowHeight) : defaultRowHeight,
        hidden: booleanAttribute(row, "hidden"),
        index: rowIndex,
      });
    }
    const defaultColumnWidth = numericAttribute(sheetFormat, "defaultColWidth", 8.43);
    const columnDefinitions = localElements(sheet, "col");
    const columnWidthsPixels = Array.from({ length: detectedRange.maxColumn - detectedRange.minColumn + 1 }, (_, relativeIndex) => {
      const columnNumber = detectedRange.minColumn + relativeIndex + 1;
      const definition = columnDefinitions.find((column) => columnNumber >= numericAttribute(column, "min", 1)
        && columnNumber <= numericAttribute(column, "max", 1));
      return booleanAttribute(definition, "hidden") ? 0 : excelColumnWidthPixels(numericAttribute(definition, "width", defaultColumnWidth));
    });
    const merges = localElements(sheet, "mergeCell")
      .map((element) => rangeReference(element.getAttribute("ref") ?? "A1"))
      .filter((merge) => merge.maxColumn >= detectedRange.minColumn && merge.minColumn <= detectedRange.maxColumn
        && merge.maxRow >= detectedRange.minRow && merge.minRow <= detectedRange.maxRow)
      .map((merge) => ({ startColumn: merge.minColumn, endColumn: merge.maxColumn, startRow: merge.minRow, endRow: merge.maxRow }));
    const pageMargins = localElements(sheet, "pageMargins")[0];
    const pageSetup = localElements(sheet, "pageSetup")[0];
    const headerFooter = localElements(sheet, "headerFooter")[0];
    const rowBreaks = localElements(sheet, "rowBreaks")[0];
    const manualRowBreaks = rowBreaks
      ? localElements(rowBreaks, "brk").filter((element) => booleanAttribute(element, "man")).map((element) => numericAttribute(element, "id", 0))
      : [];
    const ignoredOutlierCells = "ignored" in detectedRange && typeof detectedRange.ignored === "number" ? detectedRange.ignored : 0;
    const printTitleRows = sheetPrintTitleRows(definedNames, sheetIndex);
    const repeatRows = printTitleRows
      && printTitleRows.endRow >= detectedRange.minRow
      && printTitleRows.startRow <= detectedRange.maxRow
      ? {
          startRow: Math.max(printTitleRows.startRow, detectedRange.minRow),
          endRow: Math.min(printTitleRows.endRow, detectedRange.maxRow),
        }
      : undefined;

    sheets.push({
      columnWidthsPixels,
      hasData,
      ignoredOutlierCells,
      manualRowBreaks,
      maxColumn: detectedRange.maxColumn,
      maxRow: detectedRange.maxRow,
      merges,
      minColumn: detectedRange.minColumn,
      minRow: detectedRange.minRow,
      name: metadata.name,
      page: {
        footerMarginInches: numericAttribute(pageMargins, "footer", 0.3),
        headerMarginInches: numericAttribute(pageMargins, "header", 0.3),
        marginBottomInches: numericAttribute(pageMargins, "bottom", 0.75),
        marginLeftInches: numericAttribute(pageMargins, "left", 0.7),
        marginRightInches: numericAttribute(pageMargins, "right", 0.7),
        marginTopInches: numericAttribute(pageMargins, "top", 0.75),
        oddFooter: localElements(headerFooter ?? sheet, "oddFooter")[0]?.textContent ?? "",
        oddHeader: localElements(headerFooter ?? sheet, "oddHeader")[0]?.textContent ?? "",
        orientation: pageSetup?.getAttribute("orientation") === "landscape" ? "landscape" : "portrait",
        paperSize: numericAttribute(pageSetup, "paperSize", 9),
      },
      repeatRows,
      rows,
    });
  }
  if (!sheets.length) throw new Error("Workbook में कोई readable sheet नहीं मिली।");
  return { sheets, styles: parsedStyles.styles };
}
