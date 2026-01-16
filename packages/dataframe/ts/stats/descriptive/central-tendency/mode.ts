// Type definitions for number arrays
export type CleanNumberArray = readonly number[];
export type NumbersWithNullable =
  | (number | null | undefined)[]
  | readonly (number | null | undefined)[];

/** Options for filtering values in mode function */
export interface ModeOptions {
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeNaN?: boolean;
}

/**
 * Helper function to calculate mode information from valid numbers
 */
function calculateModeFromNumbers(
  values: number[],
): { value: number; count: number } | null {
  if (values.length === 0) return null;

  const frequency: { [key: number]: number } = {};
  for (const val of values) {
    frequency[val] = (frequency[val] || 0) + 1;
  }

  let modeValue: number | null = null;
  let maxCount = 0;

  for (const [value, count] of Object.entries(frequency)) {
    if (count > maxCount) {
      maxCount = count;
      modeValue = Number(value);
    }
  }

  return modeValue !== null ? { value: modeValue, count: maxCount } : null;
}

/**
 * Calculate the mode (most frequent value) of an array
 *
 * @param values - Array of numbers or single number
 * @param options - Optional object with removal flags
 * @param options.removeNull - If true, filters out null values (default: false)
 * @param options.removeUndefined - If true, filters out undefined values (default: false)
 * @param options.removeNaN - If true, filters out NaN values (default: false)
 * @returns The mode value, or null if no valid values
 *
 * @example
 * ```ts
 * mode(42) // Always returns the single value
 * mode([1, 1, 2, 3, 3, 3]) // 3
 * mode([null, 2, 3]) // null (null present)
 * mode([null, 2, 3], { removeNull: true }) // 2 or 3 (most frequent)
 * mode([1, NaN, 3]) // NaN (NaN propagates)
 * mode([1, NaN, 3], { removeNaN: true }) // 1 or 3
 * ```
 */

// Single value overloads
export function mode(values: number, options?: ModeOptions): number;

// Clean array overloads (no nulls/undefined)
export function mode(values: CleanNumberArray, options?: ModeOptions): number;
export function mode(values: number[], options?: ModeOptions): number;
export function mode(values: Iterable<number>, options?: ModeOptions): number;

// Arrays with nullables - when all removal flags are true, return non-nullable
export function mode(
  values: NumbersWithNullable,
  options: { removeNull: true; removeUndefined: true },
): number;

// Arrays with only null (no undefined) - removeNull sufficient
export function mode(
  values: (number | null)[] | readonly (number | null)[],
  options: { removeNull: true; removeNaN?: boolean; removeUndefined?: boolean },
): number;

// Arrays with only undefined (no null) - removeUndefined sufficient
export function mode(
  values: (number | undefined)[] | readonly (number | undefined)[],
  options: { removeUndefined: true; removeNaN?: boolean; removeNull?: boolean },
): number;

// Arrays with nullables - return nullable when not all flags are true
export function mode(
  values: NumbersWithNullable,
  options?: ModeOptions,
): number | null;

// Implementation
export function mode(
  values:
    | number
    | CleanNumberArray
    | NumbersWithNullable
    | Iterable<number>
    | Iterable<unknown>,
  options: ModeOptions = {},
): number | null {
  const {
    removeNull = false,
    removeUndefined = false,
    removeNaN = false,
  } = options;

  // Handle single number case
  if (typeof values === "number") {
    if (Number.isNaN(values)) {
      return removeNaN ? null : NaN;
    }
    return values;
  }

  // Convert to array
  const processArray = Array.isArray(values) ? values : Array.from(values);

  if (processArray.length === 0) {
    return null;
  }

  // Process with filtering - collect valid numbers
  const validNumbers: number[] = [];
  let foundNaN = false;

  for (const v of processArray) {
    if (v === null) {
      if (!removeNull) return null;
      continue;
    }
    if (v === undefined) {
      if (!removeUndefined) return null;
      continue;
    }
    if (typeof v === "number") {
      if (Number.isNaN(v)) {
        if (!removeNaN) {
          foundNaN = true;
        }
        continue;
      }
      validNumbers.push(v);
    }
  }

  // If we found NaN and didn't remove it, return NaN
  if (foundNaN) {
    return NaN;
  }

  const result = calculateModeFromNumbers(validNumbers);
  return result?.value ?? null;
}

/**
 * Calculate the frequency count of the mode (most frequent value) of an array
 *
 * @param values - Array of numbers
 * @param options - Optional object with removal flags
 * @returns The count of the mode value, or 0 if no valid values
 *
 * @example
 * ```ts
 * modeCount([1, 1, 2, 3, 3, 3]) // 3
 * modeCount([]) // 0
 * ```
 */
export function modeCount(
  values: CleanNumberArray,
  options?: ModeOptions,
): number;
export function modeCount(
  values: NumbersWithNullable,
  options?: ModeOptions,
): number;
export function modeCount(
  values: Iterable<number>,
  options?: ModeOptions,
): number;
export function modeCount(
  values:
    | CleanNumberArray
    | NumbersWithNullable
    | Iterable<number>
    | Iterable<unknown>,
  options: ModeOptions = {},
): number {
  const {
    removeNull = false,
    removeUndefined = false,
    removeNaN = false,
  } = options;

  // Convert to array
  const processArray = Array.isArray(values) ? values : Array.from(values);

  // Collect valid numbers (always filter for modeCount)
  const validNumbers: number[] = [];

  for (const v of processArray) {
    if (v === null && !removeNull) continue;
    if (v === undefined && !removeUndefined) continue;
    if (typeof v === "number") {
      if (Number.isNaN(v) && !removeNaN) continue;
      if (!Number.isNaN(v)) {
        validNumbers.push(v);
      }
    }
  }

  const result = calculateModeFromNumbers(validNumbers);
  return result?.count ?? 0;
}
