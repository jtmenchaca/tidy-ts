export type CleanBooleanArray = readonly boolean[];
export type BooleansWithNullable =
  | (boolean | null | undefined)[]
  | readonly (boolean | null | undefined)[];

/** Options for filtering values in any function */
export interface AnyOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
}

/**
 * Check if any value in a boolean array is true.
 *
 * @param values - A single boolean or array of booleans
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @returns true if any value is true, false if all are false, or null if no valid values
 *
 * @example
 * ```typescript
 * import { stats } from "@tidy-ts/dataframe";
 *
 * stats.any([true, false, false]); // true
 * stats.any([false, false, false]); // false
 * stats.any([null, true], { removeNull: true }); // true
 * stats.any([]); // null
 * ```
 */

// Single value overload
export function any(value: boolean): boolean;

// Clean array overloads
export function any(values: CleanBooleanArray, options?: AnyOptions): boolean;
export function any(values: boolean[], options?: AnyOptions): boolean;

// Arrays with nullables - when all removal flags are true, return non-nullable
export function any(
  values: BooleansWithNullable,
  options: { removeNull: true; removeUndefined: true },
): boolean;

// Arrays with only null - removeNull sufficient
export function any(
  values: (boolean | null)[] | readonly (boolean | null)[],
  options: { removeNull: true; removeUndefined?: boolean },
): boolean;

// Arrays with only undefined - removeUndefined sufficient
export function any(
  values: (boolean | undefined)[] | readonly (boolean | undefined)[],
  options: { removeUndefined: true; removeNull?: boolean },
): boolean;

// Arrays with nullables - return nullable when not all flags are true
export function any(
  values: BooleansWithNullable,
  options?: AnyOptions,
): boolean | null;

// Implementation
export function any(
  values:
    | boolean
    | CleanBooleanArray
    | BooleansWithNullable,
  options: AnyOptions = {},
): boolean | null {
  const { removeNull = false, removeUndefined = false } = options;

  if (typeof values === "boolean") {
    return values;
  }

  const processArray = Array.isArray(values) ? values : Array.from(values);

  if (processArray.length === 0) {
    return null;
  }

  let count = 0;

  for (const v of processArray) {
    if (v === null) {
      if (!removeNull) return null;
      continue;
    }
    if (v === undefined) {
      if (!removeUndefined) return null;
      continue;
    }
    count++;
    if (v === true) return true;
  }

  return count > 0 ? false : null;
}
