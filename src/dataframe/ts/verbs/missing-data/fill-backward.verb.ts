import { createDataFrame, type DataFrame } from "../../dataframe/index.ts";

/**
 * Backward fill null/undefined values in specified columns.
 * Replaces null/undefined values with the next non-null value after them.
 *
 * @param columnNames - Column name(s) to backward fill
 * @returns A function that takes a DataFrame and returns a DataFrame with backward-filled values
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { value: null },
 *   { value: null },
 *   { value: 10 },
 *   { value: null },
 *   { value: 20 },
 * ]);
 *
 * const filled = pipe(df, fillBackward("value"));
 * // Results in:
 * // [
 * //   { value: 10 },  // filled from next
 * //   { value: 10 },  // filled from next
 * //   { value: 10 },
 * //   { value: 20 },  // filled from next
 * //   { value: 20 },
 * // ]
 * ```
 *
 * @remarks
 * - Only fills null and undefined values
 * - Values at the end that are null/undefined remain null/undefined
 * - Creates a new DataFrame without modifying the original
 */
export function fillBackward<T extends Record<string, unknown>>(
  ...columnNames: (keyof T & string)[]
) {
  return (df: DataFrame<T>): DataFrame<T> => {
    const result: T[] = [];
    const rows = Array.from(df);

    // First pass: collect all rows
    for (const row of rows) {
      result.push({ ...row });
    }

    // Second pass: backward fill each specified column
    for (const colName of columnNames) {
      let nextValue: unknown = undefined;

      // Traverse backwards to find next non-null value
      for (let i = result.length - 1; i >= 0; i--) {
        const currentValue = result[i][colName as keyof T];

        if (currentValue === null || currentValue === undefined) {
          // Fill with next non-null value if available
          if (nextValue !== undefined) {
            result[i][colName as keyof T] = nextValue as T[keyof T];
          }
          // Otherwise leave as null/undefined
        } else {
          // Update next value for this column
          nextValue = currentValue;
        }
      }
    }

    return createDataFrame(result) as unknown as DataFrame<T>;
  };
}
