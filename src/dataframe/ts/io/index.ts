// Data I/O Module
// Exports all data input/output functions
// deno-lint-ignore-file no-unused-vars

import type { z } from "zod";
import type { DataFrame } from "../dataframe/index.ts";

// Data I/O functions for reading and writing different formats
export * from "./read_csv.ts";
export * from "./read_parquet.ts";
export * from "./read_arrow.ts";
export { readJSON } from "./read_json.ts";
export * from "./write_json.ts";

// CSV parsing utilities (exported for advanced usage)
export * from "./csv-parser.ts";

// Import types for proper type checking
import type { CsvOptions } from "./read_csv.ts";
import type { NAOpts } from "./types.ts";
import type { ArrowOptions } from "./read_arrow.ts";
import type { ParquetOptions } from "./read_parquet.ts";

// Type definitions for conditionally loaded I/O functions
// deno-lint-ignore no-explicit-any
type ReadCsvFunction = <S extends z.ZodObject<any>>(
  pathOrContent: string,
  schema: S,
  opts?: CsvOptions & NAOpts,
) => Promise<DataFrame<z.infer<S>>>;

// deno-lint-ignore no-explicit-any
type ReadArrowFunction = <S extends z.ZodObject<any>>(
  pathOrBuffer: string | ArrayBuffer,
  schema: S,
  opts?: ArrowOptions & NAOpts,
) => Promise<DataFrame<z.infer<S>>>;

// deno-lint-ignore no-explicit-any
type ReadParquetFunction = <S extends z.ZodObject<any>>(
  pathOrBuffer: string | ArrayBuffer,
  schema: S,
  opts?: ParquetOptions & NAOpts,
) => Promise<DataFrame<z.infer<S>>>;

type WriteCsvFunction = <Row extends Record<string, unknown>>(
  df: DataFrame<Row>,
  path: string,
) => Promise<DataFrame<Row>>;

type WriteParquetFunction = <Row extends Record<string, unknown>>(
  df: DataFrame<Row>,
  path: string,
) => DataFrame<Row>;

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
 * const df1 = await readArrow("./data.arrow", schema);
 *
 * // Parse from ArrayBuffer
 * const buffer = await Deno.readFile("./data.arrow");
 * const df2 = await readArrow(buffer, schema);
 *
 * // Both are typed as DataFrame<z.output<typeof schema>>
 * ```
 */
export const readArrow: ReadArrowFunction = (() => {
  // deno-lint-ignore no-process-global
  const isNode = typeof process !== "undefined" && process?.versions?.node;
  const isDeno = typeof Deno !== "undefined";

  if (isNode || isDeno) {
    // deno-lint-ignore no-explicit-any
    return async <S extends z.ZodObject<any>>(
      pathOrBuffer: string | ArrayBuffer,
      schema: S,
      opts: ArrowOptions & NAOpts = {},
    ) => {
      const { readArrow } = await import("./read_arrow.ts");
      return readArrow(pathOrBuffer, schema, opts);
    };
  } else {
    return () => {
      throw new Error(
        "readArrow is only available in Node.js/Deno environments. Use ArrayBuffer input instead of file paths in browsers.",
      );
    };
  }
})();

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
export const readCSV: ReadCsvFunction = (() => {
  // deno-lint-ignore no-process-global
  const isNode = typeof process !== "undefined" && process?.versions?.node;
  const isDeno = typeof Deno !== "undefined";

  if (isNode || isDeno) {
    // deno-lint-ignore no-explicit-any
    return async <S extends z.ZodObject<any>>(
      pathOrContent: string,
      schema: S,
      opts?: CsvOptions & NAOpts,
    ) => {
      const { readCSV } = await import("./read_csv.ts");
      return readCSV(pathOrContent, schema, opts);
    };
  } else {
    return () => {
      throw new Error(
        "readCSV is only available in Node.js/Deno environments. Use string input instead of file paths in browsers.",
      );
    };
  }
})();

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
export const readParquet: ReadParquetFunction = (() => {
  // deno-lint-ignore no-process-global
  const isNode = typeof process !== "undefined" && process?.versions?.node;
  const isDeno = typeof Deno !== "undefined";

  if (isNode || isDeno) {
    // deno-lint-ignore no-explicit-any
    return async <S extends z.ZodObject<any>>(
      pathOrBuffer: string | ArrayBuffer,
      schema: S,
      opts: ParquetOptions & NAOpts = {},
    ) => {
      const { readParquet } = await import("./read_parquet.ts");
      return readParquet(pathOrBuffer, schema, opts);
    };
  } else {
    return () => {
      throw new Error(
        "readParquet is only available in Node.js/Deno environments. Use ArrayBuffer input instead of file paths in browsers.",
      );
    };
  }
})();

/**
 * Write a DataFrame to a CSV file
 *
 * @param dataFrame - The DataFrame to write
 * @param filePath - The file path where to save the CSV file
 * @returns The original DataFrame for chaining
 *
 * @example
 * ```ts
 * import { createDataFrame } from "tidy-ts/dataframe";
 *
 * const df = createDataFrame([
 *   { id: 1, name: "Alice", age: 30 },
 *   { id: 2, name: "Bob", age: 25 }
 * ]);
 *
 * // Write to file
 * await writeCSV(df, "./data.csv");
 *
 * // In browser, this will trigger a download
 * await writeCSV(df, "data.csv");
 * ```
 */
export const writeCSV: WriteCsvFunction = (() => {
  // deno-lint-ignore no-process-global
  const isNode = typeof process !== "undefined" && process?.versions?.node;
  const isDeno = typeof Deno !== "undefined";

  if (isNode || isDeno) {
    return async <Row extends Record<string, unknown>>(
      df: DataFrame<Row>,
      path: string,
    ) => {
      const { writeCSV } = await import("../verbs/utility/writeCSV.verb.ts");
      return writeCSV(df, path);
    };
  } else {
    return async <Row extends Record<string, unknown>>(
      df: DataFrame<Row>,
      path: string,
    ) => {
      // Browser environment - trigger download using CSV string
      // Convert DataFrame to CSV string
      const data = df.toArray();
      const columns = df.columns();

      // Simple CSV conversion (header + rows)
      const header = columns.join(",");
      const rows = data.map((row) =>
        columns.map((col) => {
          const val = row[col];
          // Simple CSV escaping - wrap in quotes if contains comma, quote, or newline
          if (
            typeof val === "string" &&
            (val.includes(",") || val.includes('"') || val.includes("\n"))
          ) {
            return '"' + val.replace(/"/g, '""') + '"';
          }
          return String(val ?? "");
        }).join(",")
      );
      const csvString = [header, ...rows].join("\n");

      const blob = new Blob([csvString], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = path.split("/").pop() || "data.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Add a small delay to ensure download starts before resolving
      await new Promise((resolve) => setTimeout(resolve, 100));
      return df;
    };
  }
})();

/**
 * Write a DataFrame to a Parquet file
 *
 * @param dataFrame - The DataFrame to write
 * @param filePath - The file path where to save the Parquet file
 * @returns The original DataFrame for chaining
 *
 * @example
 * ```ts
 * import { createDataFrame } from "tidy-ts/dataframe";
 *
 * const df = createDataFrame([
 *   { id: 1, name: "Alice", age: 30 },
 *   { id: 2, name: "Bob", age: 25 }
 * ]);
 *
 * // Write to file
 * writeParquet(df, "./data.parquet");
 *
 * // In browser, this will trigger a download
 * writeParquet(df, "data.parquet");
 * ```
 */
export const writeParquet: WriteParquetFunction = (() => {
  // deno-lint-ignore no-process-global
  const isNode = typeof process !== "undefined" && process?.versions?.node;
  const isDeno = typeof Deno !== "undefined";

  if (isNode || isDeno) {
    return <Row extends Record<string, unknown>>(
      df: DataFrame<Row>,
      path: string,
    ) => {
      // Import the actual writeParquet function synchronously
      // This is a limitation - we can't use dynamic imports for sync functions
      throw new Error(
        "writeParquet requires static import. Use: import { writeParquet } from '@tidy-ts/dataframe/ts/verbs/utility'",
      );
    };
  } else {
    return <Row extends Record<string, unknown>>(
      //
      df: DataFrame<Row>,
      path: string,
    ) => {
      // Browser environment - trigger download using Parquet buffer
      // This is a limitation - we can't use dynamic imports for sync functions
      throw new Error(
        "writeParquet requires static import. Use: import { writeParquet } from '@tidy-ts/dataframe/ts/verbs/utility'",
      );
    };
  }
})();
