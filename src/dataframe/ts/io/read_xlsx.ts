// XLSX reading with Zod schema validation and type inference
import { z, ZodDefault, ZodNullable, ZodOptional, type ZodTypeAny } from "zod";
import { createDataFrame, type DataFrame } from "../dataframe/index.ts";
import type { NAOpts } from "./types.ts";
// Polyfill CompressionStream/DecompressionStream for environments without native support
import "./compression-polyfill.ts";

/*───────────────────────────────────────────────────────────────────────────┐
│  0 · shared utils                                                          │
└───────────────────────────────────────────────────────────────────────────*/
const DEFAULT_NA = ["", "NA", "NaN", "null", "undefined"] as const;

/**
 * Safely read a file or convert ArrayBuffer/File/Blob to Uint8Array
 * Supports file paths (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers)
 * This prevents "Deno is not defined" errors when the module is imported
 * in non-Deno environments (e.g., during bundling or static analysis)
 */
async function readFileSafe(
  pathOrBuffer: string | ArrayBuffer | File | Blob,
): Promise<Uint8Array> {
  // Handle ArrayBuffer, File, or Blob (browser-compatible)
  if (pathOrBuffer instanceof ArrayBuffer) {
    return new Uint8Array(pathOrBuffer);
  }

  if (pathOrBuffer instanceof File || pathOrBuffer instanceof Blob) {
    const arrayBuffer = await pathOrBuffer.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  // Handle file path (string) - requires Node.js or Deno
  if (typeof pathOrBuffer === "string") {
    // Check for Deno first
    if (typeof Deno !== "undefined" && Deno.readFile) {
      return await Deno.readFile(pathOrBuffer);
    }

    // Fallback to Node.js fs
    // deno-lint-ignore no-process-global
    if (typeof process !== "undefined" && process?.versions?.node) {
      // Dynamic import to avoid issues in Deno
      const fs = await import("node:fs/promises");
      const buffer = await fs.readFile(pathOrBuffer);
      return new Uint8Array(buffer);
    }

    throw new Error(
      "readXLSX with file path requires Deno or Node.js environment. Use ArrayBuffer, File, or Blob in browsers.",
    );
  }

  throw new Error(
    "readXLSX requires a file path (string), ArrayBuffer, File, or Blob.",
  );
}

/** Recursively unwrap .optional() / .nullable() / .default() wrappers */
const unwrap = (t: ZodTypeAny): {
  base: ZodTypeAny;
  optional: boolean;
  nullable: boolean;
  hasDefault: boolean;
} => {
  let base: ZodTypeAny = t;
  let optional = false;
  let nullable = false;
  let hasDefault = false;

  if (base instanceof ZodOptional) {
    optional = true;
    // deno-lint-ignore no-explicit-any
    base = (base as any)._def.innerType;
  }
  if (base instanceof ZodNullable) {
    nullable = true;
    // deno-lint-ignore no-explicit-any
    base = (base as any)._def.innerType;
  }
  if (base instanceof ZodDefault) {
    hasDefault = true;
    // deno-lint-ignore no-explicit-any
    base = (base as any)._def.innerType;
  }
  return { base, optional, nullable, hasDefault };
};

/*───────────────────────────────────────────────────────────────────────────┐
│  1 · zxlsx.* helpers (string/number/boolean/date/enum)                     │
└───────────────────────────────────────────────────────────────────────────*/
type InputLike<T extends ZodTypeAny> =
  | (() => T) // no schema supplied
  | (<U extends ZodTypeAny>(sch: U) => U);

function make<
  T extends ZodTypeAny,
  Coerce extends (raw: string) => unknown,
>(coerce: Coerce): InputLike<T> {
  return (schema: T = undefined as unknown as T) =>
    z.preprocess((val) => {
      // pass through non-strings (already coerced by previous preprocessors)
      if (typeof val !== "string") return val;
      if (val === "") return undefined;

      try {
        const result = coerce(val);
        // Handle NaN from number coercion
        if (typeof result === "number" && isNaN(result)) {
          // Check if the schema is nullable
          if (schema && schema instanceof ZodNullable) {
            return null;
          }
          return undefined;
        }
        return result;
      } catch (_error) {
        // Handle coercion errors (e.g., invalid dates)
        if (schema && schema instanceof ZodNullable) {
          return null;
        }
        return undefined;
      }
      // deno-lint-ignore no-explicit-any
    }, schema ?? (z.any() as unknown as T)) as any;
}

// basic coercers -----------------------------------------------------------------
const toNumber = (s: string): number => Number(s);
const toBoolean = (s: string): boolean =>
  ["true", "1"].includes(s.toLowerCase());
const toDate = (s: string): Date => {
  const num = Number(s);

  // Check if it's a numeric value (Excel serial number)
  // Excel stores dates as days since 1899-12-30, with fractional part for time
  // Note: negative numbers represent dates before the Excel epoch
  if (!isNaN(num)) {
    // Use local epoch to match write_xlsx.ts dateToExcelSerial
    // Then normalize to local midnight to avoid timezone shifts
    const excelEpoch = new Date(1899, 11, 30); // December 30, 1899 local
    const milliseconds = num * 86400000; // Convert days to milliseconds
    const date = new Date(excelEpoch.getTime() + milliseconds);

    // Normalize to local midnight to represent a calendar date (not timestamp)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  // Try ISO date format (YYYY-MM-DD)
  if (s.includes("-")) {
    const [year, month, day] = s.split("-").map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed

    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  throw new Error(`Invalid date: ${s}`);
};

// internal API (not exported) ----------------------------------------------------
// Special string handler that doesn't convert "" to undefined
function makeString(): InputLike<z.ZodString> {
  return (schema: z.ZodString = undefined as unknown as z.ZodString) =>
    z.preprocess((val) => {
      // pass through non-strings
      if (typeof val !== "string") return val;
      // For strings, keep empty strings as empty strings (don't convert to undefined)
      return val;
      // deno-lint-ignore no-explicit-any
    }, schema ?? (z.any() as unknown as z.ZodString)) as any;
}

const zxlsx = {
  string: makeString(),
  number: make<z.ZodNumber, (s: string) => number>((s) => toNumber(s)),
  boolean: make<z.ZodBoolean, (s: string) => boolean>((s) => toBoolean(s)),
  date: make<z.ZodDate, (s: string) => Date>((s) => toDate(s)),
  enum:
    // @ts-expect-error – runtime merging trick
    (<Vals extends [string, ...string[]]>(e: z.ZodEnum<Vals>) =>
      // deno-lint-ignore no-explicit-any
      make<typeof e, (s: string) => string>((s) => s)(e)) as any,
};

/*───────────────────────────────────────────────────────────────────────────┐
│  2 · Low-level XLSX parsing (zero dependencies)                           │
└───────────────────────────────────────────────────────────────────────────*/

/**
 * Parse XLSX file and return rows as arrays of values (low-level API)
 *
 * @param pathOrBuffer - File path (Node.js/Deno) or ArrayBuffer/File/Blob (all environments)
 * @param opts - Options including sheet selection
 * @returns Array of rows, where each row is an array of string values
 */
export async function parseXLSXRaw(
  pathOrBuffer: string | ArrayBuffer | File | Blob,
  opts: { sheet?: string | number; skip?: number } = {},
): Promise<string[][]> {
  const fileData = await readFileSafe(pathOrBuffer);

  // Get sheet mapping from workbook.xml
  const workbookXml = await extractFile(fileData, "xl/workbook.xml");
  if (!workbookXml) {
    throw new Error("No workbook.xml found in XLSX file");
  }

  const sheetMap = parseWorkbookSheets(workbookXml);
  if (sheetMap.length === 0) {
    throw new Error("No sheets found in XLSX file");
  }

  // Determine which sheet to read
  let sheetPath: string;
  if (opts.sheet === undefined) {
    // Default to first sheet
    sheetPath = sheetMap[0].path;
  } else if (typeof opts.sheet === "number") {
    // Sheet by index (0-based)
    if (opts.sheet < 0 || opts.sheet >= sheetMap.length) {
      throw new Error(
        `Sheet index ${opts.sheet} out of range. Available sheets: 0-${
          sheetMap.length - 1
        }`,
      );
    }
    sheetPath = sheetMap[opts.sheet].path;
  } else {
    // Sheet by name
    const found = sheetMap.find((s) => s.name === opts.sheet);
    if (!found) {
      const available = sheetMap.map((s) => s.name).join(", ");
      throw new Error(
        `Sheet "${opts.sheet}" not found. Available sheets: ${available}`,
      );
    }
    sheetPath = found.path;
  }

  // Extract shared strings and worksheet from the ZIP
  const sharedStrings = await extractFile(fileData, "xl/sharedStrings.xml");
  const worksheet = await extractFile(fileData, sheetPath);

  if (!worksheet) {
    throw new Error(`Worksheet not found: ${sheetPath}`);
  }

  const strings = sharedStrings ? parseSharedStrings(sharedStrings) : [];
  const allRows = parseWorksheet(worksheet, strings);

  // Apply skip if specified
  const skip = opts.skip ?? 0;
  if (skip > 0) {
    return allRows.slice(skip);
  }

  return allRows;
}

/**
 * Decompress deflate-compressed data using DecompressionStream (polyfilled if needed)
 */
async function decompressDeflate(
  compData: Uint8Array,
  uncompSize: number,
): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error(
      "DecompressionStream is not available. This requires a modern browser, Node.js 18+, Deno, or Bun (with zlib polyfill).",
    );
  }

  const decompressed = new Uint8Array(uncompSize);
  const stream = new DecompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  // @ts-ignore - Uint8Array type mismatch
  writer.write(compData);
  writer.close();

  const reader = stream.readable.getReader();
  let position = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    decompressed.set(value, position);
    position += value.length;
  }

  return decompressed;
}

async function extractFile(
  zipData: Uint8Array,
  filename: string,
): Promise<string | null> {
  // Find the central directory end record
  const view = new DataView(
    zipData.buffer,
    zipData.byteOffset,
    zipData.byteLength,
  );
  let cdOffset = -1;

  // Scan from end for central directory signature
  for (let i = zipData.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      cdOffset = view.getUint32(i + 16, true);
      break;
    }
  }

  if (cdOffset === -1) return null;

  // Parse central directory to find our file
  let offset = cdOffset;
  while (offset < zipData.length - 4) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x02014b50) break; // Central directory file header signature

    const filenameLen = view.getUint16(offset + 28, true);
    const extraLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);

    const nameBytes = zipData.slice(offset + 46, offset + 46 + filenameLen);
    const name = new TextDecoder().decode(nameBytes);

    if (name === filename) {
      // Found it! Now read the local file header
      const localSig = view.getUint32(localHeaderOffset, true);
      if (localSig !== 0x04034b50) return null; // Local file header signature

      const compMethod = view.getUint16(localHeaderOffset + 8, true);
      const compSize = view.getUint32(localHeaderOffset + 18, true);
      const uncompSize = view.getUint32(localHeaderOffset + 22, true);
      const localFilenameLen = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true);

      const dataOffset = localHeaderOffset + 30 + localFilenameLen +
        localExtraLen;
      const compData = zipData.slice(dataOffset, dataOffset + compSize);

      if (compMethod === 0) {
        // Stored (no compression)
        return new TextDecoder().decode(compData);
      } else if (compMethod === 8) {
        // Deflate compression
        const decompressed = await decompressDeflate(compData, uncompSize);
        return new TextDecoder().decode(decompressed);
      }
    }

    offset += 46 + filenameLen + extraLen + commentLen;
  }

  return null;
}

interface SheetInfo {
  name: string;
  path: string;
}

function parseWorkbookSheets(workbookXml: string): SheetInfo[] {
  const sheets: SheetInfo[] = [];
  const sheetRegex = /<sheet[^>]*name="([^"]*)"[^>]*r:id="([^"]*)"[^>]*\/>/g;
  let match;

  while ((match = sheetRegex.exec(workbookXml)) !== null) {
    const name = unescapeXml(match[1]); // Unescape XML entities
    const rId = match[2];

    // Map relationship ID to sheet number
    // rId1 -> sheet1.xml, rId2 -> sheet2.xml, etc.
    const sheetNum = rId.replace("rId", "");
    const path = `xl/worksheets/sheet${sheetNum}.xml`;

    sheets.push({ name, path });
  }

  return sheets;
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  // Use 's' flag to match newlines with .
  const regex = /<t[^>]*>(.*?)<\/t>/gs;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    strings.push(unescapeXml(match[1]));
  }

  return strings;
}

function unescapeXml(str: string): string {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function parseWorksheet(xml: string, sharedStrings: string[]): string[][] {
  const rows: string[][] = [];
  const rowRegex = /<row[^>]*>(.*?)<\/row>/g;
  let rowMatch;
  let maxCols = 0;

  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const rowXml = rowMatch[1];
    const cellMap = new Map<number, string>();
    const cellRegex = /<c\s+([^>]+)>(?:<v>([^<]*)<\/v>)?<\/c>/g;
    let cellMatch;
    let maxCol = 0;

    while ((cellMatch = cellRegex.exec(rowXml)) !== null) {
      const attrs = cellMatch[1];
      const value = cellMatch[2] || "";

      // Extract cell reference (e.g., "A1", "B2") from attrs
      const refMatch = attrs.match(/r="([A-Z]+)(\d+)"/);
      if (!refMatch) continue;

      const colLetters = refMatch[1];
      const colIndex = columnLettersToIndex(colLetters);
      maxCol = Math.max(maxCol, colIndex);

      // Extract type attribute from attrs
      const typeMatch = attrs.match(/t="([^"]*)"/);
      const type = typeMatch ? typeMatch[1] : null;

      if (type === "s") {
        const index = parseInt(value, 10);
        cellMap.set(colIndex, sharedStrings[index] || "");
      } else {
        cellMap.set(colIndex, value);
      }
    }

    // Build the row array with empty strings for missing cells
    const cells: string[] = [];
    for (let i = 0; i <= maxCol; i++) {
      cells.push(cellMap.get(i) || "");
    }

    maxCols = Math.max(maxCols, cells.length);
    rows.push(cells);
  }

  // Ensure all rows have the same number of columns
  rows.forEach((row) => {
    while (row.length < maxCols) {
      row.push("");
    }
  });

  return rows;
}

// Convert column letters (A, B, ..., Z, AA, AB, ...) to 0-based index
function columnLettersToIndex(letters: string): number {
  let index = 0;
  for (let i = 0; i < letters.length; i++) {
    index = index * 26 + (letters.charCodeAt(i) - 64);
  }
  return index - 1; // Convert to 0-based
}

/*───────────────────────────────────────────────────────────────────────────┐
│  3 · Schema wrapping and validation helpers                               │
└───────────────────────────────────────────────────────────────────────────*/

const schemaHeaders = (shape: z.ZodRawShape) => Object.keys(shape);

/** Automatically wrap Zod types with zxlsx coercion helpers */
// deno-lint-ignore no-explicit-any
function autoWrapSchema<T extends z.ZodObject<any>>(schema: T): T {
  const wrappedShape: z.ZodRawShape = {};

  Object.entries(schema.shape).forEach(([key, value]) => {
    const unwrapped = unwrap(value as ZodTypeAny);
    let wrapped: ZodTypeAny = unwrapped.base;

    // Determine the appropriate zxlsx wrapper based on the base type
    if (unwrapped.base instanceof z.ZodNumber) {
      wrapped = zxlsx.number(unwrapped.base);
    } else if (unwrapped.base instanceof z.ZodBoolean) {
      wrapped = zxlsx.boolean(unwrapped.base);
    } else if (unwrapped.base instanceof z.ZodDate) {
      wrapped = zxlsx.date(unwrapped.base);
    } else if (unwrapped.base instanceof z.ZodEnum) {
      wrapped = zxlsx.enum(unwrapped.base);
    } else if (unwrapped.base instanceof z.ZodString) {
      wrapped = zxlsx.string(unwrapped.base);
    }

    // Re-apply modifiers (optional, nullable, etc.)
    if (unwrapped.optional) wrapped = wrapped.optional();
    if (unwrapped.nullable) wrapped = wrapped.nullable();
    if (unwrapped.hasDefault) {
      // deno-lint-ignore no-explicit-any
      wrapped = wrapped.default((unwrapped.base as any)._def.defaultValue());
    }

    // @ts-expect-error – runtime merging trick
    wrappedShape[key] = wrapped;
  });

  return z.object(wrappedShape) as T;
}

/*───────────────────────────────────────────────────────────────────────────┐
│  4 · Parse XLSX content with schema validation                            │
└───────────────────────────────────────────────────────────────────────────*/

// deno-lint-ignore no-explicit-any
export function parseXLSXContent<S extends z.ZodObject<any>>(
  rows: string[][],
  schema: S,
  opts: NAOpts = {},
): z.infer<S>[] {
  // Auto-wrap the schema with zxlsx helpers if not already wrapped
  const wrappedSchema = autoWrapSchema(schema);

  const na = opts.naValues ?? DEFAULT_NA;
  const trim = opts.trim ?? true;

  const [headerRow, ...body] = rows;
  const headersFromXlsx = headerRow.map((h) => h.trim());
  const headersFromSchema = schemaHeaders(wrappedSchema.shape);

  const missing = headersFromSchema.filter(
    (h) => !headersFromXlsx.includes(h),
  );

  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(", ")}`);
  }

  const valid: z.infer<S>[] = [];

  body.forEach((cells, idx) => {
    const obj: Record<string, unknown> = {};
    headersFromSchema.forEach((h, _) => {
      const colIndex = headersFromXlsx.indexOf(h);
      obj[h] = cells[colIndex] ?? "";
    });

    // Apply NA handling before schema validation
    const naProcessed = Object.fromEntries(
      Object.entries(obj).map(([k, v]) => {
        const originalField = schema.shape[k];
        const { optional, nullable, base } = unwrap(originalField);

        // Handle empty string cells
        if (v === "") {
          // For string fields, check if it's nullable/optional
          if (base instanceof z.ZodString) {
            // If nullable or optional, treat empty as null/undefined
            // Otherwise, treat as actual empty string
            if (optional || nullable) {
              return [k, optional ? undefined : null] as const;
            }
            return [k, v] as const;
          }
          // For other types (number, boolean, date), empty means null/undefined
          return [k, optional ? undefined : nullable ? null : v] as const;
        }

        // Check if this is an NA value (NA, null, etc.)
        if (typeof v === "string" && na.includes(trim ? v.trim() : v)) {
          return [k, optional ? undefined : nullable ? null : v] as const;
        }

        return [k, v] as const;
      }),
    );

    const parsed = wrappedSchema.safeParse(naProcessed);
    if (parsed.success) {
      valid.push(parsed.data as z.infer<S>);
    } else {
      throw new Error(
        `Row ${idx + 1} validation failed: ${parsed.error.message}`,
      );
    }
  });

  return valid;
}

/*───────────────────────────────────────────────────────────────────────────┐
│  5 · High-level API: readXLSX with schema validation                      │
└───────────────────────────────────────────────────────────────────────────*/

interface ReadXLSXOpts extends NAOpts {
  sheet?: string | number;
  skip?: number;
}

/**
 * Read an XLSX file with Zod schema validation and type inference
 *
 * @param pathOrBuffer - File path (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers)
 * @param schema - Zod schema for type validation and conversion
 * @param opts - Options for parsing (NA values, trim, sheet selection)
 * @returns A properly typed DataFrame based on the Zod schema
 *
 * @example
 * ```ts
 * import { z } from "zod";
 *
 * const schema = z.object({
 *   id: z.number().int(),
 *   name: z.string().min(1),
 *   email: z.string().email(),
 *   age: z.number().optional(),
 * });
 *
 * // Read from file path (Node.js/Deno)
 * const df = await readXLSX("./data.xlsx", schema);
 *
 * // Read from ArrayBuffer (browser-compatible)
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 * const arrayBuffer = await file.arrayBuffer();
 * const df2 = await readXLSX(arrayBuffer, schema);
 *
 * // Read from File object (browser-compatible)
 * const df3 = await readXLSX(file, schema, { sheet: "Sheet2" });
 *
 * // Read from specific sheet by index (0-based)
 * const df4 = await readXLSX("./data.xlsx", schema, { sheet: 1 });
 * ```
 */
// Overload: with no_types: true, schema optional, returns DataFrame<any>
export async function readXLSX(
  pathOrBuffer: string | ArrayBuffer | File | Blob,
  opts: ReadXLSXOpts & { no_types: true },
  // deno-lint-ignore no-explicit-any
): Promise<DataFrame<any>>;

// Overload: with no_types: true and schema, returns DataFrame<any>
// deno-lint-ignore no-explicit-any
export async function readXLSX<S extends z.ZodObject<any>>(
  pathOrBuffer: string | ArrayBuffer | File | Blob,
  schema: S,
  opts: ReadXLSXOpts & { no_types: true },
  // deno-lint-ignore no-explicit-any
): Promise<DataFrame<any>>;

// Overload: default returns typed DataFrame
// deno-lint-ignore no-explicit-any
export async function readXLSX<S extends z.ZodObject<any>>(
  pathOrBuffer: string | ArrayBuffer | File | Blob,
  schema: S,
  opts?: ReadXLSXOpts,
): Promise<DataFrame<z.infer<S>>>;

// Implementation
// deno-lint-ignore no-explicit-any
export async function readXLSX<S extends z.ZodObject<any>>(
  pathOrBuffer: string | ArrayBuffer | File | Blob,
  schemaOrOpts?: S | ReadXLSXOpts,
  opts?: ReadXLSXOpts,
  // deno-lint-ignore no-explicit-any
): Promise<DataFrame<z.infer<S>> | DataFrame<any>> {
  // Determine if second param is schema or options
  const isSchema = schemaOrOpts &&
    typeof schemaOrOpts === "object" &&
    !("no_types" in schemaOrOpts) &&
    !("naValues" in schemaOrOpts) &&
    !("trim" in schemaOrOpts) &&
    !("sheet" in schemaOrOpts) &&
    !("skip" in schemaOrOpts) &&
    schemaOrOpts instanceof z.ZodObject;

  const schema = isSchema ? schemaOrOpts as S : undefined;
  const actualOpts = isSchema
    ? (opts || {})
    : ((schemaOrOpts as ReadXLSXOpts) || {});
  const noTypes = actualOpts.no_types === true;

  const rawRows = await parseXLSXRaw(pathOrBuffer, {
    sheet: actualOpts.sheet,
    skip: actualOpts.skip,
  });

  // If no schema provided but no_types is true, parse without validation
  if (!schema && noTypes) {
    if (rawRows.length === 0) {
      return createDataFrame([], { no_types: true });
    }

    const headers = rawRows[0].map((h) => String(h).trim());
    const rows: Record<string, unknown>[] = [];

    for (let i = 1; i < rawRows.length; i++) {
      const row: Record<string, unknown> = {};
      for (let j = 0; j < headers.length; j++) {
        const cellValue = rawRows[i][j];
        // Try to infer types from XLSX values (numbers, booleans, dates)
        if (cellValue === "" || cellValue === undefined || cellValue === null) {
          row[headers[j]] = "";
        } else {
          const trimmed = String(cellValue).trim();
          const lowerHeader = headers[j].toLowerCase();
          // Check for boolean column names
          const isLikelyBoolean = lowerHeader.includes("active") ||
            lowerHeader.includes("enabled") ||
            lowerHeader.includes("flag") ||
            lowerHeader.includes("is_") ||
            lowerHeader.startsWith("is");

          if (trimmed === "TRUE" || trimmed === "true") {
            row[headers[j]] = true;
          } else if (trimmed === "FALSE" || trimmed === "false") {
            row[headers[j]] = false;
          } else if (isLikelyBoolean && (trimmed === "1" || trimmed === "0")) {
            // For likely boolean columns, treat 1/0 as booleans
            row[headers[j]] = trimmed === "1";
          } else {
            // Try to parse as number
            const num = Number(trimmed);
            if (!isNaN(num) && isFinite(num) && trimmed !== "") {
              row[headers[j]] = num;
            } else {
              row[headers[j]] = cellValue;
            }
          }
        }
      }
      rows.push(row);
    }

    return createDataFrame(rows, { no_types: true });
  }

  if (!schema) {
    throw new Error("Schema is required when no_types is not set");
  }

  const rows = parseXLSXContent(rawRows, schema, actualOpts);

  // Special case: if rows is empty but we have headers in the XLSX,
  // we need to create a DataFrame with the correct columns
  if (rows.length === 0 && rawRows.length > 0) {
    // We have headers but no data rows
    // Create a single dummy row with the schema structure, then filter it out
    const dummyRow: Record<string, unknown> = {};
    const wrappedSchema = autoWrapSchema(schema);
    const headersFromSchema = schemaHeaders(wrappedSchema.shape);

    // Create a dummy object with all schema columns set to appropriate defaults
    for (const header of headersFromSchema) {
      const field = schema.shape[header];
      const { optional, nullable, base } = unwrap(field);

      // Use appropriate dummy value based on type
      if (optional) {
        dummyRow[header] = undefined;
      } else if (nullable) {
        dummyRow[header] = null;
      } else if (base instanceof z.ZodNumber) {
        dummyRow[header] = 0;
      } else if (base instanceof z.ZodBoolean) {
        dummyRow[header] = false;
      } else if (base instanceof z.ZodDate) {
        dummyRow[header] = new Date();
      } else {
        dummyRow[header] = "";
      }
    }

    // Create DataFrame with dummy row, then filter to empty
    if (noTypes) {
      // @ts-ignore - filter returns correct type but TypeScript can't infer it
      return createDataFrame([dummyRow as z.infer<S>], {
        schema,
        no_types: true,
      }).filter(() => false);
    }
    // @ts-ignore - filter returns correct type but TypeScript can't infer it
    return createDataFrame([dummyRow as z.infer<S>], schema).filter(() =>
      false
    );
  }

  if (noTypes) {
    return createDataFrame(rows, { schema, no_types: true });
  }
  return createDataFrame(rows, schema);
}

/*───────────────────────────────────────────────────────────────────────────┐
│  6 · Metadata inspection helper                                           │
└───────────────────────────────────────────────────────────────────────────*/

/**
 * Read metadata about an XLSX file without full parsing
 *
 * Useful for inspecting file structure before deciding how to read it.
 * Shows available sheets and a preview of the first few rows.
 *
 * @param pathOrBuffer - File path (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers)
 * @param previewRows - Number of rows to preview (default: 5)
 * @param sheet - Which sheet to preview (default: first sheet)
 * @returns Metadata object with sheets list and row preview
 *
 * @example
 * ```ts
 * const meta = await readXLSXMetadata("./data.xlsx");
 * console.log("Available sheets:", meta.sheets);
 * console.log("First rows:", meta.preview.firstRows);
 *
 * // If row 0 looks like a note, use skip: 1
 * const df = await readXLSX("./data.xlsx", schema, { skip: 1 });
 * ```
 */
export async function readXLSXMetadata(
  pathOrBuffer: string | ArrayBuffer | File | Blob,
  { previewRows = 5, sheet }: {
    previewRows?: number;
    sheet?: string | number;
  } = {},
) {
  const fileData = await readFileSafe(pathOrBuffer);

  // Get sheet mapping
  const workbookXml = await extractFile(fileData, "xl/workbook.xml");
  if (!workbookXml) {
    throw new Error("No workbook.xml found in XLSX file");
  }

  const sheetMap = parseWorkbookSheets(workbookXml);
  if (sheetMap.length === 0) {
    throw new Error("No sheets found in XLSX file");
  }

  const sheets = sheetMap.map((s, i) => ({ name: s.name, index: i }));
  const defaultSheet = sheetMap[0].name;

  // Get preview of specified sheet (or first sheet)
  const targetSheet = sheet ?? 0;
  const rawRows = await parseXLSXRaw(pathOrBuffer, { sheet: targetSheet });
  const previewData = rawRows.slice(0, previewRows);

  const sheetName = typeof targetSheet === "number"
    ? sheetMap[targetSheet].name
    : targetSheet;

  // Extract headers from first row
  const headers = rawRows.length > 0 ? rawRows[0] : [];
  const dataRows = rawRows.slice(1);

  return {
    sheets,
    defaultSheet,
    sheetName,
    headers,
    totalRows: dataRows.length,
    firstRows: previewData,
  };
}
