// deno-lint-ignore-file no-explicit-any
import {
  type BasicType,
  parquetWriteBuffer,
  parquetWriteFile,
} from "hyparquet-writer";
import type { DataFrame } from "../../dataframe/index.ts";

/**
 * Convert a DataFrame to Parquet column-oriented format for hyparquet-writer
 */
function dataFrameToColumnData<T extends Record<string, unknown>>(
  dataFrame: DataFrame<T>,
): any[] {
  if (dataFrame.nrows() === 0) {
    return [];
  }

  const data = dataFrame.toArray();
  const columns = dataFrame.columns();

  return columns.map((columnName) => {
    const columnData = data.map((row) => row[columnName]);

    // Determine the Parquet type based on the first non-null value
    let type: BasicType = "STRING"; // default

    for (const value of columnData) {
      if (value != null) {
        if (typeof value === "number") {
          type = Number.isInteger(value) ? "INT32" : "DOUBLE";
        } else if (typeof value === "boolean") {
          type = "BOOLEAN";
        } else if (value instanceof Date) {
          type = "TIMESTAMP";
          // Convert dates to milliseconds for Parquet
          const convertedData = columnData.map((val) =>
            val instanceof Date ? val.getTime() : val === null ? null : val
          );
          return {
            name: columnName,
            data: convertedData,
            type,
          };
        } else {
          type = "STRING";
        }
        break;
      }
    }

    return {
      name: columnName,
      data: columnData,
      type,
    };
  });
}

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
export function write_parquet<Row extends Record<string, unknown>>(
  dataFrame: DataFrame<Row>,
  filePath: string,
): DataFrame<Row> {
  const columnData = dataFrameToColumnData(dataFrame);

  // Use hyparquet-writer for file writing
  try {
    parquetWriteFile({
      filename: filePath,
      columnData,
    });
  } catch (error) {
    // Browser environment fallback - create ArrayBuffer and trigger download
    if (
      typeof globalThis !== "undefined" && globalThis.navigator &&
      globalThis.document
    ) {
      const arrayBuffer = parquetWriteBuffer({ columnData });
      const blob = new Blob([arrayBuffer], {
        type: "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      const a = globalThis.document.createElement("a");
      a.href = url;
      a.download = filePath.split("/").pop() || "data.parquet";
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
