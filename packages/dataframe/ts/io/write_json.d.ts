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
export declare function writeJSON<T extends Record<string, unknown>>(filePath: string, dataFrame: DataFrame<T>, options?: {
    /** Custom NA representation (default: "") */
    naValue?: string;
    /** Custom date formatting function */
    formatDate?: (date: Date) => string;
}): Promise<void>;
export declare function dataFrameToJSON<T extends Record<string, unknown>>(dataFrame: DataFrame<T>, options?: {
    naValue?: string;
    formatDate?: (date: Date) => string;
    space?: number;
}): string;
