import { isNA } from "../../utilities/mod.ts";

/**
 * Tie-handling methods for `rank`.
 *
 * - `"average"` (default) — fractional ranks for ties (R's classical rank).
 * - `"min"` — competition rank: 1, 2, 2, 4 (skip after tie).
 * - `"max"` — modified competition rank: 1, 3, 3, 4.
 * - `"dense"` — no gap after ties: 1, 2, 2, 3. (Same as `denseRank`.)
 * - `"first"` — strictly unique 1..n; ties broken by original encounter order.
 */
export type RankTies = "average" | "min" | "max" | "dense" | "first";

/**
 * Calculate ranks for an array of values.
 *
 * @example
 * ```ts
 * rank([3, 1, 4, 1, 5])                            // [3, 1.5, 4, 1.5, 5] (default: average)
 * rank([3, 1, 4, 1, 5], { ties: "min" })           // [3, 1, 4, 1, 5]
 * rank([3, 1, 4, 1, 5], { ties: "max" })           // [3, 2, 4, 2, 5]
 * rank([3, 1, 4, 1, 5], { ties: "first" })         // [3, 1, 4, 2, 5] (strictly unique 1..n)
 * rank([3, 1, 4, 1, 5], { ties: "average", desc: true }) // descending
 *
 * // Target lookup (single positional value):
 * rank([3, 1, 4, 1, 5], 3) // 3  (3 is the 3rd smallest value)
 * ```
 */
export function rank(value: number): number;
export function rank(values: number[]): number[];
export function rank(
  values: (number | null | undefined)[],
  options: { ties?: RankTies; desc?: boolean },
): (number | null)[];
export function rank(values: Iterable<number>): number[];
export function rank(
  values: Iterable<number | null | undefined>,
  options: { ties?: RankTies; desc?: boolean },
): (number | null)[];

// Target lookup (positional)
export function rank(values: number[], target: number): number;
export function rank(
  values: (number | null | undefined)[],
  target: number,
): number | null;
export function rank(values: Iterable<number>, target: number): number;
export function rank(
  values: Iterable<number | null | undefined>,
  target: number,
): number | null;

export function rank(
  values:
    | number
    | number[]
    | (number | null | undefined)[]
    | Iterable<number>
    | Iterable<number | null | undefined>,
  optionsOrTarget?: { ties?: RankTies; desc?: boolean } | number,
): number | number[] | (number | null)[] | null {
  // Handle single number case
  if (typeof values === "number") {
    return 1;
  }

  // Disambiguate second argument: target value (number) vs options (object).
  const isTargetValue = typeof optionsOrTarget === "number";
  const target = isTargetValue ? optionsOrTarget : undefined;
  const opts = (!isTargetValue && optionsOrTarget != null
    ? optionsOrTarget
    : {}) as { ties?: RankTies; desc?: boolean };
  const ties: RankTies = opts.ties ?? "average";
  const isDescending = opts.desc ?? false;

  // Handle iterables by materializing to array
  let processArray: (number | null | undefined)[];
  if (Array.isArray(values)) {
    processArray = values;
  } else {
    processArray = Array.from(values as Iterable<number | null | undefined>);
  }

  // If we're looking for a specific target value, find its rank
  if (isTargetValue && target !== undefined) {
    // Filter out NA values for target lookup
    const validValues = processArray.filter((val) => !isNA(val)) as number[];

    if (validValues.length === 0) {
      return null;
    }

    // Count how many values are less than (or greater than if descending) the target
    const comparison = isDescending
      ? validValues.filter((val) => val > target).length
      : validValues.filter((val) => val < target).length;

    // Return 1-based rank
    return comparison + 1;
  }

  // Create array of { value, originalIndex } for ranking
  const indexed = processArray.map((val, i) => ({
    value: val,
    originalIndex: i,
  }));

  // Separate NA and non-NA values
  const naValues: typeof indexed = [];
  const validValues: typeof indexed = [];

  indexed.forEach((item) => {
    if (isNA(item.value)) {
      naValues.push(item);
    } else {
      validValues.push(item);
    }
  });

  // Sort valid values (Array.prototype.sort is stable as of ES2019, so tied
  // entries stay in their original encounter order — needed for ties: "first").
  validValues.sort((a, b) => {
    const aVal = a.value as number;
    const bVal = b.value as number;
    return isDescending ? bVal - aVal : aVal - bVal;
  });

  // Calculate ranks - use full array size
  const ranks = new Array(processArray.length);
  let currentRank = 1;
  let i = 0;

  while (i < validValues.length) {
    const currentValue = validValues[i].value as number;
    let tieCount = 1;

    // Count how many values are tied
    while (
      i + tieCount < validValues.length &&
      validValues[i + tieCount].value === currentValue
    ) {
      tieCount++;
    }

    if (ties === "first") {
      // Strictly unique 1..n ranks: ties broken by original encounter order.
      // Stable sort ensures tied entries are already in ascending originalIndex,
      // so we assign sequential ranks directly.
      for (let j = 0; j < tieCount; j++) {
        ranks[validValues[i + j].originalIndex] = currentRank + j;
      }
    } else {
      // Assign a single shared rank to all tied values based on the method.
      let rankValue: number;
      switch (ties) {
        case "average":
          rankValue = currentRank + (tieCount - 1) / 2;
          break;
        case "min":
          rankValue = currentRank;
          break;
        case "max":
          rankValue = currentRank + tieCount - 1;
          break;
        case "dense":
          rankValue = currentRank;
          break;
        default:
          rankValue = currentRank + (tieCount - 1) / 2;
      }

      for (let j = 0; j < tieCount; j++) {
        ranks[validValues[i + j].originalIndex] = rankValue;
      }
    }

    i += tieCount;
    currentRank = ties === "dense" ? currentRank + 1 : currentRank + tieCount;
  }

  // Handle NA values
  naValues.forEach((item) => {
    ranks[item.originalIndex] = null;
  });

  return ranks;
}
