// deno-lint-ignore-file no-explicit-any
import { createDataFrame } from "../../dataframe/index.ts";
import { validateColumnsExist } from "../../utilities/errors.ts";

type ReplacePredicate = (value: unknown) => boolean;

function replaceWithMapping(
  df: any,
  mapping: Record<string, any>,
  shouldReplace: ReplacePredicate,
): any {
  const mappingKeys = Object.keys(mapping);
  const store = df.__store;
  if (store && store.length > 0 && mappingKeys.length > 0) {
    validateColumnsExist(mappingKeys, store.columnNames);
  }

  const result: any[] = [];

  for (const row of df) {
    const newRow = { ...row };

    for (const [column, replacement] of Object.entries(mapping)) {
      if (shouldReplace(newRow[column])) {
        newRow[column] = replacement;
      }
    }

    result.push(newRow);
  }

  return createDataFrame(result);
}

/**
 * Replace null values with fixed values in specified columns.
 *
 * @param mapping - Object mapping column names to replacement values
 * @returns A function that takes a DataFrame and returns a DataFrame with nulls replaced
 */
export function replaceNull(
  mapping: Record<string, any>,
) {
  return (df: any): any =>
    replaceWithMapping(df, mapping, (v) => v === null);
}

/**
 * Replace undefined values with fixed values in specified columns.
 *
 * @param mapping - Object mapping column names to replacement values
 * @returns A function that takes a DataFrame and returns a DataFrame with undefined replaced
 */
export function replaceUndefined(
  mapping: Record<string, any>,
) {
  return (df: any): any =>
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
export function replaceNA(
  mapping: Record<string, any>,
) {
  return (df: any): any =>
    replaceWithMapping(df, mapping, (v) => v === null || v === undefined);
}
