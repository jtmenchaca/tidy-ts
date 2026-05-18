import type { DataFrame } from "../dataframe/index.ts";
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
export declare const writeCSV: <Row extends Record<string, unknown>>(df: DataFrame<Row>, path: string) => Promise<void>;
