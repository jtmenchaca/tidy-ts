/**
 * Logical type conversion
 */

import { isNA } from "../../utilities/mod.ts";

const TRUE_SET = new Set(["1", "true", "t", "yes", "y"]);
const FALSE_SET = new Set(["0", "false", "f", "no", "n"]);

/**
 * Coerce a single value to `boolean | null`.
 */
export function as_logical(v: unknown): boolean | null {
  if (isNA(v)) return null;
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  if (TRUE_SET.has(s)) return true;
  if (FALSE_SET.has(s)) return false;
  return null; // unparsable → NA
}
