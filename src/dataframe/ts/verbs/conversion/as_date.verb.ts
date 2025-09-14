/**
 * Date type conversion
 */

import { isNA } from "../../utilities/mod.ts";
import { as_number } from "./as_number.verb.ts";

/**
 * Coerce a single value to `Date | null`.
 *
 * Supported formats:
 * - ISO date strings: "YYYY-MM-DD" (strict, no rollover)
 * - ISO timestamps: "YYYY-MM-DDTHH:mm:ss[.sss][Z]" (also supports µs/ns by truncating to ms)
 * - JavaScript timestamps: milliseconds since epoch (or seconds if < 1e12)
 * - Date objects: passed through if valid
 *
 * Note: Bare timestamps without timezone (e.g., "2024-01-02T12:00:00") are interpreted
 * in local time by JavaScript's Date constructor, while "YYYY-MM-DD" strings are treated
 * as UTC midnight for consistency.
 */
export function as_date(v: unknown): Date | null {
  if (isNA(v)) return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v;

  // ISO yyyy-mm-dd (strict, UTC, no rollover)
  if (typeof v === "string") {
    const s = v.trim();

    // Fast path: strict YYYY-MM-DD
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (dateMatch) {
      const y = +dateMatch[1], mo = +dateMatch[2], d = +dateMatch[3];
      const dt = new Date(Date.UTC(y, mo - 1, d));
      if (
        dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 &&
        dt.getUTCDate() === d
      ) {
        return dt;
      }
      return null;
    }

    // ISO timestamp: YYYY-MM-DDTHH:mm:ss[.sss][Z]
    const timestampMatch =
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(?:Z|[+-]\d{2}:\d{2})?$/
        .exec(s);
    if (timestampMatch) {
      // Normalize fractional seconds to milliseconds (JS engines only support up to 3 digits)
      const fracRe = /\.(\d{1,9})/;
      const normalized = fracRe.test(s)
        ? s.replace(fracRe, (_, f) => `.${(f + "000").slice(0, 3)}`)
        : s;
      const dt = new Date(normalized);
      return isNaN(dt.getTime()) ? null : dt;
    }
  }

  // Numeric epoch: heuristic for s / ms / µs / ns
  // < 1e12  → seconds
  // [1e12, 1e14) → milliseconds
  // [1e14, 1e17) → microseconds
  // ≥ 1e17  → nanoseconds
  const n = as_number(v);
  if (n === null) return null;

  // Guard against extreme input values that would be unreasonable even as nanoseconds
  if (Math.abs(n) > 1e19) return null; // Reject extreme input values

  const abs = Math.abs(n);
  const ms = abs < 1e12
    ? n * 1000
    : abs < 1e14
    ? n
    : abs < 1e17
    ? n / 1e3
    : n / 1e6;

  // Guard against extreme epochs that would create invalid dates
  if (Math.abs(ms) > 8.64e15) return null; // ~100 million years

  const dt = new Date(ms);
  return isNaN(dt.getTime()) ? null : dt;
}
