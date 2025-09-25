import type { z } from "zod";
import type { DataFrame } from "./ts/dataframe/index.ts";

export { s, stats } from "./ts/stats/stats.ts";
export { str } from "./ts/stats/strings/str.ts";
export {
  createDataFrame,
  type DataFrame,
  type DataFrameOptions,
  type GroupedDataFrame,
  type PromisedDataFrame,
  type PromisedGroupedDataFrame,
} from "./ts/dataframe/index.ts";

// Import types for proper type checking
import type { CsvOptions } from "./ts/io/read_csv.ts";
import type { NAOpts } from "./ts/io/types.ts";
import type { ArrowOptions } from "./ts/io/read_arrow.ts";
import type { ParquetOptions } from "./ts/io/read_parquet.ts";

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

// Use dynamic imports to conditionally load I/O functions
export const read_arrow: ReadArrowFunction = (() => {
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
      const { read_arrow } = await import("./ts/io/index.ts");
      return read_arrow(pathOrBuffer, schema, opts);
    };
  } else {
    return () => {
      throw new Error(
        "read_arrow is only available in Node.js/Deno environments. Use ArrayBuffer input instead of file paths in browsers.",
      );
    };
  }
})();

export const read_csv: ReadCsvFunction = (() => {
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
      const { read_csv } = await import("./ts/io/index.ts");
      return read_csv(pathOrContent, schema, opts);
    };
  } else {
    return () => {
      throw new Error(
        "read_csv is only available in Node.js/Deno environments. Use string input instead of file paths in browsers.",
      );
    };
  }
})();

export const read_parquet: ReadParquetFunction = (() => {
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
      const { read_parquet } = await import("./ts/io/index.ts");
      return read_parquet(pathOrBuffer, schema, opts);
    };
  } else {
    return () => {
      throw new Error(
        "read_parquet is only available in Node.js/Deno environments. Use ArrayBuffer input instead of file paths in browsers.",
      );
    };
  }
})();

export const write_csv: WriteCsvFunction = (() => {
  // deno-lint-ignore no-process-global
  const isNode = typeof process !== "undefined" && process?.versions?.node;
  const isDeno = typeof Deno !== "undefined";

  if (isNode || isDeno) {
    return async <Row extends Record<string, unknown>>(
      df: DataFrame<Row>,
      path: string,
    ) => {
      const { write_csv } = await import("./ts/verbs/utility/index.ts");
      return write_csv(df, path);
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

export const write_parquet: WriteParquetFunction = (() => {
  // deno-lint-ignore no-process-global
  const isNode = typeof process !== "undefined" && process?.versions?.node;
  const isDeno = typeof Deno !== "undefined";

  if (isNode || isDeno) {
    return <Row extends Record<string, unknown>>(
      _df: DataFrame<Row>,
      _path: string,
    ) => {
      // This is a hack because the write functions are synchronous but we need dynamic imports
      // We'll throw an error suggesting the user to import directly for write operations
      throw new Error(
        "write_parquet requires static import. Use: import { write_parquet } from '@tidy-ts/dataframe/ts/verbs/utility'",
      );
    };
  } else {
    return () => {
      throw new Error(
        "write_parquet is only available in Node.js/Deno environments",
      );
    };
  }
})();
