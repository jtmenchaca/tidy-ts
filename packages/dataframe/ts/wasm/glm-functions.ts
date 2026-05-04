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
  devResids?: string;
  aic?: string;
  muEta?: string;
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
  nRows: number;
  nCols: number;
  columnNames: string[];
  termAssignments: number[];
  rowNames?: string[] | null;
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
  termLabels: string[];
  order: number[];
  intercept: number;
  response: number;
  dataClasses: Record<string, string>;
}

/**
 * GLM control interface
 */
export interface GlmControl {
  epsilon: number;
  maxIter: number;
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
  fittedValues: number[]; // 3. fitted.values
  effects: number[]; // 4. effects
  workingResiduals: number[]; // Additional
  responseResiduals: number[]; // Additional
  pearsonResiduals: number[]; // Additional
  r: number[][]; // 5. R
  rank: number; // 6. rank
  qr: QrDecomposition; // 7. qr

  // Model Information (8-13)
  family: GlmFamilyInfo; // 8. family
  linearPredictors: number[]; // 9. linear.predictors
  deviance: number; // 10. deviance
  aic: number; // 11. aic
  nullDeviance: number; // 12. null.deviance
  iter: number; // 13. iter

  // Weights and Data (14-18)
  weights: number[]; // 14. weights
  priorWeights: number[]; // 15. prior.weights
  dfResidual: number; // 16. df.residual
  dfNull: number; // 17. df.null
  y: number[]; // 18. y

  // Convergence and Control (19-21)
  converged: number; // 19. converged (u8: 0=false, 1=true)
  boundary: number; // 20. boundary (u8: 0=false, 1=true)
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
  modelMatrix: number[][]; // 31. Model design matrix
  modelMatrixDimensions: [number, number]; // 32. Matrix dimensions
  modelMatrixColumnNames: string[]; // 33. Column names
  residualStandardError: number; // 34. Residual standard error
  rSquared: number; // 35. R-squared
  adjustedRSquared: number; // 36. Adjusted R-squared
  devianceExplainedPercent: number; // 37. Deviance explained %
  fStatistic: number; // 38. F-statistic
  fPValue: number; // 39. F p-value
  nObservations: number; // 40. Number of observations
  responseVariableName: string; // 41. Response variable name
  predictorVariableNames: string[]; // 42. Predictor names
  factorLevels: Record<string, string[]>; // 43. Factor levels
  referenceLevels: Record<string, string>; // 44. Reference levels
  dispersionParameter: number; // 45. Dispersion parameter
  devianceResiduals: number[]; // 46. Deviance residuals
  covarianceMatrix: number[][]; // 47. Covariance matrix
  standardErrors: number[]; // 48. Standard errors
  tStatistics: number[]; // 48a. T-statistics
  pValues: number[]; // 48b. P-values
  leverage: number[]; // 49. Leverage values
  cooksDistance: number[]; // 50. Cook's distance

  // Backward compatibility fields
  qrRank: number;
  pivot: number[];
  tol: number;
  pivoted: number; // u8: 0=false, 1=true
  naAction?: string;
  dispersion: number;

  // Pre-computed confidence intervals (computed at fit time to avoid serde_wasm_bindgen round-trip issues)
  confintLower: number[];
  confintUpper: number[];
}

/**
 * GLM family options
 */
export type GlmFamily =
  | "gaussian"
  | "binomial"
  | "quasibinomial"
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
  naAction?: string;
  epsilon?: number;
  maxIter?: number;
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

  let result: GlmFitResult;
  try {
    result = wasmInternal.glm_fit_wasm(
      formula,
      family,
      link,
      dataJson,
      optionsJson,
    ) as GlmFitResult;
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

  return result;
}

/**
 * GLM model class with methods for prediction and diagnostics
 *
 * This class wraps a fitted GLM model and provides methods for:
 * - predict(): Make predictions on new data
 * - More methods coming: residuals(), summary(), etc.
 */
/** Replace null entries with NaN in a numeric array (in-place).
 *  JSON cannot represent NaN, so serde_json serializes f64::NAN as null.
 *  This restores the correct numeric representation. */
// deno-lint-ignore no-explicit-any
function nullsToNaN(arr: any[]): void {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === null) arr[i] = NaN;
  }
}

class GLM<Row extends Record<string, number>> {
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
    // serde_json serializes f64::NAN as null (JSON has no NaN literal).
    // serde_wasm_bindgen preserves NaN natively. Normalize so both
    // backends produce NaN for non-finite values in known numeric fields.
    nullsToNaN(result.coefficients);
    nullsToNaN(result.standardErrors);
    nullsToNaN(result.tStatistics);
    nullsToNaN(result.pValues);
    for (const row of result.covarianceMatrix) nullsToNaN(row);

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
    return this.result.fittedValues;
  }
  get linear_predictors(): number[] {
    return this.result.linearPredictors;
  }
  get deviance(): number {
    return this.result.deviance;
  }
  get aic(): number {
    return this.result.aic;
  }
  get null_deviance(): number {
    return this.result.nullDeviance;
  }
  get df_residual(): number {
    return this.result.dfResidual;
  }
  get df_null(): number {
    return this.result.dfNull;
  }
  get converged(): boolean {
    return this.result.converged !== 0;
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
    return this.result.priorWeights;
  }
  get rank(): number {
    return this.result.rank;
  }
  get leverage(): number[] {
    return this.result.leverage;
  }
  get cooks_distance(): number[] {
    return this.result.cooksDistance;
  }
  get standard_errors(): number[] {
    return this.result.standardErrors;
  }
  get std_errors(): number[] {
    return this.result.standardErrors;
  }
  get p_values(): number[] {
    return this.result.pValues;
  }
  get t_statistics(): number[] {
    return this.result.tStatistics;
  }
  get covariance_matrix(): number[][] {
    return this.result.covarianceMatrix;
  }
  get r(): number[][] {
    return this.result.r;
  }
  get residual_standard_error(): number {
    return this.result.residualStandardError;
  }
  get r_squared(): number {
    return this.result.rSquared;
  }
  get adjusted_r_squared(): number {
    return this.result.adjustedRSquared;
  }
  get dispersion_parameter(): number {
    return this.result.dispersionParameter;
  }
  get model_matrix_dimensions(): [number, number] {
    return this.result.modelMatrixDimensions;
  }
  get model_matrix_column_names(): string[] {
    return this.result.modelMatrixColumnNames;
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
    return this.result.covarianceMatrix;
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
        return this.result.devianceResiduals;
      case "pearson":
        return this.result.pearsonResiduals;
      case "working":
        return this.result.workingResiduals;
      case "response":
        return this.result.responseResiduals;
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
    // Call Rust implementation via WASM (takes JsValue, returns JsValue)
    const summary = wasmInternal.glm_summary_wasm(this.result) as Record<
      string,
      // deno-lint-ignore no-explicit-any
      any
    >;

    // Debug: check for error
    if (summary.error) {
      throw new Error(`Rust summary() failed: ${summary.error}`);
    }

    return {
      coefficients: {
        estimate: summary.estimate,
        std_error: summary.stdError,
        statistic: summary.statistic,
        p_value: summary.pValue,
        names: summary.names,
      },
      dispersion: summary.dispersion,
      null_deviance: this.result.nullDeviance,
      residual_deviance: this.result.deviance,
      df_null: this.result.dfNull,
      df_residual: this.result.dfResidual,
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
    // Call Rust implementation via WASM (takes JsValue, returns JsValue)
    const result = wasmInternal.glm_rstandard_wasm(
      this.result,
      type,
    ) as number[];

    if ((result as unknown as { error?: string }).error) {
      throw new Error(
        `Rust rstandard() failed: ${
          (result as unknown as { error: string }).error
        }`,
      );
    }

    return result;
  }

  /**
   * Compute studentized residuals (leave-one-out)
   *
   * @returns Studentized residuals
   */
  rstudent(): number[] {
    // Call Rust implementation via WASM (takes JsValue, returns JsValue)
    const result = wasmInternal.glm_rstudent_wasm(this.result) as number[];

    if ((result as unknown as { error?: string }).error) {
      throw new Error(
        `Rust rstudent() failed: ${
          (result as unknown as { error: string }).error
        }`,
      );
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
    cooksDistance: number[];
    hat: number[];
  } {
    // Call Rust implementation via WASM (takes JsValue, returns JsValue)
    return wasmInternal.glm_influence_wasm(this.result) as {
      dfbeta: number[][];
      dfbetas: number[][];
      dffits: number[];
      covratio: number[];
      cooksDistance: number[];
      hat: number[];
    };
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
    const residual_df = [this.result.dfNull, this.result.dfResidual];
    const residual_deviance = [this.result.nullDeviance, this.result.deviance];

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
    // Use pre-computed 95% CIs from fit time (avoids serde_wasm_bindgen round-trip issues)
    if (
      level === 0.95 && this.result.confintLower.length > 0 &&
      this.result.confintUpper.length > 0
    ) {
      return {
        names: this.result.modelMatrixColumnNames,
        lower: this.result.confintLower,
        upper: this.result.confintUpper,
      };
    }

    // For non-default levels, fall back to WASM call
    const confint = wasmInternal.glm_confint_wasm(this.result, level) as {
      names: string[];
      lower: number[];
      upper: number[];
      error?: string;
    };

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
    const validTypes = ["link", "response"];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid prediction type '${type}'. Must be one of: ${validTypes.join(", ")}`);
    }

    // If no newdata, return fitted values
    if (!newdata) {
      if (type === "link") {
        return this.result.linearPredictors;
      } else {
        return this.result.fittedValues;
      }
    }

    // Build model matrix for new data
    const predictorNames = this.result.modelMatrixColumnNames;
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

    const predictions = wasmInternal.glm_predict_wasm(
      this.result,
      newdataMatrix,
      type,
    ) as number[] | { error: string };

    if (
      typeof predictions === "object" && !Array.isArray(predictions) &&
      predictions.error
    ) {
      throw new Error(`Rust predict() failed: ${predictions.error}`);
    }

    return predictions as number[];
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
    | "quasibinomial"
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
    naAction?: string;
    epsilon?: number;
    maxIter?: number;
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

  let result: GlmFitResult;
  try {
    result = wasmInternal.glm_fit_wasm(
      formula,
      family,
      link,
      dataJson,
      optionsJson,
    ) as GlmFitResult;
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

  // Return GLM class instance
  return new GLM({
    result,
    formula,
    family,
    link,
    data,
  });
}

/**
 * Result from vcovCL — clustered robust covariance matrix
 */
export interface VcovCLResult {
  /** The robust variance-covariance matrix (p × p) */
  matrix: number[][];
  /** Coefficient names */
  names: string[];
  /** Type of HC correction applied */
  type: string;
  /** Number of clusters */
  nClusters: number;
}

/**
 * Compute clustered robust covariance matrix for a GLM (sandwich::vcovCL).
 *
 * Implements the sandwich estimator: vcov = (1/n) × bread × meat × bread
 * where bread = n × (X'WX)^{-1} × dispersion and meat is the
 * cluster-aggregated outer product of score contributions.
 *
 * @param result - A fitted GlmFitResult (from glmFit or glm().result)
 * @param cluster - Integer cluster IDs, one per observation
 * @param type - HC correction type: "HC0" (default), "HC1", "HC2", or "HC3"
 * @param cadjust - Apply cluster adjustment g/(g-1), default true
 * @param fix - Fix non-positive-definite result, default false
 * @returns VcovCLResult with the robust covariance matrix
 */
export function vcovCL({
  result,
  cluster,
  type = "HC0",
  cadjust = true,
  fix = false,
}: {
  result: GlmFitResult;
  cluster: number[];
  type?: "HC0" | "HC1" | "HC2" | "HC3";
  cadjust?: boolean;
  fix?: boolean;
}): VcovCLResult {
  initWasm();

  // Extract only the fields needed by the sandwich estimator,
  // serialized as JSON to avoid circular reference issues in the
  // full GlmFitResult (family object has circular refs).
  const sandwichInput = JSON.stringify({
    workingResiduals: result.workingResiduals,
    weights: result.weights,
    fittedValues: result.fittedValues,
    modelMatrix: result.modelMatrix,
    r: result.r,
    rank: result.rank,
    familyName: result.family.family,
    dispersionParameter: result.dispersionParameter,
    modelMatrixColumnNames: result.modelMatrixColumnNames,
    pivot: result.qr.pivot,
  });

  try {
    return wasmInternal.glm_vcov_cl_wasm(
      sandwichInput,
      cluster,
      type,
      cadjust,
      fix,
    ) as VcovCLResult;
  } catch (e) {
    throw new Error(`vcovCL error: ${e}`);
  }
}
