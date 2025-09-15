import { isNA } from "../../utilities/mod.ts";

/**
 * Calculate ranks for an array of values
 *
 * @param values - Array of numbers
 * @param ties - How to handle ties: "average" (default), "min", "max", "dense"
 * @param descending - Whether to rank in descending order (default: false = ascending)
 * @returns Array of ranks (1-based by default)
 *
 * @example
 * ```ts
 * rank([3, 1, 4, 1, 5]) // [3, 1.5, 4, 1.5, 5]
 * rank([3, 1, 4, 1, 5], "average") // [3, 1.5, 4, 1.5, 5]
 * rank([3, 1, 4, 1, 5], "min") // [3, 1, 4, 1, 5]
 * rank([3, 1, 4, 1, 5], "max") // [3, 2, 4, 2, 5]
 * rank([3, 1, 4, 1, 5], "average", true) // descending order
 * ```
 */

/**
 * Find the rank of a specific target value within an array
 *
 * @param values - Array of numbers
 * @param target - The value to find the rank for
 * @param ties - How to handle ties: "average" (default), "min", "max", "dense"
 * @param descending - Whether to rank in descending order (default: false = ascending)
 * @returns Rank of the target value (1-based)
 *
 * @example
 * ```ts
 * rank([3, 1, 4, 1, 5], 3) // 3 (3 is the 3rd smallest value)
 * rank([3, 1, 4, 1, 5], 1) // 1 (1 is the smallest value)
 * rank([3, 1, 4, 1, 5], 5) // 5 (5 is the largest value)
 * ```
 */

export function rank(value: number): number;
export function rank(values: number[]): number[];
export function rank(
  values: (number | null | undefined)[],
  ties?: "average" | "min" | "max" | "dense",
  descending?: boolean,
): (number | null)[];
export function rank(values: Iterable<number>): number[];
export function rank(
  values: Iterable<number | null | undefined>,
  ties?: "average" | "min" | "max" | "dense",
  descending?: boolean,
): (number | null)[];

// Overload for finding rank of a specific target value
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
  tiesOrTarget?: "average" | "min" | "max" | "dense" | number,
  descending?: boolean,
): number | number[] | (number | null)[] | null {
  // Handle single number case
  if (typeof values === "number") {
    return 1;
  }

  // Check if second parameter is a target value (number) or ties method
  const isTargetValue = typeof tiesOrTarget === "number";
  const target = isTargetValue ? tiesOrTarget : undefined;
  const ties = isTargetValue
    ? (descending === true ? "average" : "average")
    : (tiesOrTarget as "average" | "min" | "max" | "dense" | undefined) ||
      "average";
  const isDescending = isTargetValue
    ? (descending || false)
    : (descending || false);

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

  // Create array of { value, index, originalIndex } for ranking
  const indexed = processArray.map((val, i) => ({
    value: val,
    index: i,
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

  // Sort valid values
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

    // Assign ranks based on tie handling method
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

    // Assign the rank to all tied values using originalIndex
    for (let j = 0; j < tieCount; j++) {
      ranks[validValues[i + j].originalIndex] = rankValue;
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
