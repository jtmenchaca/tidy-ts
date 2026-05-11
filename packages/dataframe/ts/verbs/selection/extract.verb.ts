import { throwColumnNotFound } from "../../utilities/errors.ts";

export function extract(
  column: string,
) {
  return (df: any): any[] => {
    const store = (df as any).__store;
    if (store && store.length > 0 && !(column in store.columns)) {
      throwColumnNotFound(column, store.columnNames);
    }
    const out: any[] = [];
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
export function extract_head(
  column: string,
  n: number,
) {
  return (df: any): any => {
    const store = (df as any).__store;
    if (store && store.length > 0 && !(column in store.columns)) {
      throwColumnNotFound(column, store.columnNames);
    }
    const out: any[] = [];
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
 * Extract the last n values from a column.
 *
 * @param column - The column name to extract
 * @param n - Number of values to extract from the end
 * @returns A function that takes a DataFrame and returns the last n values from the specified column
 *
 * @example
 * ```ts
 * const recentNames = df
 *   .arrange("date")
 *   .extract_tail("name", 2); // ["David", "Eve"]
 * ```
 */
export function extract_tail(
  column: string,
  n: number,
) {
  return (df: any): any => {
    const store = (df as any).__store;
    if (store && store.length > 0 && !(column in store.columns)) {
      throwColumnNotFound(column, store.columnNames);
    }
    const all: any[] = [];
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
export function extract_nth(
  column: string,
  index: number,
) {
  return (df: any): any => {
    const store = (df as any).__store;
    if (store && store.length > 0 && !(column in store.columns)) {
      throwColumnNotFound(column, store.columnNames);
    }
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
export function extract_sample(
  column: string,
  n: number,
) {
  return (df: any): any[] => {
    const store = (df as any).__store;
    if (store && store.length > 0 && !(column in store.columns)) {
      throwColumnNotFound(column, store.columnNames);
    }
    const all: any[] = [];
    for (const row of df) all.push(row[column]);

    // Simple random sampling without replacement
    const sampled: any[] = [];
    const available = [...all];

    for (let i = 0; i < Math.min(n, available.length); i++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      sampled.push(available.splice(randomIndex, 1)[0]);
    }

    return sampled;
  };
}

/**
 * Extract unique values from a column.
 * Functionally equivalent to [...new Set(df.extract("column"))].
 *
 * @param column - The column name to extract unique values from
 * @returns A function that takes a DataFrame and returns an array of unique values from the specified column
 *
 * @example
 * ```ts
 * const uniqueCategories = df.extractUnique("category"); // ["A", "B", "C"]
 * const uniqueAges = df.extractUnique("age"); // [25, 30, 35]
 * ```
 */
export function extract_unique(
  column: string,
) {
  return (df: any): any[] => {
    const store = (df as any).__store;
    if (store && store.length > 0 && !(column in store.columns)) {
      throwColumnNotFound(column, store.columnNames);
    }
    const values: any[] = [];
    for (const row of df) values.push(row[column]);
    return [...new Set(values)];
  };
}
