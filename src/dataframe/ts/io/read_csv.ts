// CSV reading with Zod schema validation and type inference
import { z, ZodDefault, ZodNullable, ZodOptional, type ZodTypeAny } from "zod";
import { type CSVOptions, parseCSV } from "./csv-parser.ts";
import * as fs from "node:fs/promises";
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
│  1 · zcsv.* helpers (string/number/boolean/date/enum)                      │
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
  // Parse date as local date to avoid timezone issues
  const [year, month, day] = s.split("-").map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${s}`);
  }

  return date;
};

// public API ---------------------------------------------------------------------
export const zcsv = {
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
│  2 · CSV parsing helpers                                                   │
└───────────────────────────────────────────────────────────────────────────*/
export type CsvOptions = CSVOptions;

const parseLines = (csv: string, opts: CsvOptions | undefined) =>
  parseCSV(csv, opts);

const schemaHeaders = (shape: z.ZodRawShape) => Object.keys(shape);

/** Automatically wrap Zod types with zcsv coercion helpers */
// deno-lint-ignore no-explicit-any
function autoWrapSchema<T extends z.ZodObject<any>>(schema: T): T {
  const wrappedShape: z.ZodRawShape = {};

  Object.entries(schema.shape).forEach(([key, value]) => {
    const unwrapped = unwrap(value as ZodTypeAny);

    // Build the target schema with modifiers first
    let target: ZodTypeAny = unwrapped.base;
    if (unwrapped.optional) target = target.optional();
    if (unwrapped.nullable) target = target.nullable();
    if (unwrapped.hasDefault) {
      // deno-lint-ignore no-explicit-any
      target = target.default((unwrapped.base as any)._def.defaultValue());
    }

    // Then wrap with preprocessing based on base type
    let wrapped: ZodTypeAny = target;
    if (unwrapped.base instanceof z.ZodNumber) {
      wrapped = zcsv.number(target);
    } else if (unwrapped.base instanceof z.ZodBoolean) {
      wrapped = zcsv.boolean(target);
    } else if (unwrapped.base instanceof z.ZodDate) {
      wrapped = zcsv.date(target);
    } else if (unwrapped.base instanceof z.ZodEnum) {
      wrapped = zcsv.enum(target);
    } else if (unwrapped.base instanceof z.ZodString) {
      wrapped = zcsv.string(target);
    }

    // @ts-expect-error – runtime merging trick
    wrappedShape[key] = wrapped;
  });

  return z.object(wrappedShape) as T;
}

/*───────────────────────────────────────────────────────────────────────────┐
│  3 · validate whole CSV string                                             │
└───────────────────────────────────────────────────────────────────────────*/
// deno-lint-ignore no-explicit-any
export function parseCSVContent<S extends z.ZodObject<any>>(
  csv: string,
  schema: S,
  opts: CsvOptions & NAOpts = {},
): z.infer<S>[] {
  // Auto-wrap the schema with zcsv helpers if not already wrapped
  const wrappedSchema = autoWrapSchema(schema);

  const na = opts.naValues ?? DEFAULT_NA;
  const trim = opts.trim ?? true;

  const [headerRow, ...body] = parseLines(csv, opts);
  const headersFromCsv = headerRow.map((h) => h.trim());
  const headersFromSchema = schemaHeaders(wrappedSchema.shape);

  const missing = headersFromSchema.filter(
    (h) => !headersFromCsv.includes(h),
  );

  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(", ")}`);
  }

  const valid: z.infer<S>[] = [];

  body.forEach((cells, idx) => {
    const obj: Record<string, unknown> = {};
    headersFromSchema.forEach((h, col) => {
      obj[h] = cells[col] ?? "";
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
│  4 · single-row helper                                                     │
└───────────────────────────────────────────────────────────────────────────*/
// deno-lint-ignore no-explicit-any
export function parseRow<S extends z.ZodObject<any>>(
  row: string,
  schema: S,
  opts?: CsvOptions & NAOpts,
): z.infer<S> {
  const hdr = schemaHeaders(schema.shape).join(",");
  const rows = parseCSVContent(`${hdr}\n${row}`, schema, opts);
  return rows[0];
}

/*───────────────────────────────────────────────────────────────────────────┐
│  5 · file reading helper                                                   │
└───────────────────────────────────────────────────────────────────────────*/

/**
 * Detects if input is a file path or raw CSV content
 */
function isFilePath(input: string): boolean {
  // Check if it contains CSV-like content (headers with comma-separated values)
  const lines = input.trim().split("\n");
  if (lines.length >= 2) {
    const firstLine = lines[0];
    const secondLine = lines[1];
    // If both lines contain commas and look like CSV, treat as content
    if (firstLine.includes(",") && secondLine.includes(",")) {
      return false;
    }
  }

  // Check for file-like patterns (has extension, doesn't contain newlines, etc.)
  return !input.includes("\n") && (input.includes(".") || input.length < 100);
}

/**
 * Read a CSV file or parse CSV content with Zod schema validation and type inference
 *
 * @param pathOrContent - Either a file path to read from, or raw CSV content
 * @param schema - Zod schema for type validation and conversion
 * @param opts - Options for reading/parsing
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
 * // Read from file
 * const df1 = await readCSV("./data.csv", schema);
 *
 * // Parse from raw content
 * const csvContent = "id,name,email,age\\n1,Alice,alice@example.com,25\\n2,Bob,bob@example.com,30";
 * const df2 = await readCSV(csvContent, schema);
 *
 * // Both are typed as DataFrame<z.output<typeof schema>>
 * ```
 */
// V8 JavaScript engine maximum string length (~536 million characters)
// https://source.chromium.org/chromium/chromium/src/+/main:v8/src/objects/string.h
const MAX_V8_STRING_LENGTH = 0x1fffffe8; // 536,870,888 characters

// deno-lint-ignore no-explicit-any
export async function readCSV<S extends z.ZodObject<any>>(
  pathOrContent: string,
  schema: S,
  opts: CsvOptions & NAOpts = {},
): Promise<DataFrame<z.infer<S>>> {
  let rawCsv: string;

  if (isFilePath(pathOrContent)) {
    // It's a file path - check size before reading
    try {
      const stats = await fs.stat(pathOrContent);

      // If file size exceeds V8's maximum string length, automatically use streaming
      if (stats.size > MAX_V8_STRING_LENGTH) {
        // Dynamically import to avoid circular dependencies
        const { readCSVStream } = await import("./read_csv_stream.ts");
        return readCSVStream(pathOrContent, schema, opts);
      }

      rawCsv = await fs.readFile(pathOrContent, "utf8");
    } catch (error) {
      throw new Error(
        `Failed to read CSV file '${pathOrContent}': ${
          (error as Error).message
        }`,
      );
    }
  } else {
    // It's raw CSV content - use directly
    rawCsv = pathOrContent;
  }

  // Parse the CSV content with skipEmptyLines enabled by default to handle trailing newlines
  const csvOptions: CsvOptions & NAOpts = {
    skipEmptyLines: true,
    ...opts,
  };
  const rows = parseCSVContent(rawCsv, schema, csvOptions);

  return createDataFrame(rows, schema);
}

/*───────────────────────────────────────────────────────────────────────────┐
│  6 · Metadata inspection helper                                           │
└───────────────────────────────────────────────────────────────────────────*/

/**
 * Read metadata about a CSV file without full parsing
 *
 * Useful for inspecting file structure before deciding how to read it.
 * Shows column headers and a preview of the first few rows.
 *
 * @param pathOrContent - Either a file path to read from, or raw CSV content
 * @param previewRows - Number of rows to preview (default: 5)
 * @param opts - CSV parsing options (delimiter, quote character, etc.)
 * @returns Metadata object with headers and row preview
 *
 * @example
 * ```ts
 * const meta = await readCSVMetadata("./data.csv");
 * console.log("Columns:", meta.headers);
 * console.log("Preview:", meta.preview);
 *
 * // Then read with appropriate schema
 * const schema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   // ... based on headers from metadata
 * });
 * const df = await readCSV("./data.csv", schema);
 * ```
 */
export async function readCSVMetadata(
  pathOrContent: string,
  { previewRows = 5, ...csvOpts }: CsvOptions & { previewRows?: number } = {},
) {
  let rawCsv: string;

  if (isFilePath(pathOrContent)) {
    try {
      const stats = await fs.stat(pathOrContent);

      // For very large files, only read enough to get preview
      if (stats.size > MAX_V8_STRING_LENGTH) {
        // Read first chunk only for metadata
        const file = await fs.open(pathOrContent, "r");
        const buffer = new Uint8Array(Math.min(100000, stats.size)); // Read up to 100KB
        await file.read(buffer, 0, buffer.length, 0);
        await file.close();
        rawCsv = new TextDecoder().decode(buffer);
      } else {
        rawCsv = await fs.readFile(pathOrContent, "utf8");
      }
    } catch (error) {
      throw new Error(
        `Failed to read CSV file '${pathOrContent}': ${
          (error as Error).message
        }`,
      );
    }
  } else {
    rawCsv = pathOrContent;
  }

  // Parse with skipEmptyLines enabled
  const csvOptions: CsvOptions = {
    skipEmptyLines: true,
    ...csvOpts,
  };
  const allRows = parseLines(rawCsv, csvOptions);

  if (allRows.length === 0) {
    throw new Error("CSV file is empty or has no valid rows");
  }

  const [headerRow, ...dataRows] = allRows;
  const headers = headerRow.map((h) => h.trim());
  const previewData = dataRows.slice(0, previewRows);

  return {
    headers,
    totalRows: dataRows.length,
    firstRows: previewData,
    delimiter: csvOpts.comma || ",",
  };
}
