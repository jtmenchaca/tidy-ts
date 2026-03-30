import { createDataFrame } from "../../dataframe/index.ts";

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
export function fillForward(
  ...columnNames: string[]
) {
  // deno-lint-ignore no-explicit-any
  return (df: any): any => {
    const result: any[] = [];
    const lastValues: Map<string, unknown> = new Map();

    for (const row of df) {
      const newRow = { ...row };

      // Forward fill each specified column
      for (const colName of columnNames) {
        const currentValue = newRow[colName];

        if (currentValue === null || currentValue === undefined) {
          // Fill with last non-null value if available
          if (lastValues.has(colName)) {
            newRow[colName] = lastValues.get(colName);
          }
          // Otherwise leave as null/undefined
        } else {
          // Update last value for this column
          lastValues.set(colName, currentValue);
        }
      }

      result.push(newRow);
    }

    return createDataFrame(result);
  };
}
