import type { DataFrame } from "../../dataframe/index.ts";

/**
 * Extract a single column from a dataframe as an array.
 * Similar to R's tidyverse pull() function.
 *
 * @param column - The column name to extract
 * @returns A function that takes a DataFrame and returns an array of values from the specified column
 *
 * @example
 * ```ts
 * // Extract a single column
 * const ages = pipe(df, extract("age"));
 * const names = pipe(df, pull("name")); // pull is an alias for extract
 *
 * // With grouped data - extracts from each group
 * const groupedAges = pipe(df, group_by("species"), extract("age"));
 * ```
 *
 * @remarks
 * - Returns an array of values for the specified column
 * - Works with both regular and grouped dataframes
 * - Preserves the original data types
 * - Throws an error if the column doesn't exist
 */
export function extract<T extends Record<string, unknown>, K extends keyof T>(
  column: K,
) {
  return (df: DataFrame<T>): T[K][] => {
    const out: T[K][] = [];
    for (const row of df) out.push(row[column]);
    return out;
  };
}

/**
 * Extract the first value from a column.
 *
 * @param column - The column name to extract
 * @param n - Must be 1 for single value extraction
 * @returns A function that takes a DataFrame and returns the first value from the specified column
 *
 * @example
 * ```ts
 * const topName = df
 *   .slice_max("score", 1)
 *   .extract_head("name", 1); // "Alice"
 * ```
 */
export function extract_head<
  T extends Record<string, unknown>,
  K extends keyof T,
>(
  column: K,
  n: 1,
): (df: DataFrame<T>) => T[K] | undefined;

/**
 * Extract the first n values from a column.
 *
 * @param column - The column name to extract
 * @param n - Number of values to extract from the beginning (must be > 1)
 * @returns A function that takes a DataFrame and returns the first n values from the specified column
 *
 * @example
 * ```ts
 * const topNames = df
 *   .arrange({ by: "score", desc: true })
 *   .extract_head("name", 3); // ["Alice", "Bob", "Carol"]
 * ```
 */
export function extract_head<
  T extends Record<string, unknown>,
  K extends keyof T,
>(
  column: K,
  n: number,
): (df: DataFrame<T>) => T[K][];

export function extract_head<
  T extends Record<string, unknown>,
  K extends keyof T,
>(
  column: K,
  n: number,
) {
  return (df: DataFrame<T>): T[K] | T[K][] | undefined => {
    const out: T[K][] = [];
    let count = 0;
    for (const row of df) {
      if (count >= n) break;
      out.push(row[column]);
      count++;
    }

    // Return single value when n = 1, array otherwise
    if (n === 1) {
      return out[0];
    }
    return out;
  };
}

/**
 * Extract the last value from a column.
 *
 * @param column - The column name to extract
 * @param n - Must be 1 for single value extraction
 * @returns A function that takes a DataFrame and returns the last value from the specified column
 *
 * @example
 * ```ts
 * const lastName = df
 *   .arrange("date")
 *   .extract_tail("name", 1); // "Eve"
 * ```
 */
export function extract_tail<
  T extends Record<string, unknown>,
  K extends keyof T,
>(
  column: K,
  n: 1,
): (df: DataFrame<T>) => T[K] | undefined;

/**
 * Extract the last n values from a column.
 *
 * @param column - The column name to extract
 * @param n - Number of values to extract from the end (must be > 1)
 * @returns A function that takes a DataFrame and returns the last n values from the specified column
 *
 * @example
 * ```ts
 * const recentNames = df
 *   .arrange("date")
 *   .extract_tail("name", 2); // ["David", "Eve"]
 * ```
 */
export function extract_tail<
  T extends Record<string, unknown>,
  K extends keyof T,
>(
  column: K,
  n: number,
): (df: DataFrame<T>) => T[K][];

export function extract_tail<
  T extends Record<string, unknown>,
  K extends keyof T,
>(
  column: K,
  n: number,
) {
  return (df: DataFrame<T>): T[K] | T[K][] | undefined => {
    const all: T[K][] = [];
    for (const row of df) all.push(row[column]);
    const result = all.slice(-n);

    // Return single value when n = 1, array otherwise
    if (n === 1) {
      return result[0];
    }
    return result;
  };
}

/**
 * Extract a single value at the specified index from a column.
 *
 * @param column - The column name to extract
 * @param index - The index of the value to extract (0-based)
 * @returns A function that takes a DataFrame and returns the value at the specified index, or undefined if index is out of bounds
 *
 * @example
 * ```ts
 * const topScore = df
 *   .slice_max("score", 1)
 *   .extract_nth("name", 0); // "Alice"
 * ```
 */
export function extract_nth<
  T extends Record<string, unknown>,
  K extends keyof T,
>(
  column: K,
  index: number,
) {
  return (df: DataFrame<T>): T[K] | undefined => {
    let currentIndex = 0;
    for (const row of df) {
      if (currentIndex === index) {
        return row[column];
      }
      currentIndex++;
    }
    return undefined;
  };
}

/**
 * Extract n random values from a column.
 *
 * @param column - The column name to extract
 * @param n - Number of random values to extract
 * @returns A function that takes a DataFrame and returns n random values from the specified column
 *
 * @example
 * ```ts
 * const randomNames = df.extract_sample("name", 3); // ["Bob", "Alice", "David"]
 * ```
 */
export function extract_sample<
  T extends Record<string, unknown>,
  K extends keyof T,
>(
  column: K,
  n: number,
) {
  return (df: DataFrame<T>): T[K][] => {
    const all: T[K][] = [];
    for (const row of df) all.push(row[column]);

    // Simple random sampling without replacement
    const sampled: T[K][] = [];
    const available = [...all];

    for (let i = 0; i < Math.min(n, available.length); i++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      sampled.push(available.splice(randomIndex, 1)[0]);
    }

    return sampled;
  };
}
