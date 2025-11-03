// Zero-dependency XLSX writer for DataFrames
import type { DataFrame } from "../dataframe/index.ts";

interface WriteXLSXOpts {
  sheet?: string;
}

/**
 * Write a DataFrame to an XLSX file.
 *
 * Exports DataFrame data to XLSX format using zero external dependencies.
 * Handles strings, numbers, booleans, and dates. Dates are converted to
 * Excel serial numbers. The resulting file can be opened in Excel, LibreOffice, etc.
 *
 * Supports writing to specific sheets. If the file exists, it will be updated
 * with the new sheet data (replacing if the sheet exists, or adding if new).
 *
 * @param dataFrame - The DataFrame to export
 * @param path - File path where the XLSX file should be written
 * @param opts - Options including sheet name (defaults to "Sheet1")
 *
 * @returns A Promise that resolves when the file is successfully written
 *
 * @example
 * ```ts
 * const df1 = createDataFrame([{ name: "Alice", age: 30 }]);
 * const df2 = createDataFrame([{ product: "Widget", price: 9.99 }]);
 *
 * // Write to Sheet1 (default)
 * await writeXLSX(df1, "./data.xlsx");
 *
 * // Write to a different sheet in the same file
 * await writeXLSX(df2, "./data.xlsx", { sheet: "Products" });
 * ```
 */
export async function writeXLSX<T extends Record<string, unknown>>(
  dataFrame: DataFrame<T>,
  path: string,
  opts: WriteXLSXOpts = {},
): Promise<void> {
  const sheetName = opts.sheet ?? "Sheet1";
  const rows = dataFrame.toArray();
  const columns = dataFrame.columns();

  // Check if file exists and is valid XLSX
  let existingFile: Uint8Array | null = null;
  try {
    existingFile = await Deno.readFile(path);
    // Verify it's a valid XLSX by checking for ZIP signature
    if (
      existingFile.length < 4 ||
      existingFile[0] !== 0x50 || existingFile[1] !== 0x4b ||
      existingFile[2] !== 0x03 || existingFile[3] !== 0x04
    ) {
      // Not a valid ZIP/XLSX file, treat as new
      existingFile = null;
    }
  } catch {
    // File doesn't exist, will create new
    existingFile = null;
  }

  if (existingFile) {
    // File exists and is valid - update it with new sheet
    await updateXLSXWithSheet(path, existingFile, sheetName, rows, columns);
  } else {
    // File doesn't exist or is invalid - create new
    await createNewXLSX(path, sheetName, rows, columns);
  }
}

async function createNewXLSX<T extends Record<string, unknown>>(
  path: string,
  sheetName: string,
  rows: readonly T[],
  columns: string[],
): Promise<void> {
  // Build the XLSX structure with single sheet
  const { sharedStrings, worksheet } = buildWorksheet(rows, columns);
  const workbookXml = buildWorkbook([sheetName], [1]);
  const sharedStringsXml = buildSharedStrings(sharedStrings);
  const stylesXml = buildStyles();
  const contentTypesXml = buildContentTypes([1]);
  const relsXml = buildRels();
  const workbookRelsXml = buildWorkbookRels([1]);

  // Create ZIP archive
  const zipBuffer = await createZip({
    "[Content_Types].xml": contentTypesXml,
    "_rels/.rels": relsXml,
    "xl/workbook.xml": workbookXml,
    "xl/_rels/workbook.xml.rels": workbookRelsXml,
    "xl/worksheets/sheet1.xml": worksheet,
    "xl/sharedStrings.xml": sharedStringsXml,
    "xl/styles.xml": stylesXml,
  });

  // Write to file
  await Deno.writeFile(path, zipBuffer);
}

async function updateXLSXWithSheet<T extends Record<string, unknown>>(
  path: string,
  existingFile: Uint8Array,
  sheetName: string,
  rows: readonly T[],
  columns: string[],
): Promise<void> {
  // Extract existing sheets from ZIP
  const existingSheets = await extractAllSheets(existingFile);
  const workbookXml = await extractFileFromZip(existingFile, "xl/workbook.xml");

  if (!workbookXml) {
    throw new Error("Invalid XLSX file: no workbook.xml found");
  }

  // Parse existing sheet names
  const existingSheetNames = parseSheetNames(workbookXml);

  // Find if sheet already exists
  const sheetIndex = existingSheetNames.indexOf(sheetName);
  const isNewSheet = sheetIndex === -1;

  // Extract existing shared strings
  const existingSharedStringsXml = await extractFileFromZip(
    existingFile,
    "xl/sharedStrings.xml",
  );
  const existingStrings = existingSharedStringsXml
    ? parseSharedStringsFromXml(existingSharedStringsXml)
    : [];

  // Build new worksheet with offset for shared strings
  const { sharedStrings, worksheet } = buildWorksheet(
    rows,
    columns,
    existingStrings.length,
  );

  // Combine shared strings
  const allSharedStrings = [...existingStrings, ...sharedStrings];

  // Collect all sheets
  const allSheets: Record<string, string> = {};
  const allSheetNames: string[] = [];
  const sheetNumbers: number[] = [];

  if (isNewSheet) {
    // Add existing sheets
    for (let i = 0; i < existingSheetNames.length; i++) {
      allSheetNames.push(existingSheetNames[i]);
      sheetNumbers.push(i + 1);
      const sheetXml = existingSheets[`xl/worksheets/sheet${i + 1}.xml`];
      if (sheetXml) {
        allSheets[`xl/worksheets/sheet${i + 1}.xml`] = sheetXml;
      }
    }

    // Add new sheet
    const newSheetNum = existingSheetNames.length + 1;
    allSheetNames.push(sheetName);
    sheetNumbers.push(newSheetNum);
    allSheets[`xl/worksheets/sheet${newSheetNum}.xml`] = worksheet;
  } else {
    // Replace existing sheet
    for (let i = 0; i < existingSheetNames.length; i++) {
      allSheetNames.push(existingSheetNames[i]);
      sheetNumbers.push(i + 1);

      if (i === sheetIndex) {
        // Replace this sheet
        allSheets[`xl/worksheets/sheet${i + 1}.xml`] = worksheet;
      } else {
        // Keep existing sheet
        const sheetXml = existingSheets[`xl/worksheets/sheet${i + 1}.xml`];
        if (sheetXml) {
          allSheets[`xl/worksheets/sheet${i + 1}.xml`] = sheetXml;
        }
      }
    }
  }

  // Build updated workbook
  const workbookXmlNew = buildWorkbook(allSheetNames, sheetNumbers);
  const sharedStringsXml = buildSharedStrings(allSharedStrings);
  const stylesXml = buildStyles();
  const contentTypesXml = buildContentTypes(sheetNumbers);
  const relsXml = buildRels();
  const workbookRelsXml = buildWorkbookRels(sheetNumbers);

  // Create ZIP archive with all sheets
  const files: Record<string, string> = {
    "[Content_Types].xml": contentTypesXml,
    "_rels/.rels": relsXml,
    "xl/workbook.xml": workbookXmlNew,
    "xl/_rels/workbook.xml.rels": workbookRelsXml,
    "xl/sharedStrings.xml": sharedStringsXml,
    "xl/styles.xml": stylesXml,
    ...allSheets,
  };

  const zipBuffer = await createZip(files);

  // Write to file
  await Deno.writeFile(path, zipBuffer);
}

async function extractAllSheets(
  zipBuffer: Uint8Array,
): Promise<Record<string, string>> {
  const sheets: Record<string, string> = {};
  let i = 1;

  // Extract all worksheet files
  while (true) {
    const sheetPath = `xl/worksheets/sheet${i}.xml`;
    const sheetXml = await extractFileFromZip(zipBuffer, sheetPath);
    if (!sheetXml) break;
    sheets[sheetPath] = sheetXml;
    i++;
  }

  return sheets;
}

async function extractFileFromZip(
  zipBuffer: Uint8Array,
  filePath: string,
): Promise<string | null> {
  try {
    // Parse ZIP structure
    const view = new DataView(
      zipBuffer.buffer,
      zipBuffer.byteOffset,
      zipBuffer.byteLength,
    );

    // Find end of central directory
    let eocdOffset = -1;
    for (let i = zipBuffer.length - 22; i >= 0; i--) {
      if (view.getUint32(i, true) === 0x06054b50) {
        eocdOffset = i;
        break;
      }
    }

    if (eocdOffset === -1) {
      return null;
    }

    // Read central directory info
    const centralDirOffset = view.getUint32(eocdOffset + 16, true);
    const numEntries = view.getUint16(eocdOffset + 10, true);

    // Search through central directory for the file
    let cdOffset = centralDirOffset;
    for (let i = 0; i < numEntries; i++) {
      if (view.getUint32(cdOffset, true) !== 0x02014b50) {
        break;
      }

      const fileNameLength = view.getUint16(cdOffset + 28, true);
      const extraFieldLength = view.getUint16(cdOffset + 30, true);
      const commentLength = view.getUint16(cdOffset + 32, true);
      const localHeaderOffset = view.getUint32(cdOffset + 42, true);

      // Read file name
      const fileNameBytes = zipBuffer.slice(
        cdOffset + 46,
        cdOffset + 46 + fileNameLength,
      );
      const fileName = new TextDecoder().decode(fileNameBytes);

      if (fileName === filePath) {
        // Found the file - read from local header
        const localView = new DataView(
          zipBuffer.buffer,
          zipBuffer.byteOffset + localHeaderOffset,
        );

        if (localView.getUint32(0, true) !== 0x04034b50) {
          return null;
        }

        const compressionMethod = localView.getUint16(8, true);
        const compressedSize = localView.getUint32(18, true);
        const localFileNameLength = localView.getUint16(26, true);
        const localExtraFieldLength = localView.getUint16(28, true);

        const dataOffset = localHeaderOffset + 30 + localFileNameLength +
          localExtraFieldLength;
        const compressedData = zipBuffer.slice(
          dataOffset,
          dataOffset + compressedSize,
        );

        // Decompress if needed
        if (compressionMethod === 8) {
          // Deflate
          const decompressed = await decompressDeflate(compressedData);
          return new TextDecoder().decode(decompressed);
        } else if (compressionMethod === 0) {
          // No compression
          return new TextDecoder().decode(compressedData);
        }

        return null;
      }

      // Move to next entry
      cdOffset += 46 + fileNameLength + extraFieldLength + commentLength;
    }

    return null;
  } catch {
    return null;
  }
}

async function decompressDeflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new DecompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  // @ts-ignore - Uint8Array type mismatch
  writer.write(data);
  writer.close();

  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  reader.releaseLock();

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

function parseSheetNames(workbookXml: string): string[] {
  const sheetNames: string[] = [];
  const sheetRegex = /<sheet[^>]*name="([^"]*)"[^>]*\/>/g;
  let match;

  while ((match = sheetRegex.exec(workbookXml)) !== null) {
    sheetNames.push(match[1]);
  }

  return sheetNames;
}

function parseSharedStringsFromXml(xml: string): string[] {
  const strings: string[] = [];
  const siRegex = /<si[^>]*>(.*?)<\/si>/gs;
  let match;

  while ((match = siRegex.exec(xml)) !== null) {
    const content = match[1];
    // Extract text from <t> tags
    const tMatch = content.match(/<t[^>]*>(.*?)<\/t>/s);
    if (tMatch) {
      strings.push(unescapeXml(tMatch[1]));
    }
  }

  return strings;
}

function unescapeXml(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/*───────────────────────────────────────────────────────────────────────────┐
│  XML Building Functions                                                    │
└───────────────────────────────────────────────────────────────────────────*/

interface WorksheetResult {
  sharedStrings: string[];
  worksheet: string;
}

function buildWorksheet<T extends Record<string, unknown>>(
  rows: readonly T[],
  columns: readonly string[],
  stringIndexOffset: number = 0,
): WorksheetResult {
  const sharedStrings: string[] = [];
  const stringMap = new Map<string, number>();

  const getStringIndex = (str: string): number => {
    if (stringMap.has(str)) {
      return stringMap.get(str)!;
    }
    const index = sharedStrings.length + stringIndexOffset;
    sharedStrings.push(str);
    stringMap.set(str, index);
    return index;
  };

  let rowXml = "";

  // Header row
  let headerCells = "";
  columns.forEach((col, colIdx) => {
    const cellRef = columnIndexToLetter(colIdx) + "1";
    const strIndex = getStringIndex(col);
    headerCells += `<c r="${cellRef}" t="s"><v>${strIndex}</v></c>`;
  });
  rowXml += `<row r="1">${headerCells}</row>`;

  // Data rows
  rows.forEach((row, rowIdx) => {
    const rowNum = rowIdx + 2; // +2 because Excel is 1-indexed and we have a header
    let cells = "";

    columns.forEach((col, colIdx) => {
      const cellRef = columnIndexToLetter(colIdx) + rowNum;
      const value = row[col];

      if (value === null || value === undefined) {
        // Empty cell
        cells += `<c r="${cellRef}"/>`;
      } else if (typeof value === "string") {
        const strIndex = getStringIndex(value);
        cells += `<c r="${cellRef}" t="s"><v>${strIndex}</v></c>`;
      } else if (typeof value === "number") {
        cells += `<c r="${cellRef}"><v>${value}</v></c>`;
      } else if (typeof value === "boolean") {
        cells += `<c r="${cellRef}" t="b"><v>${value ? 1 : 0}</v></c>`;
      } else if (value instanceof Date) {
        const serial = dateToExcelSerial(value);
        cells += `<c r="${cellRef}" s="1"><v>${serial}</v></c>`;
      } else {
        // Convert to string
        const strIndex = getStringIndex(String(value));
        cells += `<c r="${cellRef}" t="s"><v>${strIndex}</v></c>`;
      }
    });

    rowXml += `<row r="${rowNum}">${cells}</row>`;
  });

  const dimension = `A1:${columnIndexToLetter(columns.length - 1)}${
    rows.length + 1
  }`;

  const worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="${dimension}"/>
  <sheetData>${rowXml}</sheetData>
</worksheet>`;

  return { sharedStrings, worksheet };
}

function buildSharedStrings(strings: string[]): string {
  const items = strings
    .map((str) => {
      const escaped = escapeXml(str);
      // Add xml:space="preserve" to handle whitespace and special characters correctly
      return `<si><t xml:space="preserve">${escaped}</t></si>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">
  ${items}
</sst>`;
}

function buildWorkbook(sheetNames: string[], sheetNumbers: number[]): string {
  const sheetsXml = sheetNames
    .map((name, idx) => {
      const sheetId = idx + 1;
      const rId = `rId${sheetNumbers[idx]}`;
      return `    <sheet name="${
        escapeXml(name)
      }" sheetId="${sheetId}" r:id="${rId}"/>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
${sheetsXml}
  </sheets>
</workbook>`;
}

function buildStyles(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="yyyy-mm-dd"/>
  </numFmts>
  <fonts count="1">
    <font><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="1">
    <fill><patternFill patternType="none"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
  </cellXfs>
</styleSheet>`;
}

function buildContentTypes(sheetNumbers: number[]): string {
  const worksheetOverrides = sheetNumbers
    .map((num) =>
      `  <Override PartName="/xl/worksheets/sheet${num}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${worksheetOverrides}
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`;
}

function buildRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function buildWorkbookRels(sheetNumbers: number[]): string {
  const worksheetRels = sheetNumbers
    .map((num) =>
      `  <Relationship Id="rId${num}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${num}.xml"/>`
    )
    .join("\n");

  const nextRId = sheetNumbers.length + 1;
  const stylesRId = nextRId;
  const stringsRId = nextRId + 1;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${worksheetRels}
  <Relationship Id="rId${stylesRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId${stringsRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`;
}

/*───────────────────────────────────────────────────────────────────────────┐
│  Helper Functions                                                          │
└───────────────────────────────────────────────────────────────────────────*/

function columnIndexToLetter(index: number): string {
  let letter = "";
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

function dateToExcelSerial(date: Date): number {
  const excelEpoch = new Date(1899, 11, 30);
  const diff = date.getTime() - excelEpoch.getTime();
  const days = diff / 86400000; // milliseconds in a day
  return days;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // Remove control characters that are invalid in XML (except tab, newline, carriage return)
    // This fixes Excel recovery errors with certain string data
    // deno-lint-ignore no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/*───────────────────────────────────────────────────────────────────────────┐
│  ZIP Creation (Zero Dependencies)                                         │
└───────────────────────────────────────────────────────────────────────────*/

interface ZipFiles {
  [path: string]: string;
}

async function createZip(files: ZipFiles): Promise<Uint8Array> {
  const entries: Array<
    { path: string; data: Uint8Array; compressed: Uint8Array }
  > = [];

  // Compress each file
  for (const [path, content] of Object.entries(files)) {
    const data = new TextEncoder().encode(content);
    const compressed = await compressDeflate(data);
    entries.push({ path, data, compressed });
  }

  // Calculate sizes
  let offset = 0;
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];

  for (const entry of entries) {
    // Local file header
    const localHeader = createLocalFileHeader(
      entry.path,
      entry.data,
      entry.compressed,
    );
    localHeaders.push(localHeader);

    // Central directory header
    const centralHeader = createCentralDirectoryHeader(
      entry.path,
      entry.data,
      entry.compressed,
      offset,
    );
    centralHeaders.push(centralHeader);

    offset += localHeader.length + entry.compressed.length;
  }

  // End of central directory
  const centralDirOffset = offset;
  const centralDirSize = centralHeaders.reduce((sum, h) => sum + h.length, 0);
  const endOfCentralDir = createEndOfCentralDirectory(
    entries.length,
    centralDirSize,
    centralDirOffset,
  );

  // Combine everything
  const totalSize = localHeaders.reduce((sum, h) => sum + h.length, 0) +
    entries.reduce((sum, e) => sum + e.compressed.length, 0) +
    centralDirSize +
    endOfCentralDir.length;

  const result = new Uint8Array(totalSize);
  let pos = 0;

  // Write local headers and data
  for (let i = 0; i < entries.length; i++) {
    result.set(localHeaders[i], pos);
    pos += localHeaders[i].length;
    result.set(entries[i].compressed, pos);
    pos += entries[i].compressed.length;
  }

  // Write central directory
  for (const header of centralHeaders) {
    result.set(header, pos);
    pos += header.length;
  }

  // Write end of central directory
  result.set(endOfCentralDir, pos);

  return result;
}

async function compressDeflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new CompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  // @ts-ignore - Uint8Array type mismatch between ArrayBufferLike and ArrayBuffer
  writer.write(data);
  writer.close();

  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  reader.releaseLock();

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

function createLocalFileHeader(
  path: string,
  uncompressed: Uint8Array,
  compressed: Uint8Array,
): Uint8Array {
  const pathBytes = new TextEncoder().encode(path);
  const header = new Uint8Array(30 + pathBytes.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x04034b50, true); // Local file header signature
  view.setUint16(4, 20, true); // Version needed to extract (2.0)
  view.setUint16(6, 0, true); // General purpose bit flag
  view.setUint16(8, 8, true); // Compression method (8 = deflate)
  view.setUint16(10, 0, true); // File last modification time
  view.setUint16(12, 0, true); // File last modification date
  view.setUint32(14, crc32(uncompressed), true); // CRC-32
  view.setUint32(18, compressed.length, true); // Compressed size
  view.setUint32(22, uncompressed.length, true); // Uncompressed size
  view.setUint16(26, pathBytes.length, true); // File name length
  view.setUint16(28, 0, true); // Extra field length

  header.set(pathBytes, 30);

  return header;
}

function createCentralDirectoryHeader(
  path: string,
  uncompressed: Uint8Array,
  compressed: Uint8Array,
  offset: number,
): Uint8Array {
  const pathBytes = new TextEncoder().encode(path);
  const header = new Uint8Array(46 + pathBytes.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x02014b50, true); // Central directory file header signature
  view.setUint16(4, 20, true); // Version made by
  view.setUint16(6, 20, true); // Version needed to extract
  view.setUint16(8, 0, true); // General purpose bit flag
  view.setUint16(10, 8, true); // Compression method (8 = deflate)
  view.setUint16(12, 0, true); // File last modification time
  view.setUint16(14, 0, true); // File last modification date
  view.setUint32(16, crc32(uncompressed), true); // CRC-32
  view.setUint32(20, compressed.length, true); // Compressed size
  view.setUint32(24, uncompressed.length, true); // Uncompressed size
  view.setUint16(28, pathBytes.length, true); // File name length
  view.setUint16(30, 0, true); // Extra field length
  view.setUint16(32, 0, true); // File comment length
  view.setUint16(34, 0, true); // Disk number start
  view.setUint16(36, 0, true); // Internal file attributes
  view.setUint32(38, 0, true); // External file attributes
  view.setUint32(42, offset, true); // Relative offset of local header

  header.set(pathBytes, 46);

  return header;
}

function createEndOfCentralDirectory(
  numEntries: number,
  centralDirSize: number,
  centralDirOffset: number,
): Uint8Array {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x06054b50, true); // End of central directory signature
  view.setUint16(4, 0, true); // Number of this disk
  view.setUint16(6, 0, true); // Disk where central directory starts
  view.setUint16(8, numEntries, true); // Number of central directory records on this disk
  view.setUint16(10, numEntries, true); // Total number of central directory records
  view.setUint32(12, centralDirSize, true); // Size of central directory
  view.setUint32(16, centralDirOffset, true); // Offset of start of central directory
  view.setUint16(20, 0, true); // Comment length

  return header;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;

  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}
