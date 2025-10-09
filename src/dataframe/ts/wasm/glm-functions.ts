// GLM functions for WASM

import { initWasm, wasmInternal } from "./wasm-init.ts";
import type { DataFrame } from "../dataframe/index.ts";

/**
 * GLM family information interface
 */
export interface GlmFamilyInfo {
  family: string;
  link: string;
  linkfun?: string;
  linkinv?: string;
  variance?: string;
  dev_resids?: string;
  aic?: string;
  mu_eta?: string;
  initialize?: string;
  validmu?: string;
  valideta?: string;
}

/**
 * QR decomposition interface
 */
export interface QrDecomposition {
  qr: number[][];
  rank: number;
  qraux: number[];
  pivot: number[];
  tol: number;
}

export interface ModelMatrix {
  matrix: number[];
  n_rows: number;
  n_cols: number;
  column_names: string[];
  term_assignments: number[];
  row_names?: string[] | null;
}

/**
 * Model frame interface
 */
export interface ModelFrame {
  y: number[];
  predictors: Record<string, number[]>;
  factors: Record<string, string[]>;
}

/**
 * Terms object interface
 */
export interface TermsObject {
  variables: string[];
  factors: string[];
  term_labels: string[];
  order: number[];
  intercept: number;
  response: number;
  data_classes: Record<string, string>;
}

/**
 * GLM control interface
 */
export interface GlmControl {
  epsilon: number;
  max_iter: number;
  trace: boolean;
}

/**
 * Comprehensive GLM fit result interface
 * Matches the Rust GlmResult structure with all 50+ fields
 */
export interface GlmFitResult {
  // Core Components (1-7) - Direct R GLM components
  coefficients: number[]; // 1. coefficients
  residuals: number[]; // 2. residuals
  fitted_values: number[]; // 3. fitted.values
  effects: number[]; // 4. effects
  working_residuals: number[]; // Additional
  response_residuals: number[]; // Additional
  pearson_residuals: number[]; // Additional
  r: number[][]; // 5. R
  rank: number; // 6. rank
  qr: QrDecomposition; // 7. qr

  // Model Information (8-13)
  family: GlmFamilyInfo; // 8. family
  linear_predictors: number[]; // 9. linear.predictors
  deviance: number; // 10. deviance
  aic: number; // 11. aic
  null_deviance: number; // 12. null.deviance
  iter: number; // 13. iter

  // Weights and Data (14-18)
  weights: number[]; // 14. weights
  prior_weights: number[]; // 15. prior.weights
  df_residual: number; // 16. df.residual
  df_null: number; // 17. df.null
  y: number[]; // 18. y

  // Convergence and Control (19-21)
  converged: boolean; // 19. converged
  boundary: boolean; // 20. boundary
  model: ModelFrame; // 21. model

  // Call and Formula (22-25)
  call: string; // 22. call
  formula: string; // 23. formula
  terms: TermsObject; // 24. terms
  data: string; // 25. data
  x?: ModelMatrix; // 26. x (model matrix)

  // Additional Parameters (26-30)
  offset?: number[]; // 26. offset
  control: GlmControl; // 27. control
  method: string; // 28. method
  contrasts: Record<string, string>; // 29. contrasts
  xlevels: Record<string, string[]>; // 30. xlevels

  // Additional Derived Information (31-50)
  model_matrix: number[][]; // 31. Model design matrix
  model_matrix_dimensions: [number, number]; // 32. Matrix dimensions
  model_matrix_column_names: string[]; // 33. Column names
  residual_standard_error: number; // 34. Residual standard error
  r_squared: number; // 35. R-squared
  adjusted_r_squared: number; // 36. Adjusted R-squared
  deviance_explained_percent: number; // 37. Deviance explained %
  f_statistic: number; // 38. F-statistic
  f_p_value: number; // 39. F p-value
  n_observations: number; // 40. Number of observations
  response_variable_name: string; // 41. Response variable name
  predictor_variable_names: string[]; // 42. Predictor names
  factor_levels: Record<string, string[]>; // 43. Factor levels
  reference_levels: Record<string, string>; // 44. Reference levels
  dispersion_parameter: number; // 45. Dispersion parameter
  deviance_residuals: number[]; // 46. Deviance residuals
  covariance_matrix: number[][]; // 47. Covariance matrix
  standard_errors: number[]; // 48. Standard errors
  t_statistics: number[]; // 48a. T-statistics
  p_values: number[]; // 48b. P-values
  leverage: number[]; // 49. Leverage values
  cooks_distance: number[]; // 50. Cook's distance

  // Backward compatibility fields
  qr_rank: number;
  pivot: number[];
  tol: number;
  pivoted: boolean;
  na_action?: string;
  dispersion: number;
}

/**
 * GLM family options
 */
export type GlmFamily =
  | "gaussian"
  | "binomial"
  | "poisson"
  | "gamma"
  | "inverse_gaussian";

/**
 * GLM link options
 */
export type GlmLink =
  | "identity"
  | "logit"
  | "probit"
  | "cauchit"
  | "log"
  | "cloglog"
  | "inverse"
  | "sqrt"
  | "inverse_squared";

/**
 * GLM options
 */
export interface GlmOptions {
  weights?: number[];
  na_action?: string;
  epsilon?: number;
  max_iter?: number;
  trace?: boolean;
}

/**
 * Fit a GLM model using WASM
 *
 * @param formula - Model formula (e.g., "y ~ x1 + x2")
 * @param family - GLM family name
 * @param link - Link function name
 * @param data - Data object with column names as keys
 * @param options - Optional GLM parameters
 * @returns GLM fit result
 */
export function glmFit(
  formula: string,
  family: GlmFamily,
  link: GlmLink,
  data: Record<string, number[]>,
  options?: GlmOptions,
): GlmFitResult {
  // Convert data to JSON string
  const dataJson = JSON.stringify(data);

  // Convert options to JSON string
  const optionsJson = options ? JSON.stringify(options) : undefined;

  // Initialize WASM and call function
  initWasm();

  let resultJson: string;
  try {
    resultJson = wasmInternal.glm_fit_wasm(
      formula,
      family,
      link,
      dataJson,
      optionsJson,
    );
  } catch (e) {
    // Log more details about the error
    console.error(`WASM Error in glmFit for ${family}/${link}:`, e);
    console.error(`Formula: ${formula}`);
    console.error(`Data keys: ${Object.keys(data).join(", ")}`);
    console.error(
      `Data sample sizes: ${
        Object.entries(data).map(([k, v]) => `${k}:${v.length}`).join(", ")
      }`,
    );
    // Log the actual y values for binomial family
    if (family === "binomial" && data.y) {
      console.error(`Y values: [${data.y.join(", ")}]`);
      console.error(
        `Y range: min=${Math.min(...data.y)}, max=${Math.max(...data.y)}`,
      );
    }
    throw new Error(`[BUG] ${e}`);
  }

  // Parse result
  const result = JSON.parse(resultJson);

  // Check for errors
  if (result.error) {
    throw new Error(`GLM fit failed: ${result.error}`);
  }

  return result as GlmFitResult;
}

/**
 * Fit a GLM model with DataFrame
 *
 * @param formula - Model formula (e.g., "y ~ x1 + x2")
 * @param family - GLM family name
 * @param link - Link function name
 * @param data - DataFrame containing the data
 * @param options - Optional GLM parameters
 * @returns GLM fit result
 */
export function glm<Row extends Record<string, number>>({
  formula,
  family,
  link,
  data,
  options,
}: {
  formula: string;
  family:
    | "gaussian"
    | "binomial"
    | "poisson"
    | "gamma"
    | "inverse_gaussian";
  link:
    | "identity"
    | "logit"
    | "probit"
    | "cauchit"
    | "log"
    | "cloglog"
    | "inverse"
    | "sqrt"
    | "inverse_squared";
  data: DataFrame<Row>;
  options?: {
    weights?: number[];
    na_action?: string;
    epsilon?: number;
    max_iter?: number;
    trace?: boolean;
  };
}): GlmFitResult {
  const dataObject: Record<string, readonly number[]> = {};

  for (const col of data.columns()) {
    dataObject[col] = data[col];
  }

  const dataJson = JSON.stringify(dataObject);

  // Convert options to JSON string
  const optionsJson = options ? JSON.stringify(options) : undefined;

  // Initialize WASM and call function
  initWasm();

  let resultJson: string;
  try {
    resultJson = wasmInternal.glm_fit_wasm(
      formula,
      family,
      link,
      dataJson,
      optionsJson,
    );
  } catch (e) {
    // Log more details about the error
    console.error(`WASM Error in glm for ${family}/${link}:`, e);
    console.error(`Formula: ${formula}`);
    console.error(`Data keys: ${Object.keys(dataObject).join(", ")}`);
    console.error(
      `Data sample sizes: ${
        Object.entries(dataObject).map(([k, v]) => `${k}:${v.length}`).join(
          ", ",
        )
      }`,
    );
    // Log the actual y values for binomial family
    if (family === "binomial" && dataObject.y) {
      console.error(`Y values: [${dataObject.y.join(", ")}]`);
      console.error(
        `Y range: min=${Math.min(...dataObject.y)}, max=${
          Math.max(...dataObject.y)
        }`,
      );
    }
    throw new Error(`[BUG] ${e}`);
  }

  // Parse result
  const result = JSON.parse(resultJson);

  // Check for errors
  if (result.error) {
    throw new Error(`GLM fit failed: ${result.error}`);
  }

  return result as GlmFitResult;
}
