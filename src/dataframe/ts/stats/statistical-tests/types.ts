// Import the actual TestResult from WASM
import type { TestResult } from "../../wasm/wasm-loader.ts";
import type { TestName } from "../../wasm/statistical-tests.ts";

/**
 * T-test specific result with guaranteed properties
 */
export interface TTestResult {
  test_statistic: number;
  p_value: number;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  confidence_level: number;
  degrees_of_freedom: number;
  effect_size: number;
  cohens_d: number;
  test_name: TestName;
  alpha?: number;
  error_message?: string;
  mean_difference?: number;
  standard_error?: number;
  test_type?: TestResult["test_type"];
}

/**
 * Correlation test result with guaranteed properties
 */
export interface CorrelationTestResult {
  test_statistic: number;
  p_value: number;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  confidence_level: number;
  correlation: number;
  test_name: TestName;
  alpha?: number;
  error_message?: string;
  test_type?: TestResult["test_type"];
}

/**
 * Chi-square test result with guaranteed properties
 */
export interface ChiSquareTestResult {
  test_statistic: number;
  p_value: number;
  degrees_of_freedom: number;
  cramers_v?: number;
  phi_coefficient?: number;
  test_name: TestName;
  alpha?: number;
  error_message?: string;
  test_type?: TestResult["test_type"];
}

/**
 * ANOVA test result with guaranteed properties
 */
export interface AnovaTestResult {
  test_statistic: number;
  p_value: number;
  f_statistic: number;
  degrees_of_freedom: number;
  eta_squared: number;
  test_name: TestName;
  alpha?: number;
  error_message?: string;
  test_type?: TestResult["test_type"];
}

/**
 * Mann-Whitney test result with guaranteed properties
 */
export interface MannWhitneyTestResult {
  test_statistic: number;
  p_value: number;
  u_statistic: number;
  effect_size: number;
  test_name: TestName;
  alpha?: number;
  error_message?: string;
  test_type?: TestResult["test_type"];
}

/**
 * Wilcoxon test result
 */
export interface WilcoxonTestResult {
  test_statistic: number;
  p_value: number;
  effect_size?: number;
  test_name: TestName;
  alpha?: number;
  error_message?: string;
  test_type?: TestResult["test_type"];
}

/**
 * Kruskal-Wallis test result with guaranteed properties
 */
export interface KruskalWallisTestResult {
  test_statistic: number;
  p_value: number;
  degrees_of_freedom: number;
  eta_squared: number;
  test_name: TestName;
  alpha?: number;
  error_message?: string;
  test_type?: TestResult["test_type"];
}

/**
 * Shapiro-Wilk test result with guaranteed properties
 */
export interface ShapiroWilkTestResult {
  test_statistic: number;
  p_value: number;
  sample_size: number;
  test_name: TestName;
  alpha?: number;
  error_message?: string;
  test_type?: TestResult["test_type"];
}

/**
 * Proportion test result with guaranteed properties
 */
export interface ProportionTestResult {
  test_statistic: number;
  p_value: number;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  confidence_level: number;
  effect_size: number;
  test_name: TestName;
  alpha?: number;
  error_message?: string;
  test_type?: TestResult["test_type"];
}
