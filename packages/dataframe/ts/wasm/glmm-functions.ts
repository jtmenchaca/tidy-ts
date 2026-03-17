// GLMM functions for WASM

import { initWasm, wasmInternal } from "./wasm-init.ts";
import type { DataFrame } from "../dataframe/index.ts";

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
 * GLMM family options
 */
export type GlmmFamily =
  | "gaussian"
  | "binomial"
  | "poisson"
  | "gamma"
  | "inverse_gaussian"
  | "nbinom2"
  | "nbinom1";

/**
 * GLMM link options
 */
export type GlmmLink =
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
 * Random effect specification
 */
export interface RandomEffectSpec {
  /** Grouping variable name (e.g., "patient", "clinic") */
  grouping_var: string;
  /** Terms in the random effect (e.g., ["1"] for intercept, ["1", "time"] for slope) */
  terms: string[];
  /** Covariance structure type (optional) */
  covariance?: "independent" | "unstructured" | "compound_symmetry";
}

/**
 * GLMM control options
 */
export interface GlmmControl {
  /** Maximum iterations for outer optimization */
  max_iter?: number;
  /** Convergence tolerance */
  tolerance?: number;
  /** Use REML estimation (default: true) */
  reml?: boolean;
  /** Print progress information */
  verbose?: boolean;
}

/**
 * Variance component estimate
 */
export interface VarianceComponent {
  /** Name of the grouping variable */
  group_name: string;
  /** Names of random effect terms */
  term_names: string[];
  /** Variance-covariance matrix */
  vcov: number[][];
  /** Standard deviations */
  std_dev: number[];
  /** Correlation matrix (if applicable) */
  correlation?: number[][];
  /** Standard errors of variance parameters */
  std_errors?: number[];
}

/**
 * Random effect estimates (BLUPs)
 */
export interface RandomEffectEstimates {
  /** Name of the grouping variable */
  group_name: string;
  /** Term names */
  term_names: string[];
  /** Group identifiers */
  group_ids: string[];
  /** BLUP estimates: n_groups x n_terms matrix */
  estimates: number[][];
  /** Conditional standard errors */
  std_errors?: number[][];
  /** Conditional variance-covariance */
  conditional_vcov?: number[][][];
}

/**
 * GLMM fit summary
 */
export interface GlmmFitSummary {
  /** Number of observations */
  n_observations: number;
  /** Number of fixed effect parameters */
  n_fixed: number;
  /** Number of random effect parameters */
  n_random: number;
  /** Number of variance parameters */
  n_variance_params: number;
  /** Residual degrees of freedom */
  df_residual: number;
  /** Number of groups per random effect */
  n_groups: Record<string, number>;
  /** Method used (ML or REML) */
  method: string;
}

/**
 * GLMM fit result interface
 */
export interface GlmmFitResult {
  /** Fixed effect coefficients */
  coefficients: number[];
  /** Fixed effect standard errors */
  standard_errors: number[];
  /** Fixed effect names */
  coefficient_names: string[];
  /** Variance component estimates */
  variance_components: VarianceComponent[];
  /** Random effect estimates (BLUPs) */
  blups: RandomEffectEstimates[];
  /** Residual variance */
  residual_variance: number;
  /** Log-likelihood at convergence */
  log_likelihood: number;
  /** REML criterion (if REML was used) */
  reml_criterion?: number;
  /** AIC */
  aic: number;
  /** BIC */
  bic: number;
  /** Theta parameters (variance component parameterization) */
  theta: number[];
  /** Standard errors of theta */
  theta_se?: number[];
  /** Number of outer iterations */
  outer_iterations: number;
  /** Whether optimization converged */
  converged: boolean;
  /** Convergence message */
  convergence_message: string;
  /** Formula used */
  formula: string;
  /** Fit summary statistics */
  fit_summary: GlmmFitSummary;
  /** Raw GLM result for fixed effects */
  glm_result: {
    coefficients: number[];
    standard_errors: number[];
    model_matrix_column_names: string[];
    deviance: number;
    fitted_values: number[];
    linear_predictors: number[];
  };
}

/**
 * GLMM class with methods for fitted model
 */
export class GLMM<Row extends Record<string, number | string>> {
  private result: GlmmFitResult;
  private _formula: string;
  private _randomEffects: RandomEffectSpec[];
  private familyName: string;
  private linkName: string;
  private data: DataFrame<Row>;

  constructor({
    result,
    formula,
    randomEffects,
    family,
    link,
    data,
  }: {
    result: GlmmFitResult;
    formula: string;
    randomEffects: RandomEffectSpec[];
    family: string;
    link: string;
    data: DataFrame<Row>;
  }) {
    this.result = result;
    this._formula = formula;
    this._randomEffects = randomEffects;
    this.familyName = family;
    this.linkName = link;
    this.data = data;
  }

  // Getters for result properties
  /** Fixed effect coefficients */
  get coefficients(): number[] {
    return this.result.glm_result.coefficients;
  }

  /** Fixed effect standard errors */
  get std_errors(): number[] {
    return this.result.glm_result.standard_errors;
  }

  /** Coefficient names */
  get coefficient_names(): string[] {
    return this.result.glm_result.model_matrix_column_names;
  }

  /** Variance components */
  get variance_components(): VarianceComponent[] {
    return this.result.variance_components;
  }

  /** Random effect BLUPs */
  get blups(): RandomEffectEstimates[] {
    return this.result.blups;
  }

  /** Log-likelihood */
  get loglik(): number {
    return this.result.log_likelihood;
  }

  /** AIC */
  get aic(): number {
    return this.result.aic;
  }

  /** BIC */
  get bic(): number {
    return this.result.bic;
  }

  /** Convergence status */
  get converged(): boolean {
    return this.result.converged;
  }

  /** Number of outer iterations */
  get iterations(): number {
    return this.result.outer_iterations;
  }

  /** Model formula */
  get formula(): string {
    return this._formula;
  }

  /** Random effects specification */
  get randomEffects(): RandomEffectSpec[] {
    return this._randomEffects;
  }

  /** Fit summary */
  get summary(): GlmmFitSummary {
    return this.result.fit_summary;
  }

  /**
   * Get the variance for a specific random effect grouping factor
   * @param groupName - Name of the grouping variable
   */
  getVariance(groupName: string): VarianceComponent | undefined {
    return this.result.variance_components.find(
      (vc) => vc.group_name === groupName,
    );
  }

  /**
   * Get the BLUPs for a specific grouping factor
   * @param groupName - Name of the grouping variable
   */
  getBlups(groupName: string): RandomEffectEstimates | undefined {
    return this.result.blups.find((b) => b.group_name === groupName);
  }

  /**
   * Get the raw result object
   */
  getRawResult(): GlmmFitResult {
    return this.result;
  }

  /**
   * Print a formatted summary of the model
   */
  print(): void {
    console.log("\nGeneralized Linear Mixed Model\n");
    console.log(`Formula: ${this._formula}`);
    console.log(`Family: ${this.familyName}, Link: ${this.linkName}`);
    console.log(
      `Method: ${this.result.fit_summary.method}, Converged: ${this.result.converged}\n`,
    );

    console.log("Fixed Effects:");
    const names = this.coefficient_names;
    const coefs = this.coefficients;
    const ses = this.std_errors;
    for (let i = 0; i < names.length; i++) {
      console.log(
        `  ${names[i].padEnd(15)} ${coefs[i].toFixed(4).padStart(10)}  (SE: ${
          ses[i].toFixed(4)
        })`,
      );
    }

    console.log("\nVariance Components:");
    for (const vc of this.result.variance_components) {
      console.log(`  ${vc.group_name}:`);
      for (let i = 0; i < vc.term_names.length; i++) {
        console.log(
          `    ${vc.term_names[i].padEnd(12)} SD: ${vc.std_dev[i].toFixed(4)}`,
        );
      }
    }

    console.log(`\nLog-Likelihood: ${this.result.log_likelihood.toFixed(4)}`);
    console.log(`AIC: ${this.result.aic.toFixed(4)}`);
    console.log(`BIC: ${this.result.bic.toFixed(4)}`);
    console.log(`Observations: ${this.result.fit_summary.n_observations}`);
    console.log(`Groups: ${JSON.stringify(this.result.fit_summary.n_groups)}`);
  }
}

/**
 * Fit a Generalized Linear Mixed Model
 *
 * @param formula - Fixed effects formula (e.g., "y ~ x1 + x2")
 * @param randomEffects - Array of random effect specifications
 * @param family - GLM family name
 * @param link - Link function name
 * @param data - DataFrame containing the data
 * @param options - Optional control parameters
 * @returns GLMM model instance
 *
 * @example
 * ```typescript
 * import { glmm, createDataFrame } from "@tidy-ts/dataframe";
 *
 * const data = createDataFrame({
 *   columns: {
 *     y: [1.2, 2.3, 1.5, 2.8, ...],
 *     x: [0, 1, 0, 1, ...],
 *     group: [1, 1, 2, 2, ...],
 *   },
 * });
 *
 * const model = glmm({
 *   formula: "y ~ x",
 *   randomEffects: [{ grouping_var: "group", terms: ["1"] }],
 *   family: "gaussian",
 *   link: "identity",
 *   data,
 * });
 *
 * console.log(model.coefficients);
 * console.log(model.variance_components);
 * model.print();
 * ```
 */
export function glmm<Row extends Record<string, number | string>>({
  formula,
  randomEffects,
  family,
  link,
  data,
  options,
}: {
  formula: string;
  randomEffects: RandomEffectSpec[];
  family: GlmmFamily;
  link: GlmmLink;
  data: DataFrame<Row>;
  options?: GlmmControl;
}): GLMM<Row> {
  // Convert data to object format
  const dataObject: Record<string, number[]> = {};
  for (const col of data.columns()) {
    const values = data[col] as readonly (number | string)[];
    // Convert to numbers
    dataObject[col] = values.map((v) =>
      typeof v === "number" ? v : parseFloat(String(v))
    );
  }

  const dataJson = JSON.stringify(dataObject);
  const randomEffectsJson = JSON.stringify(randomEffects);
  const optionsJson = options ? JSON.stringify(options) : undefined;

  // Initialize WASM and call function
  initWasm();

  let resultJson: string;
  try {
    resultJson = wasmInternal.glmm_fit_wasm(
      formula,
      randomEffectsJson,
      family,
      link,
      dataJson,
      optionsJson,
    );
  } catch (e) {
    console.error(`WASM Error in glmm for ${family}/${link}:`, e);
    console.error(`Formula: ${formula}`);
    console.error(`Random effects: ${randomEffectsJson}`);
    throw new Error(`[BUG] ${e}`);
  }

  // Parse result with special float handling
  const result = decodeWithSpecialFloats(resultJson);

  // Check for errors
  if (result.error) {
    throw new Error(`GLMM fit failed: ${result.error}`);
  }

  // Return GLMM class instance
  return new GLMM({
    result: result as GlmmFitResult,
    formula,
    randomEffects,
    family,
    link,
    data,
  });
}

/**
 * Low-level GLMM fitting function that returns raw result object
 *
 * @param formula - Fixed effects formula
 * @param randomEffects - Random effect specifications
 * @param family - GLM family name
 * @param link - Link function name
 * @param data - Data object with column names as keys
 * @param options - Optional control parameters
 * @returns Raw GLMM fit result
 */
export function glmmFit(
  formula: string,
  randomEffects: RandomEffectSpec[],
  family: GlmmFamily,
  link: GlmmLink,
  data: Record<string, number[]>,
  options?: GlmmControl,
): GlmmFitResult {
  const dataJson = JSON.stringify(data);
  const randomEffectsJson = JSON.stringify(randomEffects);
  const optionsJson = options ? JSON.stringify(options) : undefined;

  initWasm();

  const resultJson = wasmInternal.glmm_fit_wasm(
    formula,
    randomEffectsJson,
    family,
    link,
    dataJson,
    optionsJson,
  );

  const result = decodeWithSpecialFloats(resultJson);

  if (result.error) {
    throw new Error(`GLMM fit failed: ${result.error}`);
  }

  return result as GlmmFitResult;
}
