import type { DataFrame } from "../dataframe/index.ts";

/**
 * Get the number of rows in a dataset.
 *
 * This function supports two usage patterns:
 * 1. Direct call: count_rows(df) - returns the number of rows
 * 2. In summarise: count_rows() - returns a function that can be used in summarise
 *
 * @param df - The DataFrame to count rows from (optional when used in summarise)
 * @returns Either the row count (direct call) or a function for summarise
 *
 * @example
 * ```ts
 * // Direct usage
 * const rowCount = count_rows(df);
 * console.log(`DataFrame has ${rowCount} rows`);
 *
 * // In summarise expressions
 * df.summarise({ count: count_rows() })
 *
 * // In grouped summarise
 * df.group_by("species").summarise({ count: count_rows() })
 * ```
 */
// Overload for direct usage
export function count_rows<T extends Record<string, unknown>>(
  df: DataFrame<T>,
): number;

// Overload for summarise usage
export function count_rows(): <U extends Record<string, unknown>>(
  df: DataFrame<U>,
) => number;

// Implementation
export function count_rows<T extends Record<string, unknown>>(
  df?: DataFrame<T>,
): number | (<U extends Record<string, unknown>>(df: DataFrame<U>) => number) {
  if (df !== undefined) {
    // Direct call: return the row count
    return df.nrows();
  } else {
    // Used in summarise: return a function that can be called with the group DataFrame
    return <U extends Record<string, unknown>>(
      groupDf: DataFrame<U>,
    ): number => {
      return groupDf.nrows();
    };
  }
}
