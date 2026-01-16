import { createDataFrame, type DataFrame } from "../../dataframe/index.ts";

/**
 * Replace null/undefined values with fixed values in specified columns.
 *
 * @param mapping - Object mapping column names to replacement values
 * @returns A function that takes a DataFrame and returns a DataFrame with replaced values
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { name: "Alice", age: 25, score: null },
 *   { name: null, age: 30, score: 85 },
 *   { name: "Carol", age: null, score: 92 }
 * ]);
 *
 * // Replace null values with specific defaults
 * const cleaned = pipe(df, replaceNA({
 *   name: "Unknown",
 *   age: 0,
 *   score: -1
 * }));
 * // Results in:
 * // [
 * //   { name: "Alice", age: 25, score: -1 },
 * //   { name: "Unknown", age: 30, score: 85 },
 * //   { name: "Carol", age: 0, score: 92 }
 * // ]
 * ```
 *
 * @remarks
 * - Only replaces null and undefined values
 * - Does not affect other falsy values like 0, false, or ""
 * - Can specify different replacement values for different columns
 * - Creates a new DataFrame without modifying the original
 */
export function replaceNA<T extends Record<string, unknown>>(
  mapping: Partial<{ [K in keyof T]: T[K] }>,
) {
  return (df: DataFrame<T>): DataFrame<T> => {
    const result: T[] = [];

    for (const row of df) {
      const newRow = { ...row };

      // Replace null/undefined values for each column in mapping
      for (const [column, replacement] of Object.entries(mapping)) {
        const col = column as keyof T;
        if (newRow[col] === null || newRow[col] === undefined) {
          newRow[col] = replacement as T[keyof T];
        }
      }

      result.push(newRow);
    }

    return createDataFrame(result) as unknown as DataFrame<T>;
  };
}
