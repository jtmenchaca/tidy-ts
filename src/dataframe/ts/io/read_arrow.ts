// Arrow reading with Zod schema validation and type inference
import { z, ZodDefault, ZodNullable, ZodOptional, type ZodType } from "zod";
import { tableFromIPC } from "@uwdata/flechette";
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
const unwrap = (t: ZodType): {
  base: ZodType;
  optional: boolean;
  nullable: boolean;
  hasDefault: boolean;
} => {
  let base: ZodType = t;
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
│  1 · zarrow.* helpers (string/number/boolean/date/enum)                    │
└───────────────────────────────────────────────────────────────────────────*/
type InputLike<T extends ZodType> =
  | (() => T) // no schema supplied
  | (<U extends ZodType>(sch: U) => U);

function make<
  T extends ZodType,
  Coerce extends (raw: unknown) => unknown,
>(coerce: Coerce): InputLike<T> {
  return (schema: T = undefined as unknown as T) =>
    z.preprocess((val) => {
      // pass through non-primitives that don't need coercion
      if (val === null || val === undefined) return val;

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
const toNumber = (val: unknown): number => {
  if (typeof val === "number") return val;
  if (typeof val === "string") return Number(val);
  if (typeof val === "bigint") return Number(val);
  throw new Error(`Cannot convert ${typeof val} to number`);
};

const toBoolean = (val: unknown): boolean => {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    return ["true", "1", "yes", "y"].includes(val.toLowerCase());
  }
  if (typeof val === "number") return val !== 0;
  throw new Error(`Cannot convert ${typeof val} to boolean`);
};

const toDate = (val: unknown): Date => {
  if (val instanceof Date) return val;
  if (typeof val === "string") {
    // Parse date as local date to avoid timezone issues
    const [year, month, day] = val.split("-").map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${val}`);
    }
    return date;
  }
  if (typeof val === "number") return new Date(val);
  throw new Error(`Cannot convert ${typeof val} to date`);
};

const toString = (val: unknown): string => {
  if (typeof val === "string") return val;
  if (val === null || val === undefined) return "";
  return String(val);
};

// public API ---------------------------------------------------------------------
export const zarrow = {
  string: make<z.ZodString, (val: unknown) => string>((val) => toString(val)),
  number: make<z.ZodNumber, (val: unknown) => number>((val) => toNumber(val)),
  boolean: make<z.ZodBoolean, (val: unknown) => boolean>((val) =>
    toBoolean(val)
  ),
  date: make<z.ZodDate, (val: unknown) => Date>((val) => toDate(val)),
  enum:
    // @ts-expect-error – runtime merging trick
    (<Vals extends [string, ...string[]]>(e: z.ZodEnum<Vals>) =>
      make<typeof e, (val: unknown) => string>((val) => toString(val))(
        e,
        // deno-lint-ignore no-explicit-any
      )) as any,
};

/*───────────────────────────────────────────────────────────────────────────┐
│  2 · Arrow parsing helpers                                                 │
└───────────────────────────────────────────────────────────────────────────*/
export type ArrowOptions = {
  columns?: string[];
  useDate?: boolean;
  useDecimalInt?: boolean;
  useBigInt?: boolean;
  useMap?: boolean;
  useProxy?: boolean;
};

const schemaHeaders = (shape: z.ZodRawShape) => Object.keys(shape);

/** Automatically wrap Zod types with zarrow coercion helpers */
// deno-lint-ignore no-explicit-any
function autoWrapSchema<T extends z.ZodObject<any>>(schema: T): T {
  const wrappedShape: z.ZodRawShape = {};

  Object.entries(schema.shape).forEach(([key, value]) => {
    const unwrapped = unwrap(value as ZodType);
    let wrapped: ZodType = unwrapped.base;

    // Determine the appropriate zarrow wrapper based on the base type
    if (unwrapped.base instanceof z.ZodNumber) {
      wrapped = zarrow.number(unwrapped.base);
    } else if (unwrapped.base instanceof z.ZodBoolean) {
      wrapped = zarrow.boolean(unwrapped.base);
    } else if (unwrapped.base instanceof z.ZodDate) {
      wrapped = zarrow.date(unwrapped.base);
    } else if (unwrapped.base instanceof z.ZodEnum) {
      wrapped = zarrow.enum(unwrapped.base);
    } else if (unwrapped.base instanceof z.ZodString) {
      wrapped = zarrow.string(unwrapped.base);
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
│  3 · validate whole Arrow data                                            │
└───────────────────────────────────────────────────────────────────────────*/
// deno-lint-ignore no-explicit-any
export function parseArrowContent<S extends z.ZodObject<any>>(
  // deno-lint-ignore no-explicit-any
  data: Record<string, any>[],
  schema: S,
  opts: NAOpts = {},
): z.infer<S>[] {
  // Auto-wrap the schema with zarrow helpers if not already wrapped
  const wrappedSchema = autoWrapSchema(schema);

  const na = opts.naValues ?? DEFAULT_NA;
  const trim = opts.trim ?? true;

  const headersFromSchema = schemaHeaders(wrappedSchema.shape);

  // Check if all required columns exist in the data
  if (data.length > 0) {
    const headersFromArrow = Object.keys(data[0]);
    const missing = headersFromSchema.filter(
      (h) => !headersFromArrow.includes(h),
    );

    if (missing.length > 0) {
      throw new Error(`Missing required columns: ${missing.join(", ")}`);
    }
  }

  const valid: z.infer<S>[] = [];

  data.forEach((row, idx) => {
    // Apply NA handling before schema validation
    const naProcessed = Object.fromEntries(
      Object.entries(row).map(([k, v]) => {
        // Handle null values or string NA values
        if (v === null || v === undefined || isNA(v, na, trim)) {
          // Check if the field is nullable or optional in the original schema
          const originalField = schema.shape[k];
          if (originalField) {
            const { optional, nullable } = unwrap(originalField);
            return [k, optional ? undefined : nullable ? null : v] as const;
          }
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
│  4 · file reading helper                                                   │
└───────────────────────────────────────────────────────────────────────────*/

/**
 * Detects if input is a file path or raw Arrow buffer content
 */
function isFilePath(input: string | ArrayBuffer): boolean {
  if (input instanceof ArrayBuffer) {
    return false; // ArrayBuffer is definitely not a file path
  }

  // Check for file-like patterns (has extension, doesn't contain binary data, etc.)
  return typeof input === "string" &&
    !input.includes("\0") && // no null bytes
    (input.includes(".") || input.length < 100) &&
    (input.endsWith(".arrow") || input.includes("/") || input.includes("\\"));
}

/**
 * Read an Arrow file with Zod schema validation and type inference
 *
 * @param pathOrBuffer - Either a file path to read from, or an ArrayBuffer with Arrow data
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
 * const df1 = await read_arrow("./data.arrow", schema);
 *
 * // Parse from ArrayBuffer
 * const buffer = await Deno.readFile("./data.arrow");
 * const df2 = await read_arrow(buffer, schema);
 *
 * // Both are typed as DataFrame<z.output<typeof schema>>
 * ```
 */
// deno-lint-ignore no-explicit-any
export async function read_arrow<S extends z.ZodObject<any>>(
  pathOrBuffer: string | ArrayBuffer,
  schema: S,
  opts: ArrowOptions & NAOpts = {},
): Promise<DataFrame<z.infer<S>>> {
  let buffer: ArrayBuffer;

  if (isFilePath(pathOrBuffer)) {
    // It's a file path - read the file
    try {
      const fileData = await fs.readFile(pathOrBuffer as string);
      // Convert Buffer to ArrayBuffer properly
      buffer = new ArrayBuffer(fileData.length);
      const view = new Uint8Array(buffer);
      view.set(fileData);
    } catch (error) {
      throw new Error(
        `Failed to read Arrow file '${pathOrBuffer}': ${
          (error as Error).message
        }`,
      );
    }
  } else {
    // It's an ArrayBuffer - use directly
    buffer = pathOrBuffer as ArrayBuffer;
  }

  // Parse the Arrow content using flechette
  const arrowOptions = {
    useDate: opts.useDate ?? false,
    useDecimalInt: opts.useDecimalInt ?? false,
    useBigInt: opts.useBigInt ?? false,
    useMap: opts.useMap ?? false,
    useProxy: opts.useProxy ?? false,
  };

  const table = tableFromIPC(buffer, arrowOptions);

  // Convert to array of objects for easier processing
  let rawData = table.toArray();

  // Apply column filtering if specified
  if (opts.columns) {
    rawData = rawData.map((row) => {
      const filtered: Record<string, unknown> = {};
      opts.columns!.forEach((col) => {
        if (col in row) {
          filtered[col] = row[col];
        }
      });
      return filtered;
    });
  }

  // Parse and validate with Zod schema
  const rows = parseArrowContent(rawData, schema, opts);

  return createDataFrame(rows, schema);
}

/*───────────────────────────────────────────────────────────────────────────┐
│  5 · re-exports (optional)                                                 │
└───────────────────────────────────────────────────────────────────────────*/
