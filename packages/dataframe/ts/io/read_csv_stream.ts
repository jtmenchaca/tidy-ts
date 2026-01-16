// Streaming CSV reader for large files that exceed V8's string length limit
import { z, type ZodTypeAny } from "zod";
import * as fs from "node:fs";
import * as readline from "node:readline";
import { stat } from "@tidy-ts/shims";
import type { CSVOptions } from "./csv-parser.ts";
import { createDataFrame, type DataFrame } from "../dataframe/index.ts";
import type { NAOpts } from "./types.ts";

const DEFAULT_NA = ["", "NA", "NaN", "null", "undefined"] as const;

// Memory estimation constants
const BYTES_PER_JS_OBJECT = 32; // Base object overhead
const BYTES_PER_PROPERTY = 8; // Property slot overhead
const BYTES_PER_NUMBER = 8; // 64-bit float or SMI
const BYTES_PER_STRING_CHAR = 2; // UTF-16 encoding
const STRING_OVERHEAD = 24; // String object overhead
const ARRAY_OVERHEAD_PER_ELEMENT = 8; // Array element pointer

const isNA = (s: unknown, na: readonly string[], trim: boolean): boolean =>
  typeof s === "string" && na.includes(trim ? s.trim() : s);

/**
 * Estimate memory usage per row based on schema
 * Returns conservative (higher) estimate in bytes to avoid underestimating
 */
// deno-lint-ignore no-explicit-any
function estimateBytesPerRow<S extends z.ZodObject<any>>(schema: S): number {
  let bytesPerRow = BYTES_PER_JS_OBJECT; // Base object
  let propertyCount = 0;

  Object.entries(schema.shape).forEach(([_key, value]) => {
    const unwrapped = unwrap(value as ZodTypeAny);
    propertyCount++;

    // Estimate based on type - use conservative (larger) estimates
    let fieldBytes = 0;
    if (unwrapped.base instanceof z.ZodNumber) {
      fieldBytes = BYTES_PER_NUMBER;
    } else if (unwrapped.base instanceof z.ZodString) {
      // Conservative: assume average string of 20 characters
      fieldBytes = STRING_OVERHEAD + (20 * BYTES_PER_STRING_CHAR);
    } else if (unwrapped.base instanceof z.ZodBoolean) {
      fieldBytes = 4;
    } else if (unwrapped.base instanceof z.ZodDate) {
      fieldBytes = 16;
    } else {
      fieldBytes = 16; // Conservative default
    }

    // If optional, assume 50% are populated (more conservative than 30%)
    if (unwrapped.optional) {
      fieldBytes *= 0.5;
    }

    bytesPerRow += fieldBytes;
  });

  // Add property overhead
  bytesPerRow += propertyCount * BYTES_PER_PROPERTY;

  // Add array element overhead
  bytesPerRow += ARRAY_OVERHEAD_PER_ELEMENT;

  // Add 50% overhead for V8 internals, garbage collection headroom, etc.
  bytesPerRow *= 1.5;

  return Math.ceil(bytesPerRow);
}

/**
 * Estimate total memory for DataFrame from file stats
 */
function _estimateDataFrameMemory(
  fileSizeBytes: number,
  schema: z.ZodObject<Record<string, z.ZodTypeAny>>,
  avgBytesPerRow: number,
): {
  estimatedRows: number;
  estimatedMemoryBytes: number;
  estimatedMemoryMB: number;
  estimatedMemoryGB: number;
} {
  const bytesPerRow = estimateBytesPerRow(schema);
  const estimatedRows = Math.floor(fileSizeBytes / avgBytesPerRow);
  const estimatedMemoryBytes = estimatedRows * bytesPerRow;

  return {
    estimatedRows,
    estimatedMemoryBytes,
    estimatedMemoryMB: estimatedMemoryBytes / 1024 / 1024,
    estimatedMemoryGB: estimatedMemoryBytes / 1024 / 1024 / 1024,
  };
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

  if (base instanceof z.ZodOptional) {
    optional = true;
    // deno-lint-ignore no-explicit-any
    base = (base as any)._def.innerType;
  }
  if (base instanceof z.ZodNullable) {
    nullable = true;
    // deno-lint-ignore no-explicit-any
    base = (base as any)._def.innerType;
  }
  if (base instanceof z.ZodDefault) {
    hasDefault = true;
    // deno-lint-ignore no-explicit-any
    base = (base as any)._def.innerType;
  }
  return { base, optional, nullable, hasDefault };
};

/** Parse a single CSV line handling quotes and commas */
function parseCSVLine(
  line: string,
  { comma = ",", quote = '"' }: CSVOptions = {},
): string[] {
  const cells: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === quote) {
      if (inQuotes && line[i + 1] === quote) {
        cell += quote;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === comma) {
      cells.push(cell);
      cell = "";
      continue;
    }

    cell += ch;
  }

  cells.push(cell);
  return cells;
}

/** Auto-wrap Zod schema with type coercion */
// deno-lint-ignore no-explicit-any
function autoWrapSchema<T extends z.ZodObject<any>>(schema: T): T {
  const wrappedShape: z.ZodRawShape = {};

  Object.entries(schema.shape).forEach(([key, value]) => {
    const unwrapped = unwrap(value as ZodTypeAny);

    // Build the target schema (base + modifiers)
    let target: ZodTypeAny = unwrapped.base;
    if (unwrapped.optional) target = target.optional();
    if (unwrapped.nullable) target = target.nullable();

    // Add preprocessing for type coercion, wrapping the complete schema
    const wrapped = z.preprocess((val) => {
      if (typeof val !== "string") return val;
      if (val === "") return undefined;

      try {
        if (unwrapped.base instanceof z.ZodNumber) {
          const num = Number(val);
          if (isNaN(num)) return unwrapped.nullable ? null : undefined;
          return num;
        } else if (unwrapped.base instanceof z.ZodBoolean) {
          return ["true", "1"].includes(val.toLowerCase());
        } else if (unwrapped.base instanceof z.ZodDate) {
          const [year, month, day] = val.split("-").map(Number);
          const date = new Date(year, month - 1, day);
          if (isNaN(date.getTime())) throw new Error(`Invalid date: ${val}`);
          return date;
        }
        return val;
      } catch (_error) {
        return unwrapped.nullable ? null : undefined;
      }
      // deno-lint-ignore no-explicit-any
    }, target) as any;

    // @ts-expect-error – runtime merging trick
    wrappedShape[key] = wrapped;
  });

  return z.object(wrappedShape) as T;
}

/**
 * Read a large CSV file using streaming to avoid V8 string length limits
 *
 * @param path - File path to read from
 * @param schema - Zod schema for type validation and conversion
 * @param opts - Options for parsing
 * @returns A properly typed DataFrame based on the Zod schema
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   id: z.number().int(),
 *   name: z.string(),
 * });
 *
 * const df = await readCSVStream("./large-file.csv", schema);
 * ```
 */
// Overload: with no_types: true, schema required for streaming, returns DataFrame<any>
// deno-lint-ignore no-explicit-any
export async function readCSVStream<S extends z.ZodObject<any>>(
  path: string,
  schema: S,
  opts: CSVOptions & NAOpts & { no_types: true },
  // deno-lint-ignore no-explicit-any
): Promise<DataFrame<any>>;

// Overload: default returns typed DataFrame
// deno-lint-ignore no-explicit-any
export async function readCSVStream<S extends z.ZodObject<any>>(
  path: string,
  schema: S,
  opts?: CSVOptions & NAOpts,
): Promise<DataFrame<z.infer<S>>>;

// Implementation
// deno-lint-ignore no-explicit-any
export async function readCSVStream<S extends z.ZodObject<any>>(
  path: string,
  schema: S,
  opts: CSVOptions & NAOpts = {},
  // deno-lint-ignore no-explicit-any
): Promise<DataFrame<z.infer<S>> | DataFrame<any>> {
  // Check file size and estimate memory requirements by sampling actual rows
  const stats = await stat(path);
  const fileSizeBytes = stats.size;

  const wrappedSchema = autoWrapSchema(schema);
  const na = opts.naValues ?? DEFAULT_NA;
  const trim = opts.trim ?? true;
  const skipEmptyLines = opts.skipEmptyLines ?? true;

  // Sample first 6 lines (1 header + 5 data rows)
  const sampleLines: string[] = [];
  const sampleStream = fs.createReadStream(path, { encoding: "utf8" });
  const sampleRl = readline.createInterface({
    input: sampleStream,
    crlfDelay: Infinity,
  });

  for await (const line of sampleRl) {
    sampleLines.push(line);
    if (sampleLines.length >= 6) break;
  }
  sampleStream.destroy();

  // Parse first 5 data rows to measure actual memory
  const sampleHeaders = parseCSVLine(sampleLines[0], opts).map((h) => h.trim());
  const sampleHeaderMap = new Map(sampleHeaders.map((h, i) => [h, i]));
  const sampleRows: z.infer<S>[] = [];

  for (let i = 1; i < sampleLines.length; i++) {
    const cells = parseCSVLine(sampleLines[i], opts);
    const obj: Record<string, unknown> = {};

    Object.keys(schema.shape).forEach((key) => {
      const idx = sampleHeaderMap.get(key);
      obj[key] = idx !== undefined ? (cells[idx] ?? "") : "";
    });

    const naProcessed = Object.fromEntries(
      Object.entries(obj).map(([k, v]) => {
        if (isNA(v, na, trim)) {
          const originalField = schema.shape[k];
          const { optional, nullable } = unwrap(originalField);
          return [k, optional ? undefined : nullable ? null : v] as const;
        }
        return [k, v] as const;
      }),
    );

    const parsed = wrappedSchema.safeParse(naProcessed);
    if (parsed.success) {
      sampleRows.push(parsed.data as z.infer<S>);
    }
  }

  // Measure actual memory size of parsed sample rows via JSON serialization
  // This gives us a reasonable proxy for object size
  const sampleJson = JSON.stringify(sampleRows);
  const avgJsonBytesPerRow = sampleJson.length / sampleRows.length;

  // Calculate average CSV bytes per row for estimating total row count
  const avgCsvBytesPerRow =
    sampleLines.slice(1).reduce((sum, line) => sum + line.length, 0) /
    (sampleLines.length - 1);

  // Estimate: (file size / CSV bytes per row) * (JSON bytes per row * 2.5)
  // 2.5x multiplier accounts for JS object overhead beyond JSON representation
  const estimatedRows = Math.floor(fileSizeBytes / avgCsvBytesPerRow);
  const estimatedMemoryBytes = estimatedRows * avgJsonBytesPerRow * 2.5;

  const estimate = {
    estimatedRows,
    estimatedMemoryBytes,
    estimatedMemoryMB: estimatedMemoryBytes / 1024 / 1024,
    estimatedMemoryGB: estimatedMemoryBytes / 1024 / 1024 / 1024,
  };

  // V8's default heap limit is ~4GB on 64-bit systems
  // Users can increase with --max-old-space-size flag
  const DEFAULT_HEAP_LIMIT_BYTES = 4 * 1024 * 1024 * 1024; // 4GB
  const heapLimitGB = DEFAULT_HEAP_LIMIT_BYTES / 1024 / 1024 / 1024;

  // Throw error if estimated memory exceeds 80% of default heap limit
  if (estimate.estimatedMemoryBytes > DEFAULT_HEAP_LIMIT_BYTES * 0.8) {
    throw new Error(
      `Estimated DataFrame size (${
        estimate.estimatedMemoryGB.toFixed(2)
      } GB) exceeds available heap memory (~${
        heapLimitGB.toFixed(1)
      } GB).\n\n` +
        `File: ${
          (fileSizeBytes / 1024 / 1024 / 1024).toFixed(2)
        } GB with ~${estimate.estimatedRows.toLocaleString()} rows\n\n` +
        `To load this file, increase heap size:\n` +
        `  deno test --allow-read --v8-flags=--max-old-space-size=${
          Math.ceil(estimate.estimatedMemoryGB * 1.5 * 1024)
        }\n\n` +
        `Or process the file in chunks instead of loading it all into memory.`,
    );
  }

  // Continue with actual file reading
  const rows: z.infer<S>[] = [];
  let headers: string[] = [];
  const headerMap: Map<string, number> = new Map();
  let lineNumber = 0;

  const fileStream = fs.createReadStream(path, { encoding: "utf8" });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    lineNumber++;

    // Skip empty lines if requested
    if (skipEmptyLines && line.trim() === "") {
      continue;
    }

    const cells = parseCSVLine(line, opts);

    // First line is headers
    if (lineNumber === 1) {
      headers = cells.map((h) => h.trim());
      headers.forEach((h, i) => headerMap.set(h, i));

      // Validate all required columns are present
      const schemaHeaders = Object.keys(schema.shape);
      const missing = schemaHeaders.filter((h) => !headerMap.has(h));
      if (missing.length > 0) {
        throw new Error(`Missing required columns: ${missing.join(", ")}`);
      }
      continue;
    }

    // Parse data rows
    const obj: Record<string, unknown> = {};
    Object.keys(schema.shape).forEach((key) => {
      const idx = headerMap.get(key);
      obj[key] = idx !== undefined ? (cells[idx] ?? "") : "";
    });

    // Apply NA handling
    const naProcessed = Object.fromEntries(
      Object.entries(obj).map(([k, v]) => {
        if (isNA(v, na, trim)) {
          const originalField = schema.shape[k];
          const { optional, nullable } = unwrap(originalField);
          return [k, optional ? undefined : nullable ? null : v] as const;
        }
        return [k, v] as const;
      }),
    );

    // Validate and add row
    const parsed = wrappedSchema.safeParse(naProcessed);
    if (parsed.success) {
      rows.push(parsed.data as z.infer<S>);
    } else {
      throw new Error(
        `Row ${lineNumber} validation failed: ${parsed.error.message}`,
      );
    }
  }

  const noTypes = opts.no_types === true;
  if (noTypes) {
    return createDataFrame(rows, { schema, no_types: true });
  }
  return createDataFrame(rows, schema);
}
