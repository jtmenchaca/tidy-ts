export type CleanBooleanArray = readonly boolean[];
export type BooleansWithNullable =
  | (boolean | null | undefined)[]
  | readonly (boolean | null | undefined)[];

/** Options for filtering values in all function */
export interface AllOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
}

/**
 * Check if all values in a boolean array are true.
 *
 * @param values - A single boolean or array of booleans
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @returns true if all values are true, false if any is false, or null if no valid values
 *
 * @example
 * ```typescript
 * import { stats } from "@tidy-ts/dataframe";
 *
 * stats.all([true, true, true]); // true
 * stats.all([true, false, true]); // false
 * stats.all([null, true], { removeNull: true }); // true
 * stats.all([]); // null
 * ```
 */

// Single value overload
export function all(value: boolean): boolean;

// Clean array overloads
export function all(values: CleanBooleanArray, options?: AllOptions): boolean;
export function all(values: boolean[], options?: AllOptions): boolean;

// Arrays with nullables - when all removal flags are true, return non-nullable
export function all(
  values: BooleansWithNullable,
  options: { removeNull: true; removeUndefined: true },
): boolean;

// Arrays with only null - removeNull sufficient
export function all(
  values: (boolean | null)[] | readonly (boolean | null)[],
  options: { removeNull: true; removeUndefined?: boolean },
): boolean;

// Arrays with only undefined - removeUndefined sufficient
export function all(
  values: (boolean | undefined)[] | readonly (boolean | undefined)[],
  options: { removeUndefined: true; removeNull?: boolean },
): boolean;

// Arrays with nullables - return nullable when not all flags are true
export function all(
  values: BooleansWithNullable,
  options?: AllOptions,
): boolean | null;

// Implementation
export function all(
  values:
    | boolean
    | CleanBooleanArray
    | BooleansWithNullable,
  options: AllOptions = {},
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
    if (v === false) return false;
  }

  return count > 0 ? true : null;
}
