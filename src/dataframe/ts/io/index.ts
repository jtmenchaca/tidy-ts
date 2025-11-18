// Data I/O Module
// Exports all data input/output functions
// deno-lint-ignore-file no-unused-vars

import { currentRuntime, Runtime } from "@tidy-ts/shims";
import type { z } from "zod";
import type { DataFrame } from "../dataframe/index.ts";

// Data I/O functions for reading and writing different formats
export * from "./read_csv.ts";
export * from "./read_csv_stream.ts";
export * from "./read_parquet.ts";
export * from "./read_arrow.ts";
export { parseXLSXRaw } from "./read_xlsx.ts";
export * from "./write_xlsx.ts";
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

/**
 * Read a CSV file or parse CSV content with Zod schema validation and type inference.
 *
 * Loads CSV data from a file path (Node.js/Deno) or raw CSV content (all environments)
 * and validates each row against the provided Zod schema. Returns a fully typed
 * DataFrame based on the schema. Automatically detects whether input is a file path
 * or raw CSV content. Throws an error if validation fails.
 *
 * @param pathOrContent - File path (Node.js/Deno) or raw CSV content string
 * @param schema - Zod schema for type validation and conversion. The schema defines
 *   the expected structure and types of each row in the DataFrame. Types are automatically
 *   coerced (e.g., string "123" becomes number 123 for z.number() fields).
 * @param opts - Optional configuration for reading and parsing:
 *   - CSV parsing options (delimiter, quote character, skip lines, etc.)
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
 * const df = await readCSV("./data.csv", schema);
 *
 * @example
 * // Parse from raw CSV content
 * import { z } from "zod";
 *
 * const schema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string().email(),
 *   age: z.number(),
 * });
 *
 * const csvContent = "id,name,email,age\n1,Alice,alice@example.com,25\n2,Bob,bob@example.com,30";
 * const df = await readCSV(csvContent, schema);
 *
 * @example
 * // With NA handling options
 * const df = await readCSV("./data.csv", schema, {
 *   naValues: ["NA", "null", ""],
 *   delimiter: ";",
 *   trim: true
 * });
 */
type ReadCsvFunction = {
  (
    pathOrContent: string | ArrayBuffer | File | Blob,
    opts: CsvOptions & NAOpts & { no_types: true },
    // deno-lint-ignore no-explicit-any
  ): Promise<DataFrame<any>>;
  // deno-lint-ignore no-explicit-any
  <S extends z.ZodObject<any>>(
    pathOrContent: string | ArrayBuffer | File | Blob,
    schema: S,
    opts: CsvOptions & NAOpts & { no_types: true },
    // deno-lint-ignore no-explicit-any
  ): Promise<DataFrame<any>>;
  // deno-lint-ignore no-explicit-any
  <S extends z.ZodObject<any>>(
    pathOrContent: string | ArrayBuffer | File | Blob,
    schema: S,
    opts?: CsvOptions & NAOpts,
  ): Promise<DataFrame<z.infer<S>>>;
};

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
 *   - Arrow parsing options (useDate, useBigInt, column selection, etc.)
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
 * // With Arrow parsing options
 * const df = await readArrow("./data.arrow", schema, {
 *   columns: ["id", "name"],
 *   useDate: true,
 *   naStrings: ["NA", "null", ""]
 * });
 */
// deno-lint-ignore no-explicit-any
type ReadArrowFunction = <S extends z.ZodObject<any>>(
  pathOrBuffer: string | ArrayBuffer,
  schema: S,
  opts?: ArrowOptions & NAOpts,
) => Promise<DataFrame<z.infer<S>>>;

/**
 * Read a Parquet file or buffer with Zod schema validation and type inference.
 *
 * Loads Parquet data from a file path (Node.js/Deno) or ArrayBuffer (all environments)
 * and validates each row against the provided Zod schema. Returns a fully typed
 * DataFrame based on the schema. Throws an error if validation fails or if used
 * in a browser environment with a file path.
 *
 * @param pathOrBuffer - File path (Node.js/Deno only) or ArrayBuffer containing Parquet data
 * @param schema - Zod schema for type validation and conversion. The schema defines
 *   the expected structure and types of each row in the DataFrame.
 * @param opts - Optional configuration for reading and parsing:
 *   - Parquet parsing options (column selection, row range, etc.)
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
 * // With Parquet parsing options
 * const df = await readParquet("./data.parquet", schema, {
 *   columns: ["id", "name"],
 *   rowStart: 0,
 *   rowEnd: 1000,
 *   naStrings: ["NA", "null", ""]
 * });
 */
// deno-lint-ignore no-explicit-any
type ReadParquetFunction = <S extends z.ZodObject<any>>(
  pathOrBuffer: string | ArrayBuffer,
  schema: S,
  opts?: ParquetOptions & NAOpts,
) => Promise<DataFrame<z.infer<S>>>;

/**
 * Write a DataFrame to a CSV file.
 *
 * Converts a DataFrame to CSV format and writes it to a file (Node.js/Deno) or
 * triggers a download (browser). The CSV includes headers and properly escapes
 * values containing commas, quotes, or newlines. Returns the original DataFrame
 * for method chaining.
 *
 * @param df - The DataFrame to write
 * @param path - File path where to save the CSV file. In browsers, this becomes
 *   the download filename.
 *
 * @returns A Promise that resolves when the file is written
 *
 * @example
 * // Write to file (Node.js/Deno)
 * const df = createDataFrame([
 *   { id: 1, name: "Alice", age: 30 },
 *   { id: 2, name: "Bob", age: 25 }
 * ]);
 *
 * await writeCSV(df, "./data.csv");
 *
 * @example
 * // Trigger download in browser
 * await writeCSV(df, "data.csv");
 */
type WriteCsvFunction = <Row extends Record<string, unknown>>(
  df: DataFrame<Row>,
  path: string,
) => Promise<void>;

/**
 * Write a DataFrame to a Parquet file.
 *
 * Converts a DataFrame to Parquet format and writes it to a file (Node.js/Deno) or
 * triggers a download (browser). Automatically infers Parquet column types from
 * the DataFrame data (numbers, strings, booleans, dates). Returns the original
 * DataFrame for method chaining.
 *
 * Note: This function is synchronous but requires static import. The dynamically
 * exported version throws an error with instructions to use static import instead.
 *
 * @param df - The DataFrame to write
 * @param path - File path where to save the Parquet file. In browsers, this becomes
 *   the download filename.
 *
 * @returns The original DataFrame for chaining
 *
 * @example
 * // Write to file (Node.js/Deno) - requires static import
 * import { writeParquet } from '@tidy-ts/dataframe/ts/verbs/utility';
 *
 * const df = createDataFrame([
 *   { id: 1, name: "Alice", age: 30 },
 *   { id: 2, name: "Bob", age: 25 }
 * ]);
 *
 * writeParquet(df, "./data.parquet");
 *
 * @example
 * // Trigger download in browser
 * writeParquet(df, "data.parquet");
 */
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
 *   - Arrow parsing options (useDate, useBigInt, column selection, etc.)
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
 * // With Arrow parsing options
 * const df = await readArrow("./data.arrow", schema, {
 *   columns: ["id", "name"],
 *   useDate: true,
 *   naStrings: ["NA", "null", ""]
 * });
 */
export const readArrow: ReadArrowFunction = (() => {
  const isNode = currentRuntime === Runtime.Node;
  const isDeno = currentRuntime === Runtime.Deno;
  const isBun = currentRuntime === Runtime.Bun;

  if (isNode || isDeno || isBun) {
    // deno-lint-ignore no-explicit-any
    return async <S extends z.ZodObject<any>>(
      pathOrBuffer: string | ArrayBuffer,
      schema: S,
      opts: ArrowOptions & NAOpts = {},
    ): Promise<DataFrame<z.infer<S>>> => {
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
 * Loads CSV data from a file path (Node.js/Deno) or raw CSV content (all environments)
 * and validates each row against the provided Zod schema. Returns a fully typed
 * DataFrame based on the schema. Automatically detects whether input is a file path
 * or raw CSV content. Throws an error if validation fails.
 *
 * @param pathOrContent - File path (Node.js/Deno) or raw CSV content string
 * @param schema - Zod schema for type validation and conversion. The schema defines
 *   the expected structure and types of each row in the DataFrame. Types are automatically
 *   coerced (e.g., string "123" becomes number 123 for z.number() fields).
 * @param opts - Optional configuration for reading and parsing:
 *   - CSV parsing options (delimiter, quote character, skip lines, etc.)
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
 * const df = await readCSV("./data.csv", schema);
 *
 * @example
 * // Parse from raw CSV content
 * import { z } from "zod";
 *
 * const schema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string().email(),
 *   age: z.number(),
 * });
 *
 * const csvContent = "id,name,email,age\n1,Alice,alice@example.com,25\n2,Bob,bob@example.com,30";
 * const df = await readCSV(csvContent, schema);
 *
 * @example
 * // With NA handling options
 * const df = await readCSV("./data.csv", schema, {
 *   naValues: ["NA", "null", ""],
 *   delimiter: ";",
 *   trim: true
 * });
 */
export const readCSV: ReadCsvFunction = (() => {
  // Always allow the function - it handles environment detection internally
  // deno-lint-ignore no-explicit-any
  return async <S extends z.ZodObject<any>>(
    pathOrContent: string | ArrayBuffer | File | Blob,
    schemaOrOpts?: S | CsvOptions & NAOpts,
    opts?: CsvOptions & NAOpts,
    // deno-lint-ignore no-explicit-any
  ): Promise<DataFrame<z.infer<S>> | DataFrame<any>> => {
    const { readCSV: readCSVImpl } = await import("./read_csv.ts");
    // TypeScript can't properly infer the overload, but the runtime function handles it correctly
    // deno-lint-ignore no-explicit-any
    return readCSVImpl(pathOrContent as any, schemaOrOpts as any, opts);
  };
})();

/**
 * Read a Parquet file or buffer with Zod schema validation and type inference.
 *
 * Loads Parquet data from a file path (Node.js/Deno) or ArrayBuffer (all environments)
 * and validates each row against the provided Zod schema. Returns a fully typed
 * DataFrame based on the schema. Throws an error if validation fails or if used
 * in a browser environment with a file path.
 *
 * @param pathOrBuffer - File path (Node.js/Deno only) or ArrayBuffer containing Parquet data
 * @param schema - Zod schema for type validation and conversion. The schema defines
 *   the expected structure and types of each row in the DataFrame.
 * @param opts - Optional configuration for reading and parsing:
 *   - Parquet parsing options (column selection, row range, etc.)
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
 * // With Parquet parsing options
 * const df = await readParquet("./data.parquet", schema, {
 *   columns: ["id", "name"],
 *   rowStart: 0,
 *   rowEnd: 1000,
 *   naStrings: ["NA", "null", ""]
 * });
 */
export const readParquet: ReadParquetFunction = (() => {
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
 * Write a DataFrame to a CSV file.
 *
 * Converts a DataFrame to CSV format and writes it to a file (Node.js/Deno) or
 * triggers a download (browser). The CSV includes headers and properly escapes
 * values containing commas, quotes, or newlines. Returns the original DataFrame
 * for method chaining.
 *
 * @param df - The DataFrame to write
 * @param path - File path where to save the CSV file. In browsers, this becomes
 *   the download filename.
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
 * await writeCSV(df, "./data.csv");
 *
 * @example
 * // Trigger download in browser
 * await writeCSV(df, "data.csv");
 */
export const writeCSV: WriteCsvFunction = (() => {
  const isNode = currentRuntime === Runtime.Node;
  const isDeno = currentRuntime === Runtime.Deno;
  const isBun = currentRuntime === Runtime.Bun;

  if (isNode || isDeno || isBun) {
    return async <Row extends Record<string, unknown>>(
      df: DataFrame<Row>,
      path: string,
    ) => {
      const { writeCSV } = await import("../verbs/utility/writeCSV.verb.ts");
      writeCSV(df, path);
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
    };
  }
})();

/**
 * Write a DataFrame to a Parquet file.
 *
 * Converts a DataFrame to Parquet format and writes it to a file (Node.js/Deno) or
 * triggers a download (browser). Automatically infers Parquet column types from
 * the DataFrame data (numbers, strings, booleans, dates). Returns the original
 * DataFrame for method chaining.
 *
 * Note: This function is synchronous but requires static import. The dynamically
 * exported version throws an error with instructions to use static import instead.
 *
 * @param df - The DataFrame to write
 * @param path - File path where to save the Parquet file. In browsers, this becomes
 *   the download filename.
 *
 * @returns The original DataFrame for chaining
 *
 * @example
 * // Write to file (Node.js/Deno) - requires static import
 * import { writeParquet } from '@tidy-ts/dataframe/ts/verbs/utility';
 *
 * const df = createDataFrame([
 *   { id: 1, name: "Alice", age: 30 },
 *   { id: 2, name: "Bob", age: 25 }
 * ]);
 *
 * writeParquet(df, "./data.parquet");
 *
 * @example
 * // Trigger download in browser
 * writeParquet(df, "data.parquet");
 */
export const writeParquet: WriteParquetFunction = (() => {
  const isNode = currentRuntime === Runtime.Node;
  const isDeno = currentRuntime === Runtime.Deno;
  const isBun = currentRuntime === Runtime.Bun;

  if (isNode || isDeno || isBun) {
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

interface ReadXLSXOpts extends NAOpts {
  sheet?: string | number;
  skip?: number;
}

type ReadXLSXFunction = {
  (
    pathOrBuffer: string | ArrayBuffer | File | Blob,
    opts: ReadXLSXOpts & { no_types: true },
    // deno-lint-ignore no-explicit-any
  ): Promise<DataFrame<any>>;
  // deno-lint-ignore no-explicit-any
  <S extends z.ZodObject<any>>(
    pathOrBuffer: string | ArrayBuffer | File | Blob,
    schema: S,
    opts: ReadXLSXOpts & { no_types: true },
    // deno-lint-ignore no-explicit-any
  ): Promise<DataFrame<any>>;
  // deno-lint-ignore no-explicit-any
  <S extends z.ZodObject<any>>(
    pathOrBuffer: string | ArrayBuffer | File | Blob,
    schema: S,
    opts?: ReadXLSXOpts,
  ): Promise<DataFrame<z.infer<S>>>;
};

/**
 * Read an XLSX file with Zod schema validation and type inference.
 *
 * Loads XLSX data from a file path (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers)
 * and validates each row against the provided Zod schema. Returns a fully typed DataFrame based on the schema.
 * Automatically converts Excel serial numbers to proper dates and handles NA values. Throws an error if validation fails.
 *
 * @param pathOrBuffer - File path (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers)
 * @param schema - Zod schema for type validation and conversion. The schema defines
 *   the expected structure and types of each row in the DataFrame. Types are automatically
 *   coerced (e.g., string "123" becomes number 123 for z.number() fields, Excel serial
 *   numbers become Date objects for z.date() fields). Optional when `no_types: true` is set.
 * @param opts - Optional configuration including NA handling, sheet selection, and `no_types` option.
 *   When `no_types: true` is set, returns `DataFrame<any>` without schema validation.
 *
 * @returns A Promise resolving to a DataFrame typed according to the schema, or `DataFrame<any>` if `no_types: true`
 *
 * @example
 * // Read from file path (Node.js/Deno)
 * import { z } from "zod";
 *
 * const schema = z.object({
 *   id: z.number().int(),
 *   name: z.string().min(1),
 *   email: z.string().email(),
 *   createdAt: z.date(),  // Excel serial numbers auto-converted to Date
 *   age: z.number().optional(),
 * });
 *
 * const df = await readXLSX("./data.xlsx", schema);
 *
 * @example
 * // Read from ArrayBuffer (browser-compatible)
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 * const arrayBuffer = await file.arrayBuffer();
 * const df = await readXLSX(arrayBuffer, schema);
 *
 * @example
 * // Read from File object (browser-compatible)
 * const df = await readXLSX(file, schema, {
 *   sheet: "Summary",  // Read specific sheet by name
 *   naValues: ["NA", "null", ""],
 *   trim: true
 * });
 *
 * @example
 * // Read from sheet by index (0-based)
 * const df = await readXLSX("./data.xlsx", schema, { sheet: 1 });
 *
 * @example
 * // Read without schema validation using no_types
 * const df = await readXLSX("./data.xlsx", { no_types: true });
 * // Returns DataFrame<any> - useful for dynamic or unknown schemas
 */
export const readXLSX: ReadXLSXFunction = (() => {
  // Always allow the function - it handles environment detection internally
  // deno-lint-ignore no-explicit-any
  return async <S extends z.ZodObject<any>>(
    pathOrBuffer: string | ArrayBuffer | File | Blob,
    schemaOrOpts?: S | ReadXLSXOpts,
    opts?: ReadXLSXOpts,
    // deno-lint-ignore no-explicit-any
  ): Promise<DataFrame<z.infer<S>> | DataFrame<any>> => {
    const { readXLSX: readXLSXImpl } = await import("./read_xlsx.ts");
    // TypeScript can't properly infer the overload, but the runtime function handles it correctly
    // deno-lint-ignore no-explicit-any
    return readXLSXImpl(pathOrBuffer as any, schemaOrOpts as any, opts);
  };
})();

interface WriteXLSXOpts {
  sheet?: string;
}

type WriteXLSXFunction = <Row extends Record<string, unknown>>(
  dataFrame: DataFrame<Row>,
  path: string,
  opts?: WriteXLSXOpts,
) => Promise<void>;

/**
 * Write a DataFrame to an XLSX file.
 *
 * Converts a DataFrame to XLSX format and writes it to a file (Node.js/Deno/Bun only).
 * Automatically handles dates (converts to Excel serial numbers), numbers,
 * strings, and booleans. Supports writing to specific sheets in new or existing files.
 *
 * @param dataFrame - The DataFrame to write
 * @param path - File path where to save the XLSX file
 * @param opts - Optional configuration including sheet name
 *
 * @returns A Promise resolving to void
 *
 * @example
 * // Write to default sheet (Sheet1)
 * const df = createDataFrame([
 *   { id: 1, name: "Alice", age: 30, created: new Date(2024, 0, 1) },
 *   { id: 2, name: "Bob", age: 25, created: new Date(2024, 1, 15) }
 * ]);
 *
 * await writeXLSX(df, "./data.xlsx");
 *
 * @example
 * // Write to specific sheet (adds new or replaces existing)
 * const users = createDataFrame([{ name: "Alice", age: 30 }]);
 * const products = createDataFrame([{ product: "Widget", price: 9.99 }]);
 *
 * await writeXLSX(users, "./data.xlsx", { sheet: "Users" });
 * await writeXLSX(products, "./data.xlsx", { sheet: "Products" });
 */
export const writeXLSX: WriteXLSXFunction = (() => {
  const isNode = currentRuntime === Runtime.Node;
  const isDeno = currentRuntime === Runtime.Deno;
  const isBun = currentRuntime === Runtime.Bun;

  if (isNode || isDeno || isBun) {
    return async <Row extends Record<string, unknown>>(
      dataFrame: DataFrame<Row>,
      path: string,
      opts?: WriteXLSXOpts,
    ) => {
      const { writeXLSX } = await import("./write_xlsx.ts");
      await writeXLSX(dataFrame, path, opts);
    };
  } else {
    return () => {
      throw new Error(
        "writeXLSX is only available in Node.js/Deno environments.",
      );
    };
  }
})();

/**
 * Read metadata about a CSV file without full parsing.
 *
 * Useful for inspecting file structure before deciding how to read it.
 * Shows column headers and a preview of the first few rows.
 *
 * @param pathOrContent - File path to CSV or raw CSV content string
 * @param options - Options for preview (previewRows, comma)
 * @returns Promise resolving to metadata object with headers and row preview
 *
 * @example
 * // Inspect file to see structure
 * const meta = await readCSVMetadata("./data.csv", { previewRows: 3 });
 * console.log("Headers:", meta.headers);
 * console.log("First rows:", meta.firstRows);
 *
 * // Build schema based on headers
 * const schema = z.object({
 *   [meta.headers[0]]: z.number(),
 *   [meta.headers[1]]: z.string(),
 *   // ...
 * });
 * const df = await readCSV("./data.csv", schema);
 */
export const readCSVMetadata: (
  pathOrContent: string | ArrayBuffer | File | Blob,
  options?: { previewRows?: number; comma?: string },
) => Promise<{
  headers: string[];
  totalRows: number;
  firstRows: string[][];
  delimiter: string;
}> = (() => {
  // Always allow the function - it handles environment detection internally
  return async (
    pathOrContent: string | ArrayBuffer | File | Blob,
    options?: { previewRows?: number; comma?: string },
  ) => {
    const { readCSVMetadata } = await import("./read_csv.ts");
    return readCSVMetadata(pathOrContent, options);
  };
})();

/**
 * Read metadata about an XLSX file without full parsing.
 *
 * Useful for inspecting file structure before deciding how to read it.
 * Shows available sheets and a preview of the first few rows.
 *
 * @param pathOrBuffer - File path (Node.js/Deno) or ArrayBuffer/File/Blob (all environments including browsers)
 * @param options - Options for preview (previewRows, sheet)
 * @returns Promise resolving to metadata object with sheets list and row preview
 *
 * @example
 * // Inspect file to see structure (Node.js/Deno)
 * const meta = await readXLSXMetadata("./data.xlsx", { previewRows: 3 });
 * console.log("Available sheets:", meta.sheets);
 * console.log("Headers:", meta.headers);
 * console.log("First rows:", meta.firstRows);
 *
 * @example
 * // Inspect file in browser
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 * const meta = await readXLSXMetadata(file, { previewRows: 3 });
 *
 * // If row 0 looks like a note, use skip: 1
 * const df = await readXLSX(file, schema, { skip: 1 });
 */
export const readXLSXMetadata: (
  pathOrBuffer: string | ArrayBuffer | File | Blob,
  options?: { previewRows?: number; sheet?: string | number },
) => Promise<{
  sheets: { name: string; index: number }[];
  defaultSheet: string;
  sheetName: string;
  headers: string[];
  totalRows: number;
  firstRows: string[][];
}> = (() => {
  // Always allow the function - it handles environment detection internally
  return async (
    pathOrBuffer: string | ArrayBuffer | File | Blob,
    options?: { previewRows?: number; sheet?: string | number },
  ) => {
    const { readXLSXMetadata } = await import("./read_xlsx.ts");
    return readXLSXMetadata(pathOrBuffer, options);
  };
})();
