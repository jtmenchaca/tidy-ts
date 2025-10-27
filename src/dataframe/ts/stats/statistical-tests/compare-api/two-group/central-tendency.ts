import { tTestIndependent } from "../../t-tests.ts";
import { mannWhitneyTest } from "../../mann-whitney.ts";
import type {
  MannWhitneyTestResult,
  TwoSampleTTestResult,
} from "../../../../../lib/tidy_ts_dataframe.d.ts";
import type {
  NumberIterable,
  NumbersWithNullable,
  NumbersWithNullableIterable,
} from "../../../helpers.ts";
import {
  cleanNumeric,
  hasEqualVariances,
  hasManyTies,
  normalityOK,
  residuals_twoSample,
  smallSample2,
} from "../helpers.ts";
import { LLM } from "../../../../utilities/LLM/LLM.ts";

/**
 * Extended Two Sample T Test Result with optional AI interpretation
 */
type TwoSampleTTestResultWithInterpretation = TwoSampleTTestResult & {
  ai_interpretation?: string;
};

/**
 * Extended Mann-Whitney Test Result with optional AI interpretation
 */
type MannWhitneyTestResultWithInterpretation = MannWhitneyTestResult & {
  ai_interpretation?: string;
};

/**
 * Compare the central tendencies of two independent groups.
 *
 * Tests whether two groups differ in their central tendency using either
 * parametric (t-test) or non-parametric (Mann-Whitney U) methods.
 *
 * Assumptions:
 * - Samples are independent and randomly drawn
 * - For parametric: Data in each group is approximately normally distributed
 * - For parametric: Automatically detects equal/unequal variances using the Brown-Forsythe modification of Levene's test (unless `assumeEqualVariances` is provided)
 * - For non-parametric: Tests stochastic dominance (whether one distribution tends to have larger values)
 *   Note: Only tests medians specifically when distributions have the same shape
 * - Auto mode: Defaults to t-test; switches to Mann-Whitney only if both groups show clear non-normality (p < 0.05)
 *
 * @param x - First group's values
 * @param y - Second group's values
 * @param parametric - Use t-test (true), Mann-Whitney U test (false), or "auto" (default: "auto")
 * @param assumeEqualVariances - Assume equal variances for t-test (optional: if not provided, uses Brown-Forsythe Levene test to auto-detect)
 * @param comparator - Direction of the test ("not equal to", "less than", "greater than"), where "greater than" means x > y
 * @param alpha - Significance level (default: 0.05)
 * @param interpret - If true, adds AI-generated interpretation to the results
 * @returns Test results with statistic, p-value, and effect size (optionally with AI interpretation)
 */

// Overload: parametric with interpret
export async function centralTendencyToEachOther({
  x,
  y,
  parametric,
  assumeEqualVariances,
  comparator,
  alpha,
  interpret,
}: {
  x: readonly number[];
  y: readonly number[];
  parametric: "parametric";
  assumeEqualVariances?: boolean;
  comparator?: "not equal to" | "less than" | "greater than";
  alpha?: number;
  interpret: true;
}): Promise<TwoSampleTTestResultWithInterpretation>;

// Overload: parametric without interpret
export async function centralTendencyToEachOther({
  x,
  y,
  parametric,
  assumeEqualVariances,
  comparator,
  alpha,
  interpret,
}: {
  x: readonly number[];
  y: readonly number[];
  parametric: "parametric";
  assumeEqualVariances?: boolean;
  comparator?: "not equal to" | "less than" | "greater than";
  alpha?: number;
  interpret?: false;
}): Promise<TwoSampleTTestResult>;

// Overload: nonparametric with interpret
export async function centralTendencyToEachOther({
  x,
  y,
  parametric,
  assumeEqualVariances,
  comparator,
  alpha,
  interpret,
}: {
  x: readonly number[];
  y: readonly number[];
  parametric: "nonparametric";
  assumeEqualVariances?: boolean;
  comparator?: "not equal to" | "less than" | "greater than";
  alpha?: number;
  interpret: true;
}): Promise<MannWhitneyTestResultWithInterpretation>;

// Overload: nonparametric without interpret
export async function centralTendencyToEachOther({
  x,
  y,
  parametric,
  assumeEqualVariances,
  comparator,
  alpha,
  interpret,
}: {
  x: readonly number[];
  y: readonly number[];
  parametric: "nonparametric";
  assumeEqualVariances?: boolean;
  comparator?: "not equal to" | "less than" | "greater than";
  alpha?: number;
  interpret?: false;
}): Promise<MannWhitneyTestResult>;

// Overload: auto with interpret (returns Promise)
export async function centralTendencyToEachOther({
  x,
  y,
  parametric,
  assumeEqualVariances,
  comparator,
  alpha,
  interpret,
}: {
  x: readonly number[];
  y: readonly number[];
  parametric?: "parametric" | "nonparametric" | "auto";
  assumeEqualVariances?: boolean;
  comparator?: "not equal to" | "less than" | "greater than";
  alpha?: number;
  interpret: true;
}): Promise<
  | TwoSampleTTestResultWithInterpretation
  | MannWhitneyTestResultWithInterpretation
>;

// Overload: auto without interpret
export async function centralTendencyToEachOther({
  x,
  y,
  parametric,
  assumeEqualVariances,
  comparator,
  alpha,
  interpret,
}: {
  x: readonly number[];
  y: readonly number[];
  parametric?: "parametric" | "nonparametric" | "auto";
  assumeEqualVariances?: boolean;
  comparator?: "not equal to" | "less than" | "greater than";
  alpha?: number;
  interpret?: false;
}): Promise<TwoSampleTTestResult | MannWhitneyTestResult>;

export async function centralTendencyToEachOther({
  x,
  y,
  parametric = "auto",
  assumeEqualVariances,
  comparator = "not equal to",
  alpha = 0.05,
  interpret = false,
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
  parametric?: "parametric" | "nonparametric" | "auto";
  assumeEqualVariances?: boolean;
  comparator?: "not equal to" | "less than" | "greater than";
  alpha?: number;
  interpret?: boolean;
}): Promise<
  | TwoSampleTTestResult
  | MannWhitneyTestResult
  | TwoSampleTTestResultWithInterpretation
  | MannWhitneyTestResultWithInterpretation
> {
  // Convert data to regular arrays and filter out null/undefined/infinite values
  const cleanX = cleanNumeric(x);
  const cleanY = cleanNumeric(y);

  // Map comparator to alternative parameter for underlying functions
  const alternative = comparator === "not equal to"
    ? "two-sided"
    : comparator === "less than"
    ? "less"
    : "greater";

  const nmin = Math.min(cleanX.length, cleanY.length);

  // Determine whether to use parametric test
  let useParametric: boolean;
  if (parametric === "auto") {
    // For large samples (nmin > N_MODERATE_MAX), default to parametric regardless of normality
    if (nmin > 300) { // N_MODERATE_MAX
      useParametric = true;
    } else {
      // For smaller samples, test normality on residuals from each group's mean
      const { rx, ry } = residuals_twoSample(cleanX, cleanY);
      const nonNormal = !normalityOK(rx) || !normalityOK(ry);

      // Use parametric unless both groups show clear non-normality
      useParametric = !nonNormal;
    }
  } else {
    useParametric = parametric === "parametric";
  }

  // Determine variance equality if using parametric test
  const equalVar = useParametric && assumeEqualVariances !== undefined
    ? assumeEqualVariances
    : useParametric
    ? hasEqualVariances([cleanX, cleanY], 0.05)
    : undefined;

  let testResult: TwoSampleTTestResult | MannWhitneyTestResult;

  if (useParametric) {
    // Use independent samples t-test for parametric data
    testResult = tTestIndependent({
      x: cleanX,
      y: cleanY,
      equalVar: equalVar!,
      alternative,
      alpha,
    });
  } else {
    // Use Mann-Whitney U test for non-parametric data
    // Use exact test for small samples without ties
    const useExact = smallSample2(cleanX, cleanY) &&
      !hasManyTies(cleanX, cleanY);

    testResult = mannWhitneyTest({
      x: cleanX,
      y: cleanY,
      exact: useExact,
      continuityCorrection: true,
      alternative,
      alpha,
    });
  }

  // If interpretation is requested, add AI-generated interpretation
  if (interpret) {
    const llm_input = await LLM({
      instructions: `
        You are a helpful assistant that analyzes statistical tests and provides detailed explanations for novices. 
        
        When explaining test statistics, explain not just what they represent but also what the magnitude means:
        - Put the observed value in context by comparing it to typical values or thresholds for that specific test
        - Explain whether the value suggests a small, moderate, or large effect size using standard descriptive categories
        - Reference appropriate benchmarks for the specific statistic (don't use generic thresholds)
        - Use phrases like "for these sample sizes" or "given the degrees of freedom" to contextualize magnitude
        - Avoid subjective value judgments like "meaningful" - use descriptive categorical language instead (small, medium, large)
        
        Also explain:
        - Why the chosen test was appropriate for these data
        - What assumptions underlie the test (e.g., the test ASSUMES groups are independent, ASSUMES normality, ASSUMES equal variances) - use language like "the test assumes..." not "the groups are independent because..."
        - How these choices affect the interpretation
        
        Tone and language:
        - Use neutral, descriptive language (e.g., "large effect" not "meaningful effect" or "important effect")
        - Avoid subjective value judgments - stick to statistical descriptions

        If using a term that could be considered jargon, use the term as appropriate but include a definition of the term in your response.

        Structure your response into sections that align with the relevant sections of the test configuration and test results.
        
        Structure your response in text, not markdown. You only need to include the interpretation in your response. Do not say anything like "Certainly!" or another greeting. Do not offer further follow up questions. This is a one-time response and not a conversation.
      `,
      userInput: `
        INPUT PARAMETERS (user specifications):
        - Test type requested: ${parametric === "auto" ? "auto" : parametric}
        ${
        assumeEqualVariances !== undefined
          ? `- Variance assumption specified: ${
            assumeEqualVariances ? "equal variances" : "unequal variances"
          }`
          : "- Variance assumption: not specified (auto-determined)"
      }
        - Alternative hypothesis: ${comparator}
        - Significance level: ${alpha}
        
        DATA:
        Group x (n=${cleanX.length}): ${cleanX.slice(0, 10).join(", ")}${
        cleanX.length > 10 ? "..." : ""
      }
        Group y (n=${cleanY.length}): ${cleanY.slice(0, 10).join(", ")}${
        cleanY.length > 10 ? "..." : ""
      }
        
        TEST DECISIONS:
        - Test actually performed: ${
        useParametric ? "Independent samples t-test" : "Mann-Whitney U test"
      }
        ${
        useParametric
          ? `- Variance handling: ${
            equalVar
              ? "equal variances (pooled t-test)"
              : "unequal variances (Welch's t-test)"
          }`
          : ""
      }
        
        TEST RESULTS:
        ${JSON.stringify(testResult, null, 2)}
        
        Please analyze the results. Start by explaining what test was performed and why. Then explain what the results mean, including the assumptions of the test.
      `,
    });

    // Add interpretation to the result
    if (useParametric) {
      return {
        ...testResult,
        ai_interpretation: llm_input,
      } as TwoSampleTTestResultWithInterpretation;
    } else {
      return {
        ...testResult,
        ai_interpretation: llm_input,
      } as MannWhitneyTestResultWithInterpretation;
    }
  }

  return testResult;
}
