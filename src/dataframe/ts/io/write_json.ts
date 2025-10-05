// JSON writing utilities for DataFrame export

import * as fs from "node:fs/promises";
import type { DataFrame } from "../dataframe/index.ts";

/**
 * Convert DataFrame to JSON string.
 *
 * Serializes the DataFrame to a JSON string representation.
 * Each row becomes an object in a JSON array.
 *
 * @param options - JSON serialization options
 * @param options.space - Number of spaces for indentation (default: 0, no formatting)
 * @returns JSON string representation of the DataFrame
 *
 * @example
 * ```typescript
 * const df = createDataFrame([
 *   { name: "Alice", age: 25 },
 *   { name: "Bob", age: 30 }
 * ]);
 *
 * const json = df.writeJSON();
 * // '[{"name":"Alice","age":25},{"name":"Bob","age":30}]'
 *
 * const prettyJson = df.writeJSON({ space: 2 });
 * // Formatted JSON with 2-space indentation
 * ```
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
    await fs.writeFile(filePath, jsonContent, "utf8");
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
