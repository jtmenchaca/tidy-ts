// Parquet reading with Zod schema validation and type inference
import { z, ZodDefault, ZodNullable, ZodOptional, type ZodTypeAny } from "zod";
import { parquetReadObjects } from "hyparquet";
import { compressors } from "hyparquet-compressors";
// const data = await parquetReadObjects({ file, compressors });
import { createDataFrame, type DataFrame } from "../dataframe/index.ts";
import type { NAOpts } from "./types.ts";
import { currentRuntime, Runtime } from "@tidy-ts/shims";

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
│  1 · zparquet.* helpers (string/number/boolean/date/enum)                 │
└───────────────────────────────────────────────────────────────────────────*/
type InputLike<T extends ZodTypeAny> =
  | (() => T) // no schema supplied
  | (<U extends ZodTypeAny>(sch: U) => U);

function make<
  T extends ZodTypeAny,
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
export const zparquet = {
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
│  2 · Parquet parsing helpers                                              │
└───────────────────────────────────────────────────────────────────────────*/
export type ParquetOptions = {
  columns?: string[];
  rowStart?: number;
  rowEnd?: number;
};

const schemaHeaders = (shape: z.ZodRawShape) => Object.keys(shape);

/** Automatically wrap Zod types with zparquet coercion helpers */
// deno-lint-ignore no-explicit-any
function autoWrapSchema<T extends z.ZodObject<any>>(schema: T): T {
  const wrappedShape: z.ZodRawShape = {};

  Object.entries(schema.shape).forEach(([key, value]) => {
    const unwrapped = unwrap(value as ZodTypeAny);
    let wrapped: ZodTypeAny = unwrapped.base;

    // Determine the appropriate zparquet wrapper based on the base type
    if (unwrapped.base instanceof z.ZodNumber) {
      wrapped = zparquet.number(unwrapped.base);
    } else if (unwrapped.base instanceof z.ZodBoolean) {
      wrapped = zparquet.boolean(unwrapped.base);
    } else if (unwrapped.base instanceof z.ZodDate) {
      wrapped = zparquet.date(unwrapped.base);
    } else if (unwrapped.base instanceof z.ZodEnum) {
      wrapped = zparquet.enum(unwrapped.base);
    } else if (unwrapped.base instanceof z.ZodString) {
      wrapped = zparquet.string(unwrapped.base);
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
│  3 · validate whole Parquet data                                          │
└───────────────────────────────────────────────────────────────────────────*/
// deno-lint-ignore no-explicit-any
export function parseParquetContent<S extends z.ZodObject<any>>(
  // deno-lint-ignore no-explicit-any
  data: Record<string, any>[],
  schema: S,
  opts: NAOpts = {},
): z.infer<S>[] {
  // Auto-wrap the schema with zparquet helpers if not already wrapped
  const wrappedSchema = autoWrapSchema(schema);

  const na = opts.naValues ?? DEFAULT_NA;
  const trim = opts.trim ?? true;

  const headersFromSchema = schemaHeaders(wrappedSchema.shape);

  // Check if all required columns exist in the data
  if (data.length > 0) {
    const headersFromParquet = Object.keys(data[0]);
    const missing = headersFromSchema.filter(
      (h) => !headersFromParquet.includes(h),
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
 * Detects if input is a file path or raw Parquet buffer content
 */
function isFilePath(input: string | ArrayBuffer): boolean {
  if (input instanceof ArrayBuffer) {
    return false; // ArrayBuffer is definitely not a file path
  }

  // Check for file-like patterns (has extension, doesn't contain binary data, etc.)
  return typeof input === "string" &&
    !input.includes("\0") && // no null bytes
    (input.includes(".") || input.length < 100) &&
    (input.endsWith(".parquet") || input.includes("/") || input.includes("\\"));
}

/**
 * Read a Parquet file with Zod schema validation and type inference
 *
 * @param pathOrBuffer - Either a file path to read from, or an ArrayBuffer with Parquet data
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
 * const df1 = await readParquet("./data.parquet", schema);
 *
 * // Parse from ArrayBuffer
 * const buffer = await Deno.readFile("./data.parquet");
 * const df2 = await readParquet(buffer, schema);
 *
 * // Both are typed as DataFrame<z.output<typeof schema>>
 * ```
 */
// deno-lint-ignore no-explicit-any
async function readParquetImpl<S extends z.ZodObject<any>>(
  pathOrBuffer: string | ArrayBuffer,
  schema: S,
  opts: ParquetOptions & NAOpts = {},
): Promise<DataFrame<z.infer<S>>> {
  // deno-lint-ignore no-explicit-any
  let file: any; // AsyncBuffer from hyparquet

  if (isFilePath(pathOrBuffer)) {
    // It's a file path - read the file using Deno.readFile to avoid resource leaks
    try {
      // Read the entire file into memory as an ArrayBuffer
      // This ensures the file handle is properly closed after reading
      const fileData = await Deno.readFile(pathOrBuffer as string);
      file = fileData.buffer;
    } catch (error) {
      throw new Error(
        `Failed to read Parquet file '${pathOrBuffer}': ${
          (error as Error).message
        }`,
      );
    }
  } else {
    // It's an ArrayBuffer - use directly
    file = pathOrBuffer as ArrayBuffer;
  }

  // Parse the Parquet content
  const parquetOptions = {
    columns: opts.columns,
    rowStart: opts.rowStart,
    rowEnd: opts.rowEnd,
  };

  const rawData = await parquetReadObjects({
    file,
    compressors,
    ...parquetOptions,
  });

  // Parse and validate with Zod schema
  const rows = parseParquetContent(rawData, schema, opts);

  return createDataFrame(rows, schema);
}

// Dynamic export with runtime detection
// deno-lint-ignore no-explicit-any
export const readParquet: <S extends z.ZodObject<any>>(
  pathOrBuffer: string | ArrayBuffer,
  schema: S,
  opts?: ParquetOptions & NAOpts,
) => Promise<DataFrame<z.infer<S>>> = (() => {
  const isNode = currentRuntime === Runtime.Node;
  const isDeno = currentRuntime === Runtime.Deno;
  const isBun = currentRuntime === Runtime.Bun;

  if (isNode || isDeno || isBun) {
    // deno-lint-ignore no-explicit-any
    return async <S extends z.ZodObject<any>>(
      pathOrBuffer: string | ArrayBuffer,
      schema: S,
      opts: ParquetOptions & NAOpts = {},
    ): Promise<DataFrame<z.infer<S>>> => {
      return await readParquetImpl(pathOrBuffer, schema, opts);
    };
  } else {
    return () => {
      return Promise.reject(
        new Error(
          "readParquet is only available in Node.js/Deno environments. Use ArrayBuffer input instead of file paths in browsers.",
        ),
      );
    };
  }
})();
