// deno-lint-ignore-file no-explicit-any
import {
  bool,
  dateMillisecond,
  float64,
  int32,
  tableFromArrays,
  tableToIPC,
  utf8,
} from "@uwdata/flechette";
import type { DataFrame } from "../dataframe/index.ts";
import { writeFile } from "@tidy-ts/shims";

/**
 * Write a DataFrame to an Arrow IPC file (Feather format)
 *
 * @param dataFrame - The DataFrame to write
 * @param filePath - The file path where to save the Arrow file
 * @returns A promise resolving to the original DataFrame for chaining
 *
 * @example
 * ```ts
 * import { createDataFrame } from "tidy-ts/dataframe";
 * import { writeArrow } from "tidy-ts/dataframe/io";
 *
 * const df = createDataFrame([
 *   { id: 1, name: "Alice", age: 30 },
 *   { id: 2, name: "Bob", age: 25 }
 * ]);
 *
 * // Write to file
 * await writeArrow(df, "./data.arrow");
 * ```
 */
export async function writeArrow<Row extends Record<string, unknown>>(
  dataFrame: DataFrame<Row>,
  filePath: string,
): Promise<DataFrame<Row>> {
  // Convert DataFrame to column arrays
  const data = dataFrame.toArray();
  const columns = dataFrame.columns();

  if (dataFrame.nrows() === 0) {
    // Handle empty DataFrame
    const emptyData: Record<string, any[]> = {};
    const types: Record<string, any> = {};

    columns.forEach((col) => {
      emptyData[col] = [];
      types[col] = utf8(); // Default to string for empty columns
    });

    const table = tableFromArrays(emptyData, { types });
    const ipc = tableToIPC(table, {});

    if (ipc) {
      await writeFile(filePath, ipc);
    }
    return dataFrame;
  }

  const columnData: Record<string, any[]> = {};
  const types: Record<string, any> = {};

  // Infer types and prepare data
  columns.forEach((colName) => {
    const values = data.map((row) => row[colName]);
    columnData[colName] = values;

    // Type inference based on first non-null value
    let inferred = false;
    for (const val of values) {
      if (val != null) {
        if (typeof val === "number") {
          if (Number.isInteger(val)) {
            types[colName] = int32();
          } else {
            types[colName] = float64();
          }
        } else if (typeof val === "boolean") {
          types[colName] = bool();
        } else if (val instanceof Date) {
          types[colName] = dateMillisecond();
        } else {
          types[colName] = utf8();
        }
        inferred = true;
        break;
      }
    }

    if (!inferred) {
      types[colName] = utf8(); // Default for all-null columns
    }
  });

  // Create Arrow Table
  const table = tableFromArrays(columnData, { types });

  // Serialize to IPC
  const ipc = tableToIPC(table, {});

  if (!ipc) {
    throw new Error("Failed to serialize Arrow table to IPC format");
  }

  // Write to file
  await writeFile(filePath, ipc);

  return dataFrame;
}
