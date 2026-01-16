/**
 * Shared helpers and types for type conversion functions
 */

/** Values we're willing to coerce */
export type Numericish =
  | number
  | `${number}` // template-literal numeric string
  | string // e.g. "$1,234.5"
  | null
  | undefined;

/** Internal: strip everything but digits, sign, decimal point & exponent. */
const STRIP_NUM = /[^0-9eE.+\-]/g;
const STRIP_EXTRADP = /\.([^.]*?)\./g; // keep first decimal point only

export function parse_number(raw: string): number {
  const cleaned = raw
    .replace(STRIP_NUM, "")
    .replace(STRIP_EXTRADP, ".$1");
  if (!/[0-9]/.test(cleaned)) return NaN; // ensures as_number => null
  return Number(cleaned);
}
