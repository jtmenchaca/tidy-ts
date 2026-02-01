import { createDataFrame, type DataFrame } from "../../dataframe/index.ts";

type ReplacePredicate = (value: unknown) => boolean;

function replaceWithMapping<T extends Record<string, unknown>>(
  df: DataFrame<T>,
  mapping: Partial<{ [K in keyof T]: T[K] }>,
  shouldReplace: ReplacePredicate,
): DataFrame<T> {
  const result: T[] = [];

  for (const row of df) {
    const newRow = { ...row };

    for (const [column, replacement] of Object.entries(mapping)) {
      const col = column as keyof T;
      if (shouldReplace(newRow[col])) {
        newRow[col] = replacement as T[keyof T];
      }
    }

    result.push(newRow);
  }

  return createDataFrame(result) as unknown as DataFrame<T>;
}

/**
 * Replace null values with fixed values in specified columns.
 *
 * @param mapping - Object mapping column names to replacement values
 * @returns A function that takes a DataFrame and returns a DataFrame with nulls replaced
 */
export function replaceNull<T extends Record<string, unknown>>(
  mapping: Partial<{ [K in keyof T]: T[K] }>,
) {
  return (df: DataFrame<T>): DataFrame<T> =>
    replaceWithMapping(df, mapping, (v) => v === null);
}

/**
 * Replace undefined values with fixed values in specified columns.
 *
 * @param mapping - Object mapping column names to replacement values
 * @returns A function that takes a DataFrame and returns a DataFrame with undefined replaced
 */
export function replaceUndefined<T extends Record<string, unknown>>(
  mapping: Partial<{ [K in keyof T]: T[K] }>,
) {
  return (df: DataFrame<T>): DataFrame<T> =>
    replaceWithMapping(df, mapping, (v) => v === undefined);
}

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
 * const cleaned = pipe(df, replaceNA({
 *   name: "Unknown",
 *   age: 0,
 *   score: -1
 * }));
 * ```
 *
 * @remarks
 * - Only replaces null and undefined values
 * - Does not affect other falsy values like 0, false, or ""
 * - Can specify different replacement values for different columns
 * - Creates a new DataFrame without modifying the original
 *
 * @deprecated Use {@link replaceNull} and {@link replaceUndefined} instead.
 */
export function replaceNA<T extends Record<string, unknown>>(
  mapping: Partial<{ [K in keyof T]: T[K] }>,
) {
  return (df: DataFrame<T>): DataFrame<T> =>
    replaceWithMapping(df, mapping, (v) => v === null || v === undefined);
}
