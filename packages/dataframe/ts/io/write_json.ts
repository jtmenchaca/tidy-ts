// JSON writing utilities for DataFrame export

import { writeTextFile } from "@tidy-ts/shims";
import type { DataFrame } from "../dataframe/index.ts";

/**
 * Write a DataFrame to a JSON file.
 *
 * Exports DataFrame data to JSON format, writing to the specified file path.
 * Each row is serialized as an object in a JSON array. Supports custom formatting
 * for NA values and dates. Handles nested DataFrames by converting them to arrays.
 *
 * @param filePath - Path where the JSON file should be written (Node.js/Deno only)
 * @param dataFrame - The DataFrame to export. All rows will be serialized to JSON.
 * @param options - Optional formatting configuration:
 *   - `naValue`: Custom representation for NA/undefined values (default: null in JSON)
 *   - `formatDate`: Custom function for formatting Date objects
 *
 * @returns A Promise that resolves when the file is successfully written
 *
 * @example
 * // Basic JSON export
 * const df = createDataFrame([
 *   { name: "Alice", age: 25, active: true },
 *   { name: "Bob", age: 30, active: false }
 * ]);
 *
 * await writeJSON("./users.json", df);
 *
 * @example
 * // With custom date formatting
 * await writeJSON("./data.json", df, {
 *   formatDate: (date) => date.toISOString().split('T')[0]
 * });
 *
 * @example
 * // Chain with other operations
 * await df
 *   .filter(row => row.active)
 *   .select("name", "email")
 *   .then(filtered => writeJSON("./active_users.json", filtered));
 */
export async function writeJSON<T extends Record<string, unknown>>(
  filePath: string,
  dataFrame: DataFrame<T>,
  options: {
    /** Custom NA representation (default: "") */
    naValue?: string;
    /** Custom date formatting function */
    formatDate?: (date: Date) => string;
  } = {},
): Promise<void> {
  try {
    const jsonContent = dataFrameToJSON(dataFrame, options);
    await writeTextFile(filePath, jsonContent);
  } catch (error) {
    throw new Error(
      `Failed to write JSON file: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Check if a value is a DataFrame by looking for DataFrame-like methods
 */
function isDataFrame(
  value: unknown,
): value is DataFrame<Record<string, unknown>> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  // Check for key DataFrame methods
  return (
    "nrows" in value &&
    "ncols" in value &&
    "toArray" in value &&
    typeof (value as { toArray?: unknown }).toArray === "function"
  );
}

/**
 * Convert a value to a JSON-serializable format, handling nested DataFrames
 */
function convertValue(value: unknown): unknown {
  // Handle DataFrame objects - convert to array
  if (isDataFrame(value)) {
    return value.toArray().map((row) => convertRow(row));
  }

  // Handle arrays - recursively convert elements
  if (Array.isArray(value)) {
    return value.map((item) => convertValue(item));
  }

  // Handle plain objects - recursively convert properties
  if (
    value !== null && typeof value === "object" && value.constructor === Object
  ) {
    return convertRow(value as Record<string, unknown>);
  }

  // Return primitives as-is
  return value;
}

/**
 * Convert a row object, handling nested DataFrames
 */
function convertRow(row: Record<string, unknown>): Record<string, unknown> {
  const converted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    converted[key] = convertValue(value);
  }
  return converted;
}

export function dataFrameToJSON<T extends Record<string, unknown>>(
  dataFrame: DataFrame<T>,
  options: {
    naValue?: string;
    formatDate?: (date: Date) => string;
    space?: number;
  } = {},
): string {
  if (dataFrame.nrows() === 0) {
    return "[]";
  }

  const rows: Record<string, unknown>[] = [];
  for (const row of dataFrame) {
    rows.push(convertRow(row as Record<string, unknown>));
  }

  return JSON.stringify(rows, null, options.space);
}
