import { createDataFrame, type DataFrame } from "../../dataframe/index.ts";

/**
 * Forward fill null/undefined values in specified columns.
 * Replaces null/undefined values with the last non-null value before them.
 *
 * @param columnNames - Column name(s) to forward fill
 * @returns A function that takes a DataFrame and returns a DataFrame with forward-filled values
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { value: 10 },
 *   { value: null },
 *   { value: null },
 *   { value: 20 },
 *   { value: null },
 * ]);
 *
 * const filled = pipe(df, fillForward("value"));
 * // Results in:
 * // [
 * //   { value: 10 },
 * //   { value: 10 },  // filled from previous
 * //   { value: 10 },  // filled from previous
 * //   { value: 20 },
 * //   { value: 20 },  // filled from previous
 * // ]
 * ```
 *
 * @remarks
 * - Only fills null and undefined values
 * - Values at the start that are null/undefined remain null/undefined
 * - Creates a new DataFrame without modifying the original
 */
export function fillForward<T extends Record<string, unknown>>(
  ...columnNames: (keyof T & string)[]
) {
  return (df: DataFrame<T>): DataFrame<T> => {
    const result: T[] = [];
    const lastValues: Map<string, unknown> = new Map();

    for (const row of df) {
      const newRow = { ...row };

      // Forward fill each specified column
      for (const colName of columnNames) {
        const col = colName as keyof T;
        const currentValue = newRow[col];

        if (currentValue === null || currentValue === undefined) {
          // Fill with last non-null value if available
          if (lastValues.has(colName)) {
            newRow[col] = lastValues.get(colName) as T[keyof T];
          }
          // Otherwise leave as null/undefined
        } else {
          // Update last value for this column
          lastValues.set(colName, currentValue);
        }
      }

      result.push(newRow);
    }

    return createDataFrame(result) as unknown as DataFrame<T>;
  };
}
