/**
 * String type conversion
 */

import { isNA } from "../../utilities/mod.ts";

/**
 * Cheap stringify that never throws and never yields `"null" | "undefined"`.
 */
export function as_string(v: unknown): string {
  return isNA(v) ? "" : String(v);
}
