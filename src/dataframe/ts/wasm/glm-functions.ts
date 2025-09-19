// GLM functions for WASM

import * as wasmInternal from "../../lib/tidy_ts_dataframe.internal.js";
import { initWasm } from "./wasm-init.ts";

/**
 * GLM fit result interface
 */
export interface GlmFitResult {
  coefficients: number[];
  residuals: number[];
  fitted_values: number[];
  effects?: number[];
  rank: number;
  pivot: number[];
  qr?: boolean;
  df_residual: number;
  df_null: number;
  family: string;
  deviance: number;
  aic: number;
  null_deviance: number;
  iter: number;
  converged: boolean;
  boundary: boolean;
  call?: string;
  formula?: string;
  terms?: boolean;
}

/**
 * GLM family options
 */
export type GlmFamily = "gaussian" | "binomial" | "poisson" | "gamma";

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
  | "sqrt";

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
    console.error(`Data keys: ${Object.keys(data).join(', ')}`);
    console.error(`Data sample sizes: ${Object.entries(data).map(([k, v]) => `${k}:${v.length}`).join(', ')}`);
    // Log the actual y values for binomial family
    if (family === 'binomial' && data.y) {
      console.error(`Y values: [${data.y.join(', ')}]`);
      console.error(`Y range: min=${Math.min(...data.y)}, max=${Math.max(...data.y)}`);
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
 * Simplified GLM fit for testing
 *
 * @param y - Response variable
 * @param x - Predictor matrix (flattened, column-major order)
 * @param nPredictors - Number of predictor variables
 * @param family - GLM family name
 * @param link - Link function name
 * @returns GLM fit result
 */
export function glmFitSimple(
  y: number[],
  x: number[],
  nPredictors: number,
  family: GlmFamily,
  link: GlmLink,
): GlmFitResult {
  // Initialize WASM and call function
  initWasm();
  const resultJson = wasmInternal.glm_fit_simple_wasm(
    new Float64Array(y),
    new Float64Array(x),
    nPredictors,
    family,
    link,
  );

  // Parse result
  const result = JSON.parse(resultJson);

  // Check for errors
  if (result.error) {
    throw new Error(`GLM fit failed: ${result.error}`);
  }

  return result as GlmFitResult;
}

/**
 * Create a simple test dataset for GLM
 *
 * @param n - Number of observations
 * @returns Test dataset with y, x1, x2 columns
 */
export function createTestData(n: number): Record<string, number[]> {
  const y: number[] = [];
  const x1: number[] = [];
  const x2: number[] = [];

  for (let i = 0; i < n; i++) {
    const x1_val = Math.random() * 10 - 5; // -5 to 5
    const x2_val = Math.random() * 10 - 5; // -5 to 5
    const y_val = 2 + 0.5 * x1_val + 0.3 * x2_val + (Math.random() - 0.5) * 2; // Linear with noise

    y.push(y_val);
    x1.push(x1_val);
    x2.push(x2_val);
  }

  return { y, x1, x2 };
}
