/**
 * Numeric type conversion
 */

import { isNA } from "../../utilities/mod.ts";
import { parse_number } from "./convert-helpers.ts";

/**
 * Coerce a single value to `number | null`.
 *
 * *  `null` → `null` (keeps NA semantics)
 * *  `undefined` → `null`
 * *  unparsable strings → `null`
 */
export function as_number(v: unknown): number | null {
  if (isNA(v)) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = parse_number(String(v));
  return Number.isFinite(n) ? n : null;
}
