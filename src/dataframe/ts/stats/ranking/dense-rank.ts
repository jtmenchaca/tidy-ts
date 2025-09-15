/**
 * Calculate dense rank of values (no gaps in ranking).
 *
 * @param values - Array of values to rank
 * @param options - Ranking options
 * @returns Array of dense ranks
 *
 * @example
 * ```ts
 * denseRank([10, 20, 20, 30])  // [1, 2, 2, 3] (no gap after ties)
 * denseRank([5, 3, 8, 3, 1])   // [3, 2, 4, 2, 1]
 *
 * // Descending order
 * denseRank([10, 20, 20, 30], { desc: true })  // [4, 3, 3, 1]
 *
 * // Use in mutate for ranking
 * df.mutate({
 *   dense_rank: row => denseRank(df.score)
 * });
 * ```
 *
 * @remarks
 * - Unlike regular rank, dense rank has no gaps after tied values
 * - If values are [10, 20, 20, 30], regular rank is [1, 2, 2, 4] but dense rank is [1, 2, 2, 3]
 * - Handles null/undefined by assigning them the lowest rank
 * - Useful when you want consecutive rank numbers without gaps
 */

export function denseRank<T>(values: readonly T[]): number[];
export function denseRank<T>(
  values: readonly (T | null | undefined)[],
  options: { desc?: boolean },
): number[];
export function denseRank<T>(
  values: readonly (T | null | undefined)[],
  target: T,
): number | null;
export function denseRank<T>(
  values: readonly (T | null | undefined)[],
  target: T,
  options: { desc?: boolean },
): number | null;

export function denseRank<T>(
  values: readonly (T | null | undefined)[],
  optionsOrTarget?: { desc?: boolean } | T,
  options?: { desc?: boolean },
): number[] | number | null {
  // Check if second parameter is a target value or options
  const isTargetValue = optionsOrTarget !== undefined &&
    (typeof optionsOrTarget === "string" ||
      typeof optionsOrTarget === "number" ||
      typeof optionsOrTarget === "boolean");
  const target = isTargetValue ? optionsOrTarget as T : undefined;
  const desc = isTargetValue
    ? (options?.desc || false)
    : ((optionsOrTarget as { desc?: boolean })?.desc || false);

  // Get unique values and sort them
  const uniqueValues = [
    ...new Set(values.filter((v) => v !== null && v !== undefined)),
  ];
  uniqueValues.sort((a, b) => {
    if (desc) {
      return b < a ? -1 : b > a ? 1 : 0;
    } else {
      return a < b ? -1 : a > b ? 1 : 0;
    }
  });

  // If we're looking for a specific target value, find its rank
  if (isTargetValue && target !== undefined) {
    const rankMap = new Map<T, number>();
    for (let i = 0; i < uniqueValues.length; i++) {
      rankMap.set(uniqueValues[i], i + 1);
    }

    if (target === null || target === undefined) {
      // Assign null/undefined the lowest rank
      return desc ? uniqueValues.length + 1 : 0;
    }

    return rankMap.get(target) ?? null;
  }

  // Create mapping from value to dense rank
  const rankMap = new Map<T, number>();
  for (let i = 0; i < uniqueValues.length; i++) {
    rankMap.set(uniqueValues[i], i + 1);
  }

  // Assign ranks
  return values.map((value) => {
    if (value === null || value === undefined) {
      // Assign null/undefined the lowest rank
      return desc ? uniqueValues.length + 1 : 0;
    }
    return rankMap.get(value) ?? 0;
  });
}
