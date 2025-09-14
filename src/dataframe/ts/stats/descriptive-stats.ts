import { mean } from "./mean.ts";
import { median } from "./median.ts";
import { min } from "./min.ts";
import { max } from "./max.ts";
import { sum } from "./sum.ts";
import { variance } from "./variance.ts";
import { sd } from "./standard-deviation.ts";
import { quartiles } from "./quartiles.ts";
import { range } from "./range.ts";
import { iqr } from "./iqr.ts";
import { mode } from "./mode.ts";
import { uniqueCount } from "./unique-count.ts";
import { isNA } from "../utilities/mod.ts";

/**
 * Comprehensive descriptive statistics for an array of numbers
 *
 * @param values - Array of numbers
 * @returns Object containing all descriptive statistics
 *
 * @example
 * ```ts
 * const stats = descriptiveStats([1, 2, 3, 4, 5]);
 * // { n: 5, mean: 3, median: 3, min: 1, max: 5, ... }
 * ```
 */
export function descriptiveStats(
  values:
    | (number | null | undefined)[]
    | Iterable<number | null | undefined>
    | number
    | null
    | undefined,
) {
  // Handle edge case where R might pass a single value instead of an array
  let valuesArray: (number | null | undefined)[];
  if (Array.isArray(values)) {
    valuesArray = values;
  } else if (typeof values === "number" || values == null) {
    valuesArray = [values];
  } else {
    valuesArray = Array.from(values as Iterable<number | null | undefined>);
  }
  const validValues = valuesArray.filter((val) => !isNA(val)) as number[];
  const n = valuesArray.length;
  const n_valid = validValues.length;
  const n_missing = n - n_valid;

  // Handle empty arrays or no valid values
  if (n === 0) {
    return {
      n: 0,
      n_valid: 0,
      n_missing: 0,
      mean: null,
      median: null,
      min: null,
      max: null,
      sum: 0,
      variance: null,
      std_dev: null,
      q25: null,
      q50: null,
      q75: null,
      range: null,
      iqr: null,
      mode: null,
      mode_count: 0,
      unique_count: 0,
    };
  }

  if (n_valid === 0) {
    return {
      n,
      n_valid: 0,
      n_missing,
      mean: null,
      median: null,
      min: null,
      max: null,
      sum: 0,
      variance: null,
      std_dev: null,
      q25: null,
      q50: null,
      q75: null,
      range: null,
      iqr: null,
      mode: null,
      mode_count: 0,
      unique_count: 0,
    };
  }

  // Calculate quartiles
  const q = quartiles(validValues);

  return {
    n,
    n_valid,
    n_missing,
    mean: mean(validValues),
    median: median(validValues),
    min: min(validValues),
    max: max(validValues),
    sum: sum(validValues),
    variance: variance(validValues),
    std_dev: sd(validValues),
    q25: q?.[0] ?? null,
    q50: q?.[1] ?? null, // same as median
    q75: q?.[2] ?? null,
    range: range(validValues),
    iqr: iqr(validValues),
    mode: mode(validValues),
    unique_count: uniqueCount(validValues),
  };
}
