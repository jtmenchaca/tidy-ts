// GLM functions for WASM

import { initWasm, wasmInternal } from "./wasm-init.ts";
import type { DataFrame } from "../dataframe/index.ts";

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
