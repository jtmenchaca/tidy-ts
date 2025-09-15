import { stringify } from "@std/csv/stringify";
import * as fs from "node:fs";
import type { DataFrame } from "../../dataframe/index.ts";

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
export function write_csv<Row extends Record<string, unknown>>(
  dataFrame: DataFrame<Row>,
  filePath: string,
): DataFrame<Row> {
  const csvString = dataFrameToCSV(dataFrame);

  // Use node:fs for file writing (works in both Node.js and Deno)
  try {
    fs.writeFileSync(filePath, csvString, "utf8");
  } catch (error) {
    // Browser environment fallback - trigger download
    if (typeof globalThis !== "undefined" && globalThis.navigator) {
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = globalThis.document.createElement("a");
      a.href = url;
      a.download = filePath.split("/").pop() || "data.csv";
      globalThis.document.body.appendChild(a);
      a.click();
      globalThis.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      throw new Error(`Failed to write file: ${error}`);
    }
  }

  // Return the same DataFrame for chaining
  return dataFrame;
}
