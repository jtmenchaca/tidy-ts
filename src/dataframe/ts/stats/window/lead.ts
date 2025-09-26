import type { DataFrame } from "../../dataframe/index.ts";

/**
 * Lead values by k positions (shift backward, filling with default).
 *
 * This function supports two usage patterns:
 * 1. Array-based: `lead(values, k, defaultValue)` - returns array with led values
 * 2. Column-based: `lead(columnName, k, defaultValue)` - returns function for use in mutate
 *
 * @param valuesOrColumnName - Array of values to lead OR column name for DataFrame operations
 * @param k - Number of positions to lead (default: 1)
 * @param defaultValue - Value to fill missing positions (default: undefined)
 * @returns Array with values led by k positions OR function for mutate operations
 *
 * @example
 * ```ts
 * // Array-based usage
 * lead([1, 2, 3, 4, 5])  // [2, 3, 4, 5, undefined]
 * lead([1, 2, 3, 4, 5], 2)  // [3, 4, 5, undefined, undefined]
 * lead([1, 2, 3, 4, 5], 1, 0)  // [2, 3, 4, 5, 0]
 *
 * // Column-based usage in mutate (R-like syntax)
 * df.mutate({
 *   next_sales: lead("sales", 1, 0),
 *   next_value: lead("value", 2)
 * });
 *
 * // Use with grouped operations
 * df.group_by("category").mutate({
 *   next_price: lead("price", 1)
 * });
 * ```
 *
 * @remarks
 * - Shifts values backward by k positions
 * - Last k values are filled with defaultValue
 * - Useful for time series analysis and comparing with future values
 * - Often used in grouped operations to lead within groups
 * - Opposite of lag function
 * - Column-based usage provides type-safe column name access
 */

// Array-based overload
export function lead<T>(
  values: readonly T[],
  k?: number,
  defaultValue?: T,
): (T | undefined)[];

// Column-based overload for DataFrame operations
export function lead<
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
export function lead<
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
    throw new Error("Lead k must be non-negative");
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
      const leadValues = leadArray(values, k, defaultValue as any);
      return leadValues[index] as Row[ColName] | undefined;
    };
  } else {
    // Array-based usage - return led array
    return leadArray(valuesOrColumnName as readonly T[], k, defaultValue as T);
  }
}

// Helper function for array-based lead logic
function leadArray<T>(
  values: readonly T[],
  k: number,
  defaultValue?: T,
): (T | undefined)[] {
  if (k === 0) {
    return [...values];
  }

  const result = new Array<T | undefined>(values.length);

  // Copy values shifted by k positions
  for (let i = 0; i < values.length - k; i++) {
    result[i] = values[i + k];
  }

  // Fill last k positions with default value
  for (let i = Math.max(0, values.length - k); i < values.length; i++) {
    result[i] = defaultValue;
  }

  return result;
}
