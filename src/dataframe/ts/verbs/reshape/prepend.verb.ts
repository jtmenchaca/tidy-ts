import { createDataFrame, type DataFrame } from "../../dataframe/index.ts";

/**
 * Add rows to the top of a DataFrame.
 *
 * @param rows - Rows to prepend to the DataFrame
 * @returns A function that takes a DataFrame and returns it with rows prepended
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { name: "Alice", age: 25 },
 *   { name: "Bob", age: 30 }
 * ]);
 *
 * // Prepend new rows
 * const extended = pipe(df, prepend(
 *   { name: "Carol", age: 28 },
 *   { name: "David", age: 32 }
 * ));
 * // Results in 4 rows total with new rows at the beginning
 * ```
 *
 * @remarks
 * - Adds rows to the beginning of the DataFrame
 * - Creates a new DataFrame without modifying the original
 * - New rows must have compatible structure with existing DataFrame
 * - Useful for adding headers, defaults, or priority rows
 */
// Overload for single object
export function prepend<T extends Record<string, unknown>>(
  row: T,
): (df: DataFrame<T>) => DataFrame<T>;

// Overload for array of objects
export function prepend<T extends Record<string, unknown>>(
  rows: T[],
): (df: DataFrame<T>) => DataFrame<T>;

// Overload for multiple individual objects
export function prepend<T extends Record<string, unknown>>(
  ...rows: T[]
): (df: DataFrame<T>) => DataFrame<T>;

export function prepend<T extends Record<string, unknown>>(
  rowOrRows: T | T[] | DataFrame<T> | unknown,
  ...additionalRows: T[]
) {
  return (df: DataFrame<T>): DataFrame<T> => {
    let rowsToAdd: T[];

    // Handle different input types
    if (rowOrRows && typeof rowOrRows === "object" && "nrows" in rowOrRows) {
      // DataFrame input - convert to rows
      rowsToAdd = [...(rowOrRows as DataFrame<T>)];
    } else if (Array.isArray(rowOrRows)) {
      // Single array of objects
      rowsToAdd = rowOrRows;
    } else if (additionalRows.length > 0) {
      // Multiple individual objects
      rowsToAdd = [rowOrRows as T, ...additionalRows];
    } else {
      // Single object
      rowsToAdd = [rowOrRows as T];
    }

    const result: T[] = [...rowsToAdd, ...df];

    return createDataFrame(result) as unknown as DataFrame<T>;
  };
}
