import type { DataFrame } from "../../dataframe/index.ts";

/**
 * Lag values by k positions (shift forward, filling with default).
 *
 * This function supports two usage patterns:
 * 1. Array-based: `lag(values, k, defaultValue)` - returns array with lagged values
 * 2. Column-based: `lag(columnName, k, defaultValue)` - returns function for use in mutate
 *
 * @param valuesOrColumnName - Array of values to lag OR column name for DataFrame operations
 * @param k - Number of positions to lag (default: 1)
 * @param defaultValue - Value to fill missing positions (default: undefined)
 * @returns Array with values lagged by k positions OR function for mutate operations
 *
 * @example
 * ```ts
 * // Array-based usage
 * lag([1, 2, 3, 4, 5])  // [undefined, 1, 2, 3, 4]
 * lag([1, 2, 3, 4, 5], 2)  // [undefined, undefined, 1, 2, 3]
 * lag([1, 2, 3, 4, 5], 1, 0)  // [0, 1, 2, 3, 4]
 *
 * // Column-based usage in mutate (R-like syntax)
 * df.mutate({
 *   prev_sales: lag("sales", 1, 0),
 *   prev_value: lag("value", 2)
 * });
 *
 * // Use with grouped operations
 * df.group_by("category").mutate({
 *   prev_price: lag("price", 1)
 * });
 * ```
 *
 * @remarks
 * - Shifts values forward by k positions
 * - First k values are filled with defaultValue
 * - Useful for time series analysis and comparing with previous values
 * - Often used in grouped operations to lag within groups
 * - Column-based usage provides type-safe column name access
 */

// Array-based overload
export function lag<T>(
  values: readonly T[],
  k?: number,
  defaultValue?: T,
): (T | undefined)[];

// Column-based overload for DataFrame operations
export function lag<
  Row extends Record<string, unknown>,
  ColName extends keyof Row,
>(
  columnName: ColName,
  k?: number,
  defaultValue?: Row[ColName],
): (
  row: Row,
  index: number,
  df: DataFrame<Row>,
) => Row[ColName] | undefined;

// Implementation
export function lag<
  T,
  Row extends Record<string, unknown>,
  ColName extends keyof Row,
>(
  valuesOrColumnName: readonly T[] | ColName,
  k: number = 1,
  defaultValue?: T | Row[ColName],
):
  | (T | undefined)[]
  | ((
    row: Row,
    index: number,
    df: DataFrame<Row>,
  ) => Row[ColName] | undefined) {
  if (k < 0) {
    throw new Error("Lag k must be non-negative");
  }

  // Check if first argument is a string (column name) or array
  if (typeof valuesOrColumnName === "string") {
    // Column-based usage - return function for mutate
    return (
      _row: Row,
      index: number,
      df: DataFrame<Row>,
    ) => {
      // deno-lint-ignore no-explicit-any
      const values = df.extract(valuesOrColumnName as any);
      // deno-lint-ignore no-explicit-any
      const laggedValues = lagArray(values, k, defaultValue as any);
      return laggedValues[index] as Row[ColName] | undefined;
    };
  } else {
    // Array-based usage - return lagged array
    return lagArray(valuesOrColumnName as readonly T[], k, defaultValue as T);
  }
}

// Helper function for array-based lag logic
function lagArray<T>(
  values: readonly T[],
  k: number,
  defaultValue?: T,
): (T | undefined)[] {
  if (k === 0) {
    return [...values];
  }

  const result = new Array<T | undefined>(values.length);

  // Fill first k positions with default value
  for (let i = 0; i < Math.min(k, values.length); i++) {
    result[i] = defaultValue;
  }

  // Copy values shifted by k positions
  for (let i = k; i < values.length; i++) {
    result[i] = values[i - k];
  }

  return result;
}
