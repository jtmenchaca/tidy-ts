/**
 * Integer type conversion
 */

import { as_number } from "./as_number.verb.ts";

/**
 * Coerce a single value to `number | null` (integer).
 */
export function as_integer(v: unknown): number | null {
  const n = as_number(v);
  return n === null ? null : Math.trunc(n);
}
