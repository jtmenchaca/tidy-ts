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
 * const json = df.write_json();
 * // '[{"name":"Alice","age":25},{"name":"Bob","age":30}]'
 *
 * const prettyJson = df.write_json({ space: 2 });
 * // Formatted JSON with 2-space indentation
 * ```
 */
export async function write_json<T extends Record<string, unknown>>(
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

  const rows: T[] = [];
  for (const row of dataFrame) {
    rows.push(row);
  }

  return JSON.stringify(rows, null, options.space);
}
