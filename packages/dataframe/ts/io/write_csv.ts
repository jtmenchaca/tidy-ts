import { currentRuntime, Runtime, writeTextFileSync } from "@tidy-ts/shims";
import { stringify } from "@std/csv/stringify";
import type { DataFrame } from "../dataframe/index.ts";

/**
 * Convert a DataFrame to CSV string format using @std/csv/stringify
 */
function dataFrameToCSV<T extends Record<string, unknown>>(
  dataFrame: DataFrame<T>,
): string {
  if (dataFrame.nrows() === 0) {
    return "";
  }

  const data = dataFrame.toArray();
  const columns = dataFrame.columns();

  return stringify(data, {
    headers: true,
    columns: columns,
  });
}

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
 * writeCSV(df, "./data.csv");
 *
 * // In browser, this will trigger a download
 * writeCSV(df, "data.csv");
 * ```
 */
function writeCSVImpl<Row extends Record<string, unknown>>(
  dataFrame: DataFrame<Row>,
  filePath: string,
): DataFrame<Row> {
  const csvString = dataFrameToCSV(dataFrame);

  // Use shims for cross-runtime file writing
  try {
    writeTextFileSync(filePath, csvString);
  } catch (error) {
    // Browser environment fallback - trigger download
    if (currentRuntime === Runtime.Browser) {
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filePath.split("/").pop() || "data.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      throw new Error(`Failed to write file: ${error}`);
    }
  }

  // Return the same DataFrame for chaining
  return dataFrame;
}

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
 * writeCSV(df, "./data.csv");
 *
 * // In browser, this will trigger a download
 * writeCSV(df, "data.csv");
 * ```
 */
// Dynamic export with runtime detection
export const writeCSV: <Row extends Record<string, unknown>>(
  df: DataFrame<Row>,
  path: string,
) => Promise<void> = (() => {
  const isNode = currentRuntime === Runtime.Node;
  const isDeno = currentRuntime === Runtime.Deno;
  const isBun = currentRuntime === Runtime.Bun;

  if (isNode || isDeno || isBun) {
    return <Row extends Record<string, unknown>>(
      df: DataFrame<Row>,
      path: string,
    ) => {
      writeCSVImpl(df, path);
      return Promise.resolve();
    };
  } else {
    return <Row extends Record<string, unknown>>(
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
      return new Promise((resolve) => setTimeout(resolve, 100));
    };
  }
})();
