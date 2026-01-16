// GLM functions for WASM

import { initWasm, wasmInternal } from "./wasm-init.ts";
import type { DataFrame } from "../dataframe/index.ts";

/**
 * Serialize object with special float handling for NaN/Infinity
 */
// deno-lint-ignore no-explicit-any
function encodeWithSpecialFloats(obj: any): string {
  return JSON.stringify(obj, (_, value) => {
    if (typeof value === "number") {
      if (Number.isNaN(value)) return "NaN";
      if (value === Infinity) return "Infinity";
      if (value === -Infinity) return "-Infinity";
    }
    return value;
  });
}

/**
 * Deserialize JSON with special float handling for NaN/Infinity
 */
// deno-lint-ignore no-explicit-any
function decodeWithSpecialFloats(json: string): any {
  return JSON.parse(json, (_, value) => {
    if (value === "NaN") return NaN;
    if (value === "Infinity") return Infinity;
    if (value === "-Infinity") return -Infinity;
    return value;
  });
}

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
 * Fit a GLM model using WASM (internal function for testing)
 *
 * Note: This is the low-level function that returns raw GlmFitResult.
 * For the main API, use glm() which returns a GLM class instance with methods.
 *
 * @param formula - Model formula (e.g., "y ~ x1 + x2")
 * @param family - GLM family name
 * @param link - Link function name
 * @param data - Data object with column names as keys
 * @param options - Optional GLM parameters
 * @returns GLM fit result (raw object)
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

  // Parse result with special float handling
  const result = decodeWithSpecialFloats(resultJson);

  // Check for errors
  if (result.error) {
    throw new Error(`GLM fit failed: ${result.error}`);
  }

  return result as GlmFitResult;
}

/**
 * GLM model class with methods for prediction and diagnostics
 *
 * This class wraps a fitted GLM model and provides methods for:
 * - predict(): Make predictions on new data
 * - More methods coming: residuals(), summary(), etc.
 */
export class GLM<Row extends Record<string, number>> {
  private result: GlmFitResult;
  private formula: string;
  private familyName: string;
  private linkName: string;
  private data: DataFrame<Row>;

  constructor({
    result,
    formula,
    family,
    link,
    data,
  }: {
    result: GlmFitResult;
    formula: string;
    family: string;
    link: string;
    data: DataFrame<Row>;
  }) {
    this.result = result;
    this.formula = formula;
    this.familyName = family;
    this.linkName = link;
    this.data = data;
  }

  // Getters for all result properties
  get coefficients(): number[] {
    return this.result.coefficients;
  }
  get fitted_values(): number[] {
    return this.result.fitted_values;
  }
  get linear_predictors(): number[] {
    return this.result.linear_predictors;
  }
  get deviance(): number {
    return this.result.deviance;
  }
  get aic(): number {
    return this.result.aic;
  }
  get null_deviance(): number {
    return this.result.null_deviance;
  }
  get df_residual(): number {
    return this.result.df_residual;
  }
  get df_null(): number {
    return this.result.df_null;
  }
  get converged(): boolean {
    return this.result.converged;
  }
  get iter(): number {
    return this.result.iter;
  }
  get family(): GlmFamilyInfo {
    return this.result.family;
  }
  get weights(): number[] | undefined {
    return this.result.weights;
  }
  get prior_weights(): number[] | undefined {
    return this.result.prior_weights;
  }
  get rank(): number {
    return this.result.rank;
  }
  get leverage(): number[] {
    return this.result.leverage;
  }
  get cooks_distance(): number[] {
    return this.result.cooks_distance;
  }
  get standard_errors(): number[] {
    return this.result.standard_errors;
  }
  get std_errors(): number[] {
    return this.result.standard_errors;
  }
  get p_values(): number[] {
    return this.result.p_values;
  }
  get t_statistics(): number[] {
    return this.result.t_statistics;
  }
  get covariance_matrix(): number[][] {
    return this.result.covariance_matrix;
  }
  get r(): number[][] {
    return this.result.r;
  }
  get residual_standard_error(): number {
    return this.result.residual_standard_error;
  }
  get r_squared(): number {
    return this.result.r_squared;
  }
  get adjusted_r_squared(): number {
    return this.result.adjusted_r_squared;
  }
  get dispersion_parameter(): number {
    return this.result.dispersion_parameter;
  }
  get model_matrix_dimensions(): [number, number] {
    return this.result.model_matrix_dimensions;
  }
  get model_matrix_column_names(): string[] {
    return this.result.model_matrix_column_names;
  }

  /**
   * Get variance-covariance matrix of the parameters
   *
   * Returns the covariance matrix of the estimated coefficients.
   * For GLM, this is the scaled covariance matrix (cov.scaled in R).
   *
   * @returns Variance-covariance matrix as 2D array
   */
  vcov(): number[][] {
    return this.result.covariance_matrix;
  }

  /**
   * Extract different types of residuals
   *
   * @param type - Type of residuals to extract:
   *   - "deviance": Deviance residuals (default)
   *   - "pearson": Pearson residuals
   *   - "working": Working residuals
   *   - "response": Response residuals (y - fitted)
   * @returns Array of residuals
   */
  residuals({
    type = "deviance",
  }: {
    type?: "deviance" | "pearson" | "working" | "response";
  } = {}): number[] {
    switch (type) {
      case "deviance":
        return this.result.deviance_residuals;
      case "pearson":
        return this.result.pearson_residuals;
      case "working":
        return this.result.working_residuals;
      case "response":
        return this.result.response_residuals;
      default:
        throw new Error(`Unknown residual type: ${type}`);
    }
  }

  /**
   * Get model summary with coefficient table
   *
   * Returns formatted summary with coefficients, standard errors, z/t-values, and p-values
   *
   * @returns Summary object with coefficient table and model statistics
   */
  summary(): {
    coefficients: {
      estimate: number[];
      std_error: number[];
      statistic: number[];
      p_value: number[];
      names: string[];
    };
    dispersion: number;
    null_deviance: number;
    residual_deviance: number;
    df_null: number;
    df_residual: number;
    aic: number;
    family: string;
    link: string;
  } {
    // Call Rust implementation via WASM
    const resultJson = JSON.stringify(this.result);
    const summaryJson = wasmInternal.glm_summary_wasm(resultJson);
    const summary = JSON.parse(summaryJson);

    // Debug: check for error
    if (summary.error) {
      throw new Error(`Rust summary() failed: ${summary.error}`);
    }

    return {
      coefficients: {
        estimate: summary.estimate,
        std_error: summary.std_error,
        statistic: summary.statistic,
        p_value: summary.p_value,
        names: summary.names,
      },
      dispersion: summary.dispersion,
      null_deviance: this.result.null_deviance,
      residual_deviance: this.result.deviance,
      df_null: this.result.df_null,
      df_residual: this.result.df_residual,
      aic: this.result.aic,
      family: this.result.family.family,
      link: this.result.family.link,
    };
  }

  /**
   * Compute standardized residuals
   *
   * @param type - Type of residuals: "deviance" (default) or "pearson"
   * @returns Standardized residuals
   */
  rstandard(
    { type = "deviance" }: { type?: "deviance" | "pearson" } = {},
  ): number[] {
    // Call Rust implementation via WASM
    const resultJson = JSON.stringify(this.result);
    const rstandJson = wasmInternal.glm_rstandard_wasm(resultJson, type);
    const result = JSON.parse(rstandJson);

    if (result.error) {
      throw new Error(`Rust rstandard() failed: ${result.error}`);
    }

    return result;
  }

  /**
   * Compute studentized residuals (leave-one-out)
   *
   * @returns Studentized residuals
   */
  rstudent(): number[] {
    // Call Rust implementation via WASM
    const resultJson = JSON.stringify(this.result);
    const rstudJson = wasmInternal.glm_rstudent_wasm(resultJson);
    const result = JSON.parse(rstudJson);

    if (result.error) {
      throw new Error(`Rust rstudent() failed: ${result.error}`);
    }

    return result;
  }

  /**
   * Compute influence measures
   *
   * Returns dfbeta, dfbetas, dffits, covratio, cook.d, and hat values
   *
   * @returns Object with influence measures
   */
  influence(): {
    dfbeta: number[][];
    dfbetas: number[][];
    dffits: number[];
    covratio: number[];
    cooks_distance: number[];
    hat: number[];
  } {
    // Call Rust implementation via WASM
    const resultJson = JSON.stringify(this.result);
    const influenceJson = wasmInternal.glm_influence_wasm(resultJson);
    return JSON.parse(influenceJson);
  }

  /**
   * Analysis of deviance table (single model)
   *
   * NOTE: This is a placeholder implementation. Full sequential analysis of deviance
   * requires refitting the model multiple times with different subsets of predictors,
   * which is not yet implemented. This would require exposing the GLM fitting algorithm
   * to TypeScript and managing the original data and formula.
   *
   * For now, this returns the null and full model deviances only.
   *
   * @returns Deviance table with null and full model statistics only
   */
  anova(): {
    terms: string[];
    df: number[];
    deviance: number[];
    residual_df: number[];
    residual_deviance: number[];
  } {
    // Return only NULL and full model (no sequential term analysis)
    const terms = ["NULL"];
    const df = [0];
    const deviance = [0];
    const residual_df = [this.result.df_null, this.result.df_residual];
    const residual_deviance = [this.result.null_deviance, this.result.deviance];

    return {
      terms,
      df,
      deviance,
      residual_df,
      residual_deviance,
    };
  }

  /**
   * Compute confidence intervals for coefficients
   *
   * @param level - Confidence level (default: 0.95 for 95% CI)
   * @returns Object with names, lower, and upper bounds
   */
  confint({ level = 0.95 }: { level?: number } = {}): {
    names: string[];
    lower: number[];
    upper: number[];
  } {
    const resultJson = encodeWithSpecialFloats(this.result);
    const confintJson = wasmInternal.glm_confint_wasm(resultJson, level);
    const confint = decodeWithSpecialFloats(confintJson);

    if (confint.error) {
      throw new Error(`Rust confint() failed: ${confint.error}`);
    }

    return confint;
  }

  /**
   * Make predictions on new data
   *
   * @param newdata - DataFrame with same predictor columns as training data
   * @param options - Prediction options
   * @returns Array of predictions
   */
  predict<NewRow extends Record<string, unknown> = Row>(
    newdata?: DataFrame<NewRow>,
    options: { type?: "link" | "response" } = {},
  ): number[] {
    const type = options.type || "response";

    // If no newdata, return fitted values
    if (!newdata) {
      if (type === "link") {
        return this.result.linear_predictors;
      } else {
        return this.result.fitted_values;
      }
    }

    // Build model matrix for new data
    const predictorNames = this.result.model_matrix_column_names;
    const nRows = newdata.nrows();
    const nCols = predictorNames.length;

    const newdataMatrix: number[][] = [];
    const newdataArray = newdata.toArray();

    for (let i = 0; i < nRows; i++) {
      const row: number[] = [];
      const dataRow = newdataArray[i];
      for (let j = 0; j < nCols; j++) {
        const colName = predictorNames[j];
        if (colName === "(Intercept)") {
          row.push(1);
        } else {
          if (!(colName in dataRow)) {
            throw new Error(`Column '${colName}' not found in newdata`);
          }
          row.push(dataRow[colName] as number);
        }
      }
      newdataMatrix.push(row);
    }

    // Call Rust predict function
    const resultJson = encodeWithSpecialFloats(this.result);
    const newdataJson = JSON.stringify(newdataMatrix);
    const predictionsJson = wasmInternal.glm_predict_wasm(
      resultJson,
      newdataJson,
      type,
    );
    const predictions = decodeWithSpecialFloats(predictionsJson);

    if (predictions.error) {
      throw new Error(`Rust predict() failed: ${predictions.error}`);
    }

    return predictions;
  }

  /**
   * Get the raw result object (for advanced users or debugging)
   */
  getRawResult(): GlmFitResult {
    return this.result;
  }
}

/**
 * Fit a GLM model with DataFrame (primary API)
 *
 * Returns a GLM class instance with methods for prediction and diagnostics.
 * For low-level access to raw results, use glmFit() instead.
 *
 * @param formula - Model formula (e.g., "y ~ x1 + x2")
 * @param family - GLM family name
 * @param link - Link function name
 * @param data - DataFrame containing the data
 * @param options - Optional GLM parameters
 * @returns GLM model instance with predict() and other methods
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
}): GLM<Row> {
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

  // Return GLM class instance
  return new GLM({
    result: result as GlmFitResult,
    formula,
    family,
    link,
    data,
  });
}
