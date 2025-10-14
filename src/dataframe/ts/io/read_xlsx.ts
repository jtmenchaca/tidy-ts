// XLSX reading with Zod schema validation and type inference
import { z, ZodDefault, ZodNullable, ZodOptional, type ZodTypeAny } from "zod";
import { createDataFrame, type DataFrame } from "../dataframe/index.ts";
import type { NAOpts } from "./types.ts";

/*───────────────────────────────────────────────────────────────────────────┐
│  0 · shared utils                                                          │
└───────────────────────────────────────────────────────────────────────────*/
const DEFAULT_NA = ["", "NA", "NaN", "null", "undefined"] as const;

const isNA = (s: unknown, na: readonly string[], trim: boolean): boolean =>
  typeof s === "string" && na.includes(trim ? s.trim() : s);

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

  // Auto-detect Excel serial number (dates are typically > 100)
  // Excel stores dates as days since 1899-12-30, with fractional part for time
  if (!isNaN(num) && num > 100) {
    const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
    const days = Math.floor(num);
    const timeFraction = num - days;
    const milliseconds = timeFraction * 86400000; // 24 * 60 * 60 * 1000

    return new Date(excelEpoch.getTime() + (days * 86400000) + milliseconds);
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
const zxlsx = {
  string: make<z.ZodString, (s: string) => string>((s) => s),
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
 * @param path - File path to the XLSX file
 * @param opts - Options including sheet selection
 * @returns Array of rows, where each row is an array of string values
 */
export async function parseXLSXRaw(
  path: string,
  opts: { sheet?: string | number } = {},
): Promise<string[][]> {
  const fileData = await Deno.readFile(path);

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
  return parseWorksheet(worksheet, strings);
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
        const decompressed = new Uint8Array(uncompSize);
        const stream = new DecompressionStream("deflate-raw");
        const writer = stream.writable.getWriter();
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
    const name = match[1];
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
  const regex = /<t[^>]*>(.*?)<\/t>/g;
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
        if (isNA(v, na, trim)) {
          // Check if the field is nullable or optional in the original schema
          const originalField = schema.shape[k];
          const { optional, nullable } = unwrap(originalField);
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
}

/**
 * Read an XLSX file with Zod schema validation and type inference
 *
 * @param path - File path to the XLSX file
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
 * // Read from first sheet (default)
 * const df = await readXLSX("./data.xlsx", schema);
 *
 * // Read from specific sheet by name
 * const df2 = await readXLSX("./data.xlsx", schema, { sheet: "Sheet2" });
 *
 * // Read from specific sheet by index (0-based)
 * const df3 = await readXLSX("./data.xlsx", schema, { sheet: 1 });
 * ```
 */
// deno-lint-ignore no-explicit-any
export async function readXLSX<S extends z.ZodObject<any>>(
  path: string,
  schema: S,
  opts: ReadXLSXOpts = {},
): Promise<DataFrame<z.infer<S>>> {
  const rawRows = await parseXLSXRaw(path, { sheet: opts.sheet });
  const rows = parseXLSXContent(rawRows, schema, opts);

  // Special case: if rows is empty but we have headers in the XLSX,
  // we need to create a DataFrame with the correct columns
  if (rows.length === 0 && rawRows.length > 0) {
    // We have headers but no data rows
    // Create a single dummy row with the schema structure, then filter it out
    const dummyRow: Record<string, unknown> = {};
    // const headersFromXlsx = rawRows[0].map((h) => h.trim());
    const wrappedSchema = autoWrapSchema(schema);
    const headersFromSchema = schemaHeaders(wrappedSchema.shape);

    // Create a dummy object with all schema columns set to undefined/null
    for (const header of headersFromSchema) {
      const field = schema.shape[header];
      const { optional, nullable } = unwrap(field);
      dummyRow[header] = optional ? undefined : nullable ? null : "";
    }

    // Create DataFrame with dummy row, then filter to empty
    // @ts-ignore - filter returns correct type but TypeScript can't infer it
    return createDataFrame([dummyRow as z.infer<S>], schema).filter(() =>
      false
    );
  }

  return createDataFrame(rows, schema);
}
