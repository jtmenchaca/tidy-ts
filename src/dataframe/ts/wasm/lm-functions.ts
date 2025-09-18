// LM functions for WASM

import * as wasmInternal from "../../lib/tidy_ts_dataframe.internal.js";
import { initWasm } from "./wasm-init.ts";

/**
 * LM fit result interface
 */
export interface LmFitResult {
  coefficients: number[];
  residuals: number[];
  fitted_values: number[];
  effects: number[];
  rank: number;
  df_residual: number;
  qr_rank: number;
  pivot: number[];
  tol: number;
  pivoted: boolean;
  deviance: number;
  formula?: string;
  method?: string;
  r_squared?: number;
  adj_r_squared?: number;
  f_statistic?: number;
  p_value?: number;
  call?: string;
}

/**
 * LM options
 */
export interface LmOptions {
  weights?: number[];
  qr?: boolean;
  singular_ok?: boolean;
  na_action?: string;
}

/**
 * Fit a linear model using WASM
 *
 * @param formula - Model formula (e.g., "y ~ x1 + x2")
 * @param data - Data object with column names as keys
 * @param options - Optional LM parameters
 * @returns LM fit result
 */
export function lmFit(
  formula: string,
  data: Record<string, number[]>,
  options?: LmOptions,
): LmFitResult {
  // Convert data to JSON string
  const dataJson = JSON.stringify(data);

  // Convert options to JSON string
  const optionsJson = options ? JSON.stringify(options) : undefined;

  // Initialize WASM and call function
  initWasm();
  const resultJson = wasmInternal.lm_fit_wasm(
    formula,
    dataJson,
    optionsJson,
  );

  // Parse result
  const result = JSON.parse(resultJson);

  // Check for errors
  if (result.error) {
    throw new Error(`LM fit failed: ${result.error}`);
  }

  return result;
}

/**
 * Simplified LM fit for testing
 * Takes vectors directly instead of data frame
 *
 * @param y - Response variable
 * @param x - Design matrix (column-major order)
 * @param n_predictors - Number of predictors
 * @returns LM fit result
 */
export function lmFitSimple(
  y: number[],
  x: number[],
  n_predictors: number,
): LmFitResult {
  // Initialize WASM and call function
  initWasm();
  const resultJson = wasmInternal.lm_fit_simple_wasm(
    new Float64Array(y),
    new Float64Array(x),
    n_predictors,
  );

  // Parse result
  const result = JSON.parse(resultJson);

  // Check for errors
  if (result.error) {
    throw new Error(`LM fit failed: ${result.error}`);
  }

  return result;
}