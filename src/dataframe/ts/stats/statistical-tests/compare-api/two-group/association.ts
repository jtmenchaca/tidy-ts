import {
  kendallTest,
  pearsonTest,
  spearmanTest,
} from "../../correlation/index.ts";
import type {
  KendallCorrelationTestResult,
  PearsonCorrelationTestResult,
  SpearmanCorrelationTestResult,
} from "../../../../../lib/tidy_ts_dataframe.js";
import type {
  NumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../../helpers.ts";
import { cleanNumeric, hasManyTies, isNonNormal } from "../helpers.ts";

/**
 * Test association between two continuous variables.
 *
 * Measures and tests the strength of linear (Pearson) or monotonic (Spearman)
 * relationship between two continuous variables.
 *
 * Assumptions:
 * - For Pearson: Variables are continuous and approximately bivariate normal
 * - For Pearson: Relationship is linear
 * - For Spearman: Variables are at least ordinal
 * - For Spearman: Relationship is monotonic
 * - Observations are independent
 *
 * @param x - First variable's values
 * @param y - Second variable's values
 * @param method - Correlation method ("pearson", "spearman", "kendall", or "auto")
 * @param alternative - Test direction ("two-sided", "less", "greater")
 * @param alpha - Significance level (default: 0.05)
 * @returns Correlation coefficient, test statistic, p-value, and confidence intervals
 */
// Overloads for point-biserial (one boolean, one numeric)
export function associationToEachOther({
  x,
  y,
  method,
  alternative,
  alpha,
}: {
  x: readonly boolean[];
  y:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  method?: "pearson" | "auto";
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): PearsonCorrelationTestResult;

export function associationToEachOther({
  x,
  y,
  method,
  alternative,
  alpha,
}: {
  x:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  y: readonly boolean[];
  method?: "pearson" | "auto";
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}): PearsonCorrelationTestResult;

// Standard numeric correlation
export function associationToEachOther({
  x,
  y,
  method,
  alternative,
  alpha,
}: {
  x:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  y:
    | readonly number[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  method?: "pearson" | "spearman" | "kendall" | "auto";
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}):
  | PearsonCorrelationTestResult
  | SpearmanCorrelationTestResult
  | KendallCorrelationTestResult;

export function associationToEachOther({
  x,
  y,
  method = "auto",
  alternative = "two-sided",
  alpha = 0.05,
}: {
  x:
    | readonly number[]
    | readonly boolean[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  y:
    | readonly number[]
    | readonly boolean[]
    | NumberIterable
    | NumbersWithNullable
    | NumbersWithNullableIterable;
  method?: "pearson" | "spearman" | "kendall" | "auto";
  alternative?: "two-sided" | "less" | "greater";
  alpha?: number;
}):
  | PearsonCorrelationTestResult
  | SpearmanCorrelationTestResult
  | KendallCorrelationTestResult {
  // Type-safe data handling
  const xIsBinary = Array.isArray(x) && x.length > 0 &&
    typeof x[0] === "boolean";
  const yIsBinary = Array.isArray(y) && y.length > 0 &&
    typeof y[0] === "boolean";

  let selectedMethod = method;

  if (method === "auto") {
    // Point-biserial: One binary + one numeric
    if (xIsBinary !== yIsBinary) {
      selectedMethod = "pearson";
    } else if (!xIsBinary && !yIsBinary) {
      // Both numeric - clean and test for normality/ties
      const cleanX = cleanNumeric(x as readonly number[]);
      const cleanY = cleanNumeric(y as readonly number[]);

      const smallSample = Math.min(cleanX.length, cleanY.length) < 25;

      if (hasManyTies(cleanX, cleanY) || smallSample) {
        selectedMethod = "kendall";
      } else {
        const xNonNormal = isNonNormal(cleanX);
        const yNonNormal = isNonNormal(cleanY);

        if (xNonNormal || yNonNormal) {
          selectedMethod = "spearman";
        } else {
          selectedMethod = "pearson";
        }
      }
    } else {
      // Both binary - use Pearson (phi coefficient)
      selectedMethod = "pearson";
    }
  }

  // Prepare clean data based on types
  let cleanX: number[], cleanY: number[];

  if (xIsBinary && !yIsBinary) {
    // x is boolean, y is numeric
    cleanX = (x as unknown as readonly boolean[]).map((v) => v ? 1 : 0);
    cleanY = cleanNumeric(y as unknown as readonly number[]);
  } else if (!xIsBinary && yIsBinary) {
    // x is numeric, y is boolean
    cleanX = cleanNumeric(x as unknown as readonly number[]);
    cleanY = (y as unknown as readonly boolean[]).map((v) => v ? 1 : 0);
  } else if (xIsBinary && yIsBinary) {
    // Both boolean
    cleanX = (x as unknown as readonly boolean[]).map((v) => v ? 1 : 0);
    cleanY = (y as unknown as readonly boolean[]).map((v) => v ? 1 : 0);
  } else {
    // Both numeric
    cleanX = cleanNumeric(x as unknown as readonly number[]);
    cleanY = cleanNumeric(y as unknown as readonly number[]);
  }

  // Call the appropriate test
  let rawResult:
    | PearsonCorrelationTestResult
    | SpearmanCorrelationTestResult
    | KendallCorrelationTestResult;
  switch (selectedMethod) {
    case "pearson":
      rawResult = pearsonTest({ x: cleanX, y: cleanY, alternative, alpha });
      break;
    case "spearman":
      rawResult = spearmanTest({ x: cleanX, y: cleanY, alternative, alpha });
      break;
    case "kendall":
      rawResult = kendallTest({ x: cleanX, y: cleanY, alternative, alpha });
      break;
    default:
      throw new Error(`Unknown correlation method: ${selectedMethod}`);
  }

  return rawResult;
}
