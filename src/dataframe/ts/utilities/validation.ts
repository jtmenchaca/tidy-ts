/**
 * Check if a value is NA (null, undefined, NaN, or string "NA")
 *
 * @param val - Value to check for NA status
 * @returns True if the value is considered NA, false otherwise
 *
 * @example
 * ```ts
 * isNA(null)      // true
 * isNA(undefined) // true
 * isNA(NaN)       // true
 * isNA("NA")      // true
 * isNA(0)         // false
 * isNA("")        // false
 * isNA(false)     // false
 * ```
 */
export function isNA(val: unknown): boolean {
  return val === null || val === undefined ||
    (typeof val === "number" && isNaN(val)) ||
    val === "NA";
}
