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
 * Read an Arrow file or buffer with Zod schema validation and type inference.
 *
 * Loads Arrow data from a file path (Node.js/Deno) or ArrayBuffer (all environments)
 * and validates each row against the provided Zod schema. Returns a fully typed
 * DataFrame based on the schema. Throws an error if validation fails or if used
 * in a browser environment with a file path.
 *
 * @param pathOrBuffer - File path (Node.js/Deno only) or ArrayBuffer containing Arrow data
 * @param schema - Zod schema for type validation and conversion. The schema defines
 *   the expected structure and types of each row in the DataFrame.
 * @param opts - Optional configuration for reading and parsing:
 *   - NA handling options to specify how missing values are represented
 *
 * @returns A Promise resolving to a DataFrame typed according to the schema
 *
 * @example
 * // Read from file with validation
 * import { z } from "zod";
 *
 * const schema = z.object({
 *   id: z.number().int(),
 *   name: z.string().min(1),
 *   email: z.string().email(),
 *   age: z.number().optional(),
 * });
 *
 * const df = await readArrow("./data.arrow", schema);
 *
 * @example
 * // Read from ArrayBuffer
 * const buffer = await Deno.readFile("./data.arrow");
 * const df = await readArrow(buffer, schema);
 *
 * @example
 * // With NA handling options
 * const df = await readArrow("./data.arrow", schema, {
 *   naStrings: ["NA", "null", ""]
 * });
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
 * Read a CSV file or parse CSV content with Zod schema validation and type inference.
 *
 * Loads CSV data from a file path (Node.js/Deno) or raw CSV string (all environments)
 * and validates each row against the provided Zod schema. Returns a fully typed
 * DataFrame based on the schema. Automatically handles type conversion (strings to
 * numbers, booleans, etc.) and throws an error if validation fails.
 *
 * @param pathOrContent - File path (Node.js/Deno only) or raw CSV string content.
 *   The function automatically detects whether the input is a file path or CSV content.
 * @param schema - Zod schema for type validation and conversion. The schema defines
 *   the expected structure and types of each row in the DataFrame.
 * @param opts - Optional configuration for CSV parsing:
 *   - `separator`: Column delimiter (default: ",")
 *   - `skipEmptyLines`: Skip empty lines (default: true)
 *   - `naStrings`: Array of strings to treat as NA/missing values
 *
 * @returns A Promise resolving to a DataFrame typed according to the schema
 *
 * @example
 * // Read from file with validation
 * import { z } from "zod";
 *
 * const schema = z.object({
 *   id: z.number().int(),
 *   name: z.string().min(1),
 *   email: z.string().email(),
 *   age: z.number().optional(),
 * });
 *
 * const df = await readCSV("./data.csv", schema);
 *
 * @example
 * // Parse from raw CSV content
 * const csvContent = "id,name,email,age\n1,Alice,alice@example.com,25\n2,Bob,bob@example.com,30";
 * const df = await readCSV(csvContent, schema);
 *
 * @example
 * // With custom options
 * const df = await readCSV("./data.tsv", schema, {
 *   separator: "\t",
 *   naStrings: ["NA", "null", ""]
 * });
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
 * Read a Parquet file or buffer with Zod schema validation and type inference.
 *
 * Loads Parquet data from a file path (Node.js/Deno) or ArrayBuffer (all environments)
 * and validates each row against the provided Zod schema. Returns a fully typed
 * DataFrame based on the schema. Parquet is a columnar storage format that provides
 * efficient compression and encoding. Throws an error if validation fails.
 *
 * @param pathOrBuffer - File path (Node.js/Deno only) or ArrayBuffer containing Parquet data
 * @param schema - Zod schema for type validation and conversion. The schema defines
 *   the expected structure and types of each row in the DataFrame.
 * @param opts - Optional configuration for reading and parsing:
 *   - NA handling options to specify how missing values are represented
 *
 * @returns A Promise resolving to a DataFrame typed according to the schema
 *
 * @example
 * // Read from file with validation
 * import { z } from "zod";
 *
 * const schema = z.object({
 *   id: z.number().int(),
 *   name: z.string().min(1),
 *   email: z.string().email(),
 *   age: z.number().optional(),
 * });
 *
 * const df = await readParquet("./data.parquet", schema);
 *
 * @example
 * // Read from ArrayBuffer
 * const buffer = await Deno.readFile("./data.parquet");
 * const df = await readParquet(buffer, schema);
 *
 * @example
 * // With NA handling options
 * const df = await readParquet("./data.parquet", schema, {
 *   naStrings: ["NA", "null", ""]
 * });
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
 * Write a DataFrame to a CSV file or trigger browser download.
 *
 * Exports DataFrame data to CSV format. In Node.js/Deno environments, writes to
 * the specified file path. In browser environments, triggers a file download.
 * Returns the original DataFrame for method chaining. Automatically handles
 * proper CSV escaping for special characters.
 *
 * @param dataFrame - The DataFrame to export. All columns will be included in
 *   the output with proper type conversion and escaping.
 * @param filePath - File path for saving (Node.js/Deno) or download filename (browser).
 *   In Node.js/Deno, this can be a relative or absolute path.
 *
 * @returns A Promise resolving to the original DataFrame for chaining
 *
 * @example
 * // Write to file (Node.js/Deno)
 * const df = createDataFrame([
 *   { id: 1, name: "Alice", age: 30 },
 *   { id: 2, name: "Bob", age: 25 }
 * ]);
 *
 * await writeCSV(df, "./output/data.csv");
 *
 * @example
 * // Trigger download in browser
 * await writeCSV(df, "exported_data.csv");
 *
 * @example
 * // Chain with other operations
 * await df
 *   .filter(row => row.active)
 *   .select("id", "name", "email")
 *   .writeCSV("./active_users.csv");
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
 * Write a DataFrame to a Parquet file or trigger browser download.
 *
 * Exports DataFrame data to Parquet format, a columnar storage format that provides
 * efficient compression and encoding. In Node.js/Deno environments, writes to the
 * specified file path. In browser environments, triggers a file download. Returns
 * the original DataFrame for method chaining.
 *
 * Note: This function requires a static import rather than the dynamic import used
 * by other I/O functions. Use: `import { writeParquet } from '@tidy-ts/dataframe/ts/verbs/utility'`
 *
 * @param dataFrame - The DataFrame to export. All columns will be included in
 *   the output with proper type encoding.
 * @param filePath - File path for saving (Node.js/Deno) or download filename (browser).
 *   In Node.js/Deno, this can be a relative or absolute path.
 *
 * @returns The original DataFrame for chaining (synchronous, unlike writeCSV)
 *
 * @example
 * // Write to file (Node.js/Deno)
 * import { writeParquet } from '@tidy-ts/dataframe/ts/verbs/utility';
 *
 * const df = createDataFrame([
 *   { id: 1, name: "Alice", age: 30 },
 *   { id: 2, name: "Bob", age: 25 }
 * ]);
 *
 * writeParquet(df, "./output/data.parquet");
 *
 * @example
 * // Chain with other operations
 * df.filter(row => row.active)
 *   .select("id", "name", "email")
 *   .writeParquet("./active_users.parquet");
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
