#!/usr/bin/env -S deno run --allow-all

// Regression test interface for GLM and LM models

export interface RegressionTestParameters {
  testType: string;
  data?: {
    x?: number[];
    y?: number[];
    groups?: number[][];
    formula?: string;
    family?: string;
    weights?: number[];
    offset?: number[];
    [key: string]: any; // Allow for predictor variables with any type
  };
  options?: {
    alpha?: number;
    family?: string;
    link?: string;
    method?: string;
    control?: {
      epsilon?: number;
      maxit?: number;
      trace?: boolean;
    };
  };
}

// R-compatible parameters with dot notation for alternatives
interface RRegressionTestParameters
  extends Omit<RegressionTestParameters, "options"> {
  options?: Omit<RegressionTestParameters["options"], "control"> & {
    control?: {
      epsilon?: number;
      maxit?: number;
      trace?: boolean;
    };
  };
}

export interface RegressionTestResult {
  coefficients?: number[];
  residuals?: number[];
  fitted_values?: number[];
  deviance?: number;
  aic?: number;
  bic?: number;
  r_squared?: number;
  adj_r_squared?: number;
  f_statistic?: number;
  p_value?: number;
  df_residual?: number;
  df_null?: number;
  method?: string;
  family?: string;
  call?: string;
  formula?: string;
}

// =====================================================================================
// Seeded RNG support for reproducible tests
// =====================================================================================

// Simple mulberry32 PRNG
let __seed = 0x12345678 >>> 0;
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let __rng = mulberry32(__seed);

export function setTestSeed(seed: number) {
  __seed = (seed >>> 0) || 0x12345678;
  __rng = mulberry32(__seed);
}

function random() {
  return __rng();
}

// Expose a seeded random for callers that need reproducibility too
export function nextRandom(): number {
  return random();
}

// Helper function to extract coefficient values
function extractCoefficients(
  result: { coefficients?: { value?: number[] } | number[] },
): number[] {
  if (
    typeof result.coefficients === "object" &&
    !Array.isArray(result.coefficients) &&
    result.coefficients.value !== undefined
  ) {
    return result.coefficients.value;
  }
  return result.coefficients as number[] || [];
}

// Helper function to convert categorical variables to dummy variables
function convertCategoricalToNumeric(
  data: { [key: string]: any },
): { [key: string]: number[] } {
  const result: { [key: string]: number[] } = {};

  for (const [key, values] of Object.entries(data)) {
    if (key === "formula" || key === "family") {
      continue; // Skip non-data fields
    }

    if (Array.isArray(values) && values.length > 0) {
      if (typeof values[0] === "string") {
        // This is a categorical variable - convert to dummy variables
        const uniqueValues = Array.from(new Set(values)).sort();

        // Create dummy variables for all but the first category (reference level)
        // This matches R's default behavior
        for (let i = 1; i < uniqueValues.length; i++) {
          const dummyKey = `${key}${uniqueValues[i]}`;
          result[dummyKey] = values.map((v: string) =>
            v === uniqueValues[i] ? 1 : 0
          );
        }
      } else {
        // This is already numeric
        result[key] = values as number[];
      }
    }
  }

  return result;
}

// Helper function to update formula to include dummy variable names
function updateFormulaForDummies(
  formula: string,
  data: { [key: string]: any },
): string {
  let updatedFormula = formula;

  // First, identify all categorical variables and their dummy names
  const categoricalInfo: { [key: string]: string[] } = {};

  for (const [key, values] of Object.entries(data)) {
    if (
      Array.isArray(values) && values.length > 0 &&
      typeof values[0] === "string"
    ) {
      // This is a categorical variable
      const uniqueValues = Array.from(new Set(values)).sort();
      const dummyNames = uniqueValues.slice(1).map((v) => `${key}${v}`);
      categoricalInfo[key] = dummyNames;
    }
  }

  // Handle simple replacements first (standalone variables)
  for (const [key, dummyNames] of Object.entries(categoricalInfo)) {
    if (dummyNames.length > 0) {
      // Replace standalone occurrences (not in interactions)
      const standaloneRegex = new RegExp(`\\b${key}\\b(?![*])`, "g");
      updatedFormula = updatedFormula.replace(
        standaloneRegex,
        dummyNames.join(" + "),
      );
    }
  }

  // Handle interaction terms - this is more complex for categorical variables
  // For now, we'll avoid complex interactions with categoricals by simplifying
  // TODO: Implement proper interaction expansion for categorical variables

  // Check if formula still contains categorical variables in interactions
  for (const key of Object.keys(categoricalInfo)) {
    if (
      updatedFormula.includes(`${key} *`) || updatedFormula.includes(`* ${key}`)
    ) {
      console.warn(
        `Warning: Complex interactions with categorical variable ${key} may not be fully supported. Consider simplifying the formula.`,
      );
    }
  }

  return updatedFormula;
}

// Robust R caller for regression tests
export async function callRobustR(
  params: RegressionTestParameters,
): Promise<RegressionTestResult> {
  // Convert parameters to R format
  const rParams = structuredClone(params) as RRegressionTestParameters;

  const paramJson = JSON.stringify(rParams);

  // Get the directory of the current file using import.meta.url
  const currentDir = new URL(".", import.meta.url).pathname;
  const rScriptPath = `${currentDir}regression-test-runner.R`;

  const command = new Deno.Command("Rscript", {
    args: [rScriptPath, paramJson],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`R error: ${errorText}`);
  }

  const output = new TextDecoder().decode(stdout);
  const stderrText = new TextDecoder().decode(stderr);

  try {
    const parsed = JSON.parse(output);
    // Attach R warnings/stderr (if any) to help the caller detect separation/singularity
    const warnings = (stderrText || "").trim();
    if (warnings.length > 0) {
      (parsed as any).warnings = warnings;
    }
    return parsed;
  } catch (parseError) {
    console.error("JSON parse error:", parseError);
    console.error("Raw output:", output);
    throw new Error(`JSON parse error: ${(parseError as Error).message}`);
  }
}

// Comprehensive Rust caller for regression tests
export async function callRobustRust(
  params: RegressionTestParameters,
): Promise<RegressionTestResult> {
  const alpha = params.options?.alpha || 0.05;
  const family = params.options?.family || "gaussian";

  switch (params.testType) {
    // GLM Tests - Using WASM
    case "glm.gaussian": {
      const { glmFit } = await import(
        "../../../../ts/wasm/glm-functions.ts"
      );

      // Create data object with all predictor variables
      const data: { [key: string]: any } = {
        y: params.data!.y!,
      };

      // Add all predictor variables (including categorical as strings)
      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = glmFit(
        params.data!.formula!,
        "gaussian",
        "identity",
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        deviance: result.deviance,
        aic: result.aic,
        method: "glm.gaussian",
        family: "gaussian",
        call: result.call,
        formula: result.formula,
      };
    }

    case "glm.binomial": {
      const { glmFit } = await import(
        "../../../../ts/wasm/glm-functions.ts"
      );

      // Create data object with all predictor variables
      const data: { [key: string]: any } = {
        y: params.data!.y!,
      };

      // Add all predictor variables (including categorical as strings)
      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = glmFit(
        params.data!.formula!,
        "binomial",
        "logit",
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        deviance: result.deviance,
        aic: result.aic,
        method: "glm.binomial",
        family: "binomial",
        call: result.call,
        formula: result.formula,
      };
    }

    case "glm.binomial.log": {
      const { glmFit } = await import(
        "../../../../ts/wasm/glm-functions.ts"
      );

      // Convert data to the format expected by WASM GLM
      const data: { [key: string]: number[] } = {
        y: params.data!.y!,
      };

      // Add all predictor variables
      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = glmFit(
        params.data!.formula!,
        "binomial",
        "log",
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        deviance: result.deviance,
        aic: result.aic,
        method: "glm.binomial.log",
        family: "binomial",
        call: result.call,
        formula: result.formula,
      };
    }

    case "glm.poisson": {
      const { glmFit } = await import(
        "../../../../ts/wasm/glm-functions.ts"
      );

      // Create data object with all predictor variables
      const data: { [key: string]: any } = {
        y: params.data!.y!,
      };

      // Add all predictor variables (including categorical as strings)
      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = glmFit(
        params.data!.formula!,
        "poisson",
        "log",
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        deviance: result.deviance,
        aic: result.aic,
        method: "glm.poisson",
        family: "poisson",
        call: result.call,
        formula: result.formula,
      };
    }

    // Additional GLM test types with different link functions
    case "glm.gaussian.log": {
      const { glmFit } = await import(
        "../../../../ts/wasm/glm-functions.ts"
      );

      const data: { [key: string]: number[] } = {
        y: params.data!.y!,
      };

      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = glmFit(
        params.data!.formula!,
        "gaussian",
        "log",
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        deviance: result.deviance,
        aic: result.aic,
        method: "glm.gaussian.log",
        family: "gaussian",
        call: result.call,
        formula: result.formula,
      };
    }

    case "glm.gaussian.inverse": {
      const { glmFit } = await import(
        "../../../../ts/wasm/glm-functions.ts"
      );

      const data: { [key: string]: number[] } = {
        y: params.data!.y!,
      };

      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = glmFit(
        params.data!.formula!,
        "gaussian",
        "inverse",
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        deviance: result.deviance,
        aic: result.aic,
        method: "glm.gaussian.inverse",
        family: "gaussian",
        call: result.call,
        formula: result.formula,
      };
    }

    case "glm.binomial.probit": {
      const { glmFit } = await import(
        "../../../../ts/wasm/glm-functions.ts"
      );

      const data: { [key: string]: number[] } = {
        y: params.data!.y!,
      };

      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = glmFit(
        params.data!.formula!,
        "binomial",
        "probit",
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        deviance: result.deviance,
        aic: result.aic,
        method: "glm.binomial.probit",
        family: "binomial",
        call: result.call,
        formula: result.formula,
      };
    }

    case "glm.binomial.cauchit": {
      const { glmFit } = await import(
        "../../../../ts/wasm/glm-functions.ts"
      );

      const data: { [key: string]: number[] } = {
        y: params.data!.y!,
      };

      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = glmFit(
        params.data!.formula!,
        "binomial",
        "cauchit",
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        deviance: result.deviance,
        aic: result.aic,
        method: "glm.binomial.cauchit",
        family: "binomial",
        call: result.call,
        formula: result.formula,
      };
    }

    case "glm.binomial.cloglog": {
      const { glmFit } = await import(
        "../../../../ts/wasm/glm-functions.ts"
      );

      const data: { [key: string]: number[] } = {
        y: params.data!.y!,
      };

      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = glmFit(
        params.data!.formula!,
        "binomial",
        "cloglog",
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        deviance: result.deviance,
        aic: result.aic,
        method: "glm.binomial.cloglog",
        family: "binomial",
        call: result.call,
        formula: result.formula,
      };
    }

    case "glm.poisson.identity": {
      const { glmFit } = await import(
        "../../../../ts/wasm/glm-functions.ts"
      );

      const data: { [key: string]: number[] } = {
        y: params.data!.y!,
      };

      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = glmFit(
        params.data!.formula!,
        "poisson",
        "identity",
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        deviance: result.deviance,
        aic: result.aic,
        method: "glm.poisson.identity",
        family: "poisson",
        call: result.call,
        formula: result.formula,
      };
    }

    case "glm.poisson.sqrt": {
      const { glmFit } = await import(
        "../../../../ts/wasm/glm-functions.ts"
      );

      const data: { [key: string]: number[] } = {
        y: params.data!.y!,
      };

      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = glmFit(
        params.data!.formula!,
        "poisson",
        "sqrt",
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        deviance: result.deviance,
        aic: result.aic,
        method: "glm.poisson.sqrt",
        family: "poisson",
        call: result.call,
        formula: result.formula,
      };
    }

    case "glm.gamma": {
      const { glmFit } = await import(
        "../../../../ts/wasm/glm-functions.ts"
      );

      // Create data object with all predictor variables
      const data: { [key: string]: any } = {
        y: params.data!.y!,
      };

      // Add all predictor variables (including categorical as strings)
      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = glmFit(
        params.data!.formula!,
        "gamma",
        "inverse",
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        deviance: result.deviance,
        aic: result.aic,
        method: "glm.gamma",
        family: "gamma",
        call: result.call,
        formula: result.formula,
      };
    }

    case "glm.gamma.identity": {
      const { glmFit } = await import(
        "../../../../ts/wasm/glm-functions.ts"
      );

      const data: { [key: string]: number[] } = {
        y: params.data!.y!,
      };

      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = glmFit(
        params.data!.formula!,
        "gamma",
        "identity",
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        deviance: result.deviance,
        aic: result.aic,
        method: "glm.gamma.identity",
        family: "gamma",
        call: result.call,
        formula: result.formula,
      };
    }

    case "glm.gamma.log": {
      const { glmFit } = await import(
        "../../../../ts/wasm/glm-functions.ts"
      );

      const data: { [key: string]: number[] } = {
        y: params.data!.y!,
      };

      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = glmFit(
        params.data!.formula!,
        "gamma",
        "log",
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        deviance: result.deviance,
        aic: result.aic,
        method: "glm.gamma.log",
        family: "gamma",
        call: result.call,
        formula: result.formula,
      };
    }

    case "glm.inverse.gaussian": {
      const { glmFit } = await import(
        "../../../../ts/wasm/glm-functions.ts"
      );

      // Create data object with all predictor variables
      const data: { [key: string]: any } = {
        y: params.data!.y!,
      };

      // Add all predictor variables (including categorical as strings)
      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = glmFit(
        params.data!.formula!,
        "inverse_gaussian",
        "inverse_squared",
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        deviance: result.deviance,
        aic: result.aic,
        method: "glm.inverse.gaussian",
        family: "inverse_gaussian",
        call: result.call,
        formula: result.formula,
      };
    }

    case "glm.inverse.gaussian.identity": {
      const { glmFit } = await import(
        "../../../../ts/wasm/glm-functions.ts"
      );

      const data: { [key: string]: number[] } = {
        y: params.data!.y!,
      };

      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = glmFit(
        params.data!.formula!,
        "inverse_gaussian",
        "identity",
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        deviance: result.deviance,
        aic: result.aic,
        method: "glm.inverse.gaussian.identity",
        family: "inverse_gaussian",
        call: result.call,
        formula: result.formula,
      };
    }

    case "glm.inverse.gaussian.log": {
      const { glmFit } = await import(
        "../../../../ts/wasm/glm-functions.ts"
      );

      const data: { [key: string]: number[] } = {
        y: params.data!.y!,
      };

      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = glmFit(
        params.data!.formula!,
        "inverse_gaussian",
        "log",
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        deviance: result.deviance,
        aic: result.aic,
        method: "glm.inverse.gaussian.log",
        family: "inverse_gaussian",
        call: result.call,
        formula: result.formula,
      };
    }

    // LM Tests - Using WASM
    case "lm.simple": {
      const { lmFit } = await import(
        "../../../../ts/wasm/lm-functions.ts"
      );

      // Convert data to the format expected by WASM LM
      const data: { [key: string]: number[] } = {
        y: params.data!.y!,
      };

      // Add all predictor variables
      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const result = lmFit(
        params.data!.formula!,
        data,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        r_squared: result.r_squared,
        adj_r_squared: result.adj_r_squared,
        f_statistic: result.f_statistic,
        p_value: result.p_value,
        df_residual: result.df_residual,
        method: "lm.simple",
        call: result.call,
        formula: result.formula,
      };
    }

    case "lm.weighted": {
      const { lmFit } = await import(
        "../../../../ts/wasm/lm-functions.ts"
      );

      // Convert data to the format expected by WASM LM
      const data: { [key: string]: number[] } = {
        y: params.data!.y!,
      };

      // Add all predictor variables
      Object.keys(params.data!).forEach((key) => {
        if (
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset"
        ) {
          data[key] = (params.data as any)[key];
        }
      });

      const options = {
        weights: params.data!.weights || undefined,
      };

      const result = lmFit(
        params.data!.formula!,
        data,
        options,
      );

      return {
        coefficients: result.coefficients,
        residuals: result.residuals,
        fitted_values: result.fitted_values,
        r_squared: result.r_squared,
        adj_r_squared: result.adj_r_squared,
        f_statistic: result.f_statistic,
        p_value: result.p_value,
        df_residual: result.df_residual,
        method: "lm.weighted",
        call: result.call,
        formula: result.formula,
      };
    }

    default:
      throw new Error(`Unknown regression test type: ${params.testType}`);
  }
}

// Test case generator for regression tests
export function generateRegressionTestCase(
  testType: string,
  sampleSize: number,
): RegressionTestParameters {
  const alphas = [0.05, 0.01, 0.10];
  const alpha = alphas[Math.floor(random() * alphas.length)];

  // Generate random number of predictors (3-5) to ensure we have enough for + and * operations
  const numPredictors = 3 + Math.floor(random() * 3);

  // Helper to generate formula and data for multiple predictors
  function generateMultiPredictorData(sampleSize: number, numPreds: number) {
    const predictors: { [key: string]: number[] | string[] } = {};
    const predictorNames: string[] = [];
    const categoricalIndices: number[] = [];

    // Always include at least one categorical variable
    // Place it at a random position among the predictors
    const categoricalIndex = Math.floor(random() * numPreds);

    for (let i = 0; i < numPreds; i++) {
      // Use x1, x2, x3, etc. to avoid conflicts with response variable 'y'
      const name = `x${i + 1}`;

      if (i === categoricalIndex) {
        // Generate categorical data (string factor)
        predictors[name] = generateCategoricalData(sampleSize);
        categoricalIndices.push(i);
      } else {
        // Generate continuous data
        predictors[name] = generateNormalData(sampleSize);
      }
      predictorNames.push(name);
    }

    // Calculate a more accurate parameter count accounting for dummy variables and interactions
    const calculateActualParams = (formula: string): number => {
      // Column count per variable: numeric → 1, factor with k levels → k-1
      const getColCount = (name: string): number => {
        const values = predictors[name];
        if (!Array.isArray(values) || values.length === 0) return 1;
        if (typeof (values as any[])[0] === "string") {
          const k = Array.from(new Set(values as string[])).length;
          return Math.max(1, k - 1);
        }
        return 1;
      };

      // Build contributions using interaction expansion; avoid double-counting terms
      const seenTerms = new Set<string>();
      let totalParams = 1; // intercept

      const rhs = formula.split("~")[1]?.trim() || "";
      if (!rhs.length) return totalParams;

      const addSubsetContribution = (vars: string[]) => {
        // Determine max interaction order (limit to 2 when n small)
        const maxOrder = sampleSize < 15
          ? Math.min(2, vars.length)
          : vars.length;
        const unique = Array.from(new Set(vars));
        const k = unique.length;
        const choose = (start: number, chosen: string[]) => {
          if (chosen.length >= 1 && chosen.length <= maxOrder) {
            const key = chosen.slice().sort().join(":");
            if (!seenTerms.has(key)) {
              seenTerms.add(key);
              // Contribution is the product of column counts for interaction
              const contribution = chosen.reduce(
                (prod, v) => prod * getColCount(v),
                1,
              );
              totalParams += contribution;
            }
          }
          if (chosen.length === maxOrder) return;
          for (let i = start; i < k; i++) {
            chosen.push(unique[i]);
            choose(i + 1, chosen);
            chosen.pop();
          }
        };
        choose(0, []);
      };

      // Parse by '+' groups; each group may contain '*' interactions
      const plusGroups = rhs.split("+").map((s) => s.trim()).filter((s) =>
        s.length
      );
      for (const grp of plusGroups) {
        if (grp.includes("*")) {
          const vars = grp.split("*").map((s) => s.trim()).filter((s) =>
            s.length
          );
          addSubsetContribution(vars);
        } else if (predictorNames.includes(grp)) {
          // Main effect only
          const key = grp;
          if (!seenTerms.has(key)) {
            seenTerms.add(key);
            totalParams += getColCount(grp);
          }
        }
      }

      return totalParams;
    };

    // Generate formula with random combination of + and * operators
    let formula = generateRandomFormula(predictorNames);

    // Ensure parameter count is not too large relative to n
    let actualParams = calculateActualParams(formula);
    let attempts = 0;
    const maxAttempts = 10;
    // Keep models reasonably determined: cap parameters to ~ n/3
    const maxParams = Math.max(3, Math.floor(sampleSize / 3));

    while (attempts < maxAttempts && actualParams > maxParams) {
      // Simplify: fallback to main effects only
      formula = `y ~ ${predictorNames.join(" + ")}`;
      actualParams = calculateActualParams(formula);
      attempts++;
    }

    return { predictors, formula };
  }

  // Helper to generate random formula with + and * operators
  function generateRandomFormula(predictorNames: string[]): string {
    if (predictorNames.length === 1) {
      return `y ~ ${predictorNames[0]}`;
    }

    // Ensure we have at least 3 predictors for meaningful + and * combinations
    if (predictorNames.length < 3) {
      return `y ~ ${predictorNames.join(" + ")}`;
    }

    // For small sample sizes, avoid complex interactions
    if (sampleSize < 15) {
      return `y ~ ${predictorNames.join(" + ")}`;
    }

    // Formula patterns that guarantee both + and * operators
    const patterns = [
      // Mixed: first two multiplied, rest added
      () =>
        `y ~ ${predictorNames[0]} * ${predictorNames[1]}${
          predictorNames.length > 2
            ? " + " + predictorNames.slice(2).join(" + ")
            : ""
        }`,
      // Mixed: first added, rest multiplied
      () =>
        `y ~ ${predictorNames[0]}${
          predictorNames.length > 1
            ? " + " + predictorNames.slice(1).join(" * ")
            : ""
        }`,
      // Mixed: first two added, rest multiplied
      () =>
        `y ~ ${predictorNames[0]} + ${predictorNames[1]}${
          predictorNames.length > 2
            ? " * " + predictorNames.slice(2).join(" * ")
            : ""
        }`,
      // Mixed: alternating pattern with + and *
      () => {
        const terms: string[] = [];
        for (let i = 0; i < predictorNames.length; i++) {
          if (i === 0) {
            terms.push(predictorNames[i]);
          } else {
            const operator = i % 2 === 1 ? " * " : " + ";
            terms.push(operator + predictorNames[i]);
          }
        }
        return `y ~ ${terms.join("")}`;
      },
      // Mixed: two-way interactions with main effects
      () => {
        if (predictorNames.length >= 4) {
          return `y ~ ${predictorNames[0]} + ${predictorNames[1]} + ${
            predictorNames[2]
          } * ${predictorNames[3]}${
            predictorNames.length > 4
              ? " + " + predictorNames.slice(4).join(" + ")
              : ""
          }`;
        } else {
          return `y ~ ${predictorNames[0]} + ${predictorNames[1]} * ${
            predictorNames[2]
          }`;
        }
      },
      // Mixed: three-way interaction with main effects
      () => {
        if (predictorNames.length >= 3) {
          return `y ~ ${predictorNames[0]} * ${predictorNames[1]} * ${
            predictorNames[2]
          }${
            predictorNames.length > 3
              ? " + " + predictorNames.slice(3).join(" + ")
              : ""
          }`;
        } else {
          return `y ~ ${predictorNames[0]} + ${predictorNames[1]} * ${
            predictorNames[2]
          }`;
        }
      },
    ];

    // For small sample sizes, restrict interaction depth to reduce parameter count
    if (sampleSize < 15) {
      // Only allow simple two-way interactions at most
      const simplePatterns = [patterns[0], patterns[4]];
      const rp = simplePatterns[Math.floor(random() * simplePatterns.length)];
      return rp();
    }

    const randomPattern = patterns[Math.floor(random() * patterns.length)];
    return randomPattern();
  }

  // Estimate number of parameters contributed by RHS of formula (roughly)
  function estimateParamCount(
    formula: string,
    predictorNames: string[],
  ): number {
    const rhs = formula.split("~")[1].trim();
    const termSet = new Set<string>();
    const addMain = (name: string) => termSet.add(name);
    const addInteractionCombos = (vars: string[]) => {
      // add all non-empty subsets
      const unique = Array.from(new Set(vars));
      const k = unique.length;
      // limit to two-way if sample size is small to avoid overcounting
      const maxOrder = sampleSize < 15 ? 2 : k;
      for (let r = 1; r <= maxOrder; r++) {
        const comb = (start: number, chosen: string[]) => {
          if (chosen.length === r) {
            const key = chosen.slice().sort().join(":");
            termSet.add(key);
            return;
          }
          for (let i = start; i < k; i++) {
            chosen.push(unique[i]);
            comb(i + 1, chosen);
            chosen.pop();
          }
        };
        comb(0, []);
      }
    };

    const plusGroups = rhs.split("+").map((s) => s.trim()).filter((s) =>
      s.length
    );
    for (const grp of plusGroups) {
      if (grp.includes("*")) {
        const vars = grp.split("*").map((s) => s.trim());
        addInteractionCombos(vars);
      } else if (predictorNames.includes(grp)) {
        addMain(grp);
      }
    }
    // Add intercept
    return termSet.size + 1;
  }

  // Helper to generate categorical data (string factors)
  function generateCategoricalData(n: number): string[] {
    // Use fewer categories for small sample sizes to avoid rank deficiency
    const numCategories = n < 20 ? 2 : 3;
    const categories = ["A", "B", "C"].slice(0, numCategories);

    // Ensure minimum observations per category to avoid pathological cases
    const minPerCategory = Math.max(2, Math.floor(n / (numCategories * 2)));
    const data: string[] = [];

    // First, ensure minimum representation for each category
    for (const category of categories) {
      for (let j = 0; j < minPerCategory; j++) {
        data.push(category);
      }
    }

    // Fill remaining slots randomly with more balanced probabilities
    const remaining = n - data.length;
    const probabilities = numCategories === 2 ? [0.5, 0.5] : [0.35, 0.35, 0.3];

    for (let i = 0; i < remaining; i++) {
      const r = random();
      let cumProb = 0;
      let selected = categories[0];

      for (let j = 0; j < categories.length; j++) {
        cumProb += probabilities[j];
        if (r < cumProb) {
          selected = categories[j];
          break;
        }
      }
      data.push(selected);
    }

    // Shuffle the data to avoid patterns
    for (let i = data.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [data[i], data[j]] = [data[j], data[i]];
    }

    return data;
  }

  // Helper to generate normal data
  function generateNormalData(n: number, mean = 0, stdDev = 1): number[] {
    const data: number[] = [];
    for (let i = 0; i < n; i++) {
      const u1 = random();
      const u2 = random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      data.push(mean + stdDev * z);
    }
    return data;
  }

  // Helper to generate binomial data
  function generateBinomialData(n: number, p = 0.5): number[] {
    const data: number[] = [];
    for (let i = 0; i < n; i++) {
      data.push(random() < p ? 1 : 0);
    }
    return data;
  }

  // Helper to generate poisson data
  function generatePoissonData(n: number, lambda = 2): number[] {
    const data: number[] = [];
    for (let i = 0; i < n; i++) {
      // Simple Poisson generation using inverse transform
      let k = 0;
      let p = Math.exp(-lambda);
      let s = p;
      const u = random();
      while (u > s) {
        k++;
        p *= lambda / k;
        s += p;
      }
      data.push(k);
    }
    return data;
  }

  switch (testType) {
    // GLM Tests
    case "glm.gaussian": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      return {
        testType,
        data: {
          ...predictors,
          y: generateNormalData(sampleSize),
          formula,
        },
        options: {
          family: "gaussian",
          alpha,
        },
      };
    }

    case "glm.binomial": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      // Separation-aware y generation: ensure both classes are present
      let y = generateBinomialData(sampleSize, 0.3);
      let tries = 0;
      while (tries < 5) {
        const ones = y.reduce((a, b) => a + b, 0);
        const zeros = y.length - ones;
        if (
          ones >= Math.ceil(0.15 * sampleSize) &&
          zeros >= Math.ceil(0.15 * sampleSize)
        ) break;
        y = generateBinomialData(sampleSize, 0.3 + (random() - 0.5) * 0.2);
        tries++;
      }

      return {
        testType,
        data: {
          ...predictors,
          y,
          formula,
        },
        options: {
          family: "binomial",
          alpha,
        },
      };
    }

    case "glm.binomial.log": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      // Separation-aware y generation: ensure both classes are present
      let y = generateBinomialData(sampleSize, 0.3);
      let tries = 0;
      while (tries < 5) {
        const ones = y.reduce((a, b) => a + b, 0);
        const zeros = y.length - ones;
        if (
          ones >= Math.ceil(0.15 * sampleSize) &&
          zeros >= Math.ceil(0.15 * sampleSize)
        ) break;
        y = generateBinomialData(sampleSize, 0.3 + (random() - 0.5) * 0.2);
        tries++;
      }

      return {
        testType,
        data: {
          ...predictors,
          y,
          formula,
        },
        options: {
          family: "binomial",
          link: "log",
          alpha,
        },
      };
    }

    case "glm.poisson": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      return {
        testType,
        data: {
          ...predictors,
          y: generatePoissonData(sampleSize, 2),
          formula,
        },
        options: {
          family: "poisson",
          alpha,
        },
      };
    }

    // Additional GLM test cases with different link functions
    case "glm.gaussian.log": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      // Generate positive data for log link
      const y = generateNormalData(sampleSize, 2, 0.5).map((x) =>
        Math.abs(x) + 0.1
      );
      return {
        testType,
        data: {
          ...predictors,
          y,
          formula,
        },
        options: {
          family: "gaussian",
          link: "log",
          alpha,
        },
      };
    }

    case "glm.gaussian.inverse": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      // Generate positive data for inverse link
      const y = generateNormalData(sampleSize, 2, 0.5).map((x) =>
        Math.abs(x) + 0.1
      );
      return {
        testType,
        data: {
          ...predictors,
          y,
          formula,
        },
        options: {
          family: "gaussian",
          link: "inverse",
          alpha,
        },
      };
    }

    case "glm.binomial.probit": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      return {
        testType,
        data: {
          ...predictors,
          y: generateBinomialData(sampleSize, 0.3),
          formula,
        },
        options: {
          family: "binomial",
          link: "probit",
          alpha,
        },
      };
    }

    case "glm.binomial.cauchit": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      // Separation-aware y generation: ensure both classes are present
      let y = generateBinomialData(sampleSize, 0.3);
      let tries = 0;
      while (tries < 5) {
        const ones = y.reduce((a, b) => a + b, 0);
        const zeros = y.length - ones;
        if (
          ones >= Math.ceil(0.15 * sampleSize) &&
          zeros >= Math.ceil(0.15 * sampleSize)
        ) break;
        y = generateBinomialData(sampleSize, 0.3 + (random() - 0.5) * 0.2);
        tries++;
      }
      return {
        testType,
        data: {
          ...predictors,
          y,
          formula,
        },
        options: {
          family: "binomial",
          link: "cauchit",
          alpha,
        },
      };
    }

    case "glm.binomial.cloglog": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      // Separation-aware y generation: ensure both classes are present
      let y = generateBinomialData(sampleSize, 0.3);
      let tries = 0;
      while (tries < 5) {
        const ones = y.reduce((a, b) => a + b, 0);
        const zeros = y.length - ones;
        if (
          ones >= Math.ceil(0.15 * sampleSize) &&
          zeros >= Math.ceil(0.15 * sampleSize)
        ) break;
        y = generateBinomialData(sampleSize, 0.3 + (random() - 0.5) * 0.2);
        tries++;
      }
      return {
        testType,
        data: {
          ...predictors,
          y,
          formula,
        },
        options: {
          family: "binomial",
          link: "cloglog",
          alpha,
        },
      };
    }

    case "glm.poisson.identity": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      // Generate positive data for identity link
      const y = generatePoissonData(sampleSize, 2).map((x) => Math.max(0, x));
      return {
        testType,
        data: {
          ...predictors,
          y,
          formula,
        },
        options: {
          family: "poisson",
          link: "identity",
          alpha,
        },
      };
    }

    case "glm.poisson.sqrt": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      // Generate positive data for sqrt link
      const y = generatePoissonData(sampleSize, 2).map((x) => Math.max(0, x));
      return {
        testType,
        data: {
          ...predictors,
          y,
          formula,
        },
        options: {
          family: "poisson",
          link: "sqrt",
          alpha,
        },
      };
    }

    case "glm.gamma": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      // Generate positive data for gamma family
      const y = generateNormalData(sampleSize, 2, 0.5).map((x) =>
        Math.abs(x) + 0.1
      );
      return {
        testType,
        data: {
          ...predictors,
          y,
          formula,
        },
        options: {
          family: "gamma",
          link: "inverse",
          alpha,
        },
      };
    }

    case "glm.gamma.identity": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      // Generate positive data for gamma family with identity link
      const y = generateNormalData(sampleSize, 2, 0.5).map((x) =>
        Math.abs(x) + 0.1
      );
      return {
        testType,
        data: {
          ...predictors,
          y,
          formula,
        },
        options: {
          family: "gamma",
          link: "identity",
          alpha,
        },
      };
    }

    case "glm.gamma.log": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      // Generate positive data for gamma family with log link
      const y = generateNormalData(sampleSize, 2, 0.5).map((x) =>
        Math.abs(x) + 0.1
      );
      return {
        testType,
        data: {
          ...predictors,
          y,
          formula,
        },
        options: {
          family: "gamma",
          link: "log",
          alpha,
        },
      };
    }

    case "glm.inverse.gaussian": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      // Positive data for inverse gaussian
      const y = generateNormalData(sampleSize, 2, 0.5).map((x) =>
        Math.abs(x) + 0.1
      );
      return {
        testType,
        data: {
          ...predictors,
          y,
          formula,
        },
        options: {
          family: "inverse_gaussian",
          link: "inverse_squared",
          alpha,
        },
      };
    }

    case "glm.inverse.gaussian.identity": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      // Positive data for inverse gaussian with identity link
      const y = generateNormalData(sampleSize, 2, 0.5).map((x) =>
        Math.abs(x) + 0.1
      );
      return {
        testType,
        data: {
          ...predictors,
          y,
          formula,
        },
        options: {
          family: "inverse_gaussian",
          link: "identity",
          alpha,
        },
      };
    }

    case "glm.inverse.gaussian.log": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      // Positive data for inverse gaussian with log link
      const y = generateNormalData(sampleSize, 2, 0.5).map((x) =>
        Math.abs(x) + 0.1
      );
      return {
        testType,
        data: {
          ...predictors,
          y,
          formula,
        },
        options: {
          family: "inverse_gaussian",
          link: "log",
          alpha,
        },
      };
    }

    // LM Tests
    case "lm.simple": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      return {
        testType,
        data: {
          ...predictors,
          y: generateNormalData(sampleSize),
          formula,
        },
        options: {
          alpha,
        },
      };
    }

    case "lm.weighted": {
      const { predictors, formula } = generateMultiPredictorData(
        sampleSize,
        numPredictors,
      );
      return {
        testType,
        data: {
          ...predictors,
          y: generateNormalData(sampleSize),
          formula,
          weights: Array.from(
            { length: sampleSize },
            () => Math.random() + 0.5,
          ),
        },
        options: {
          alpha,
        },
      };
    }

    default:
      throw new Error(`Test case generation not implemented for: ${testType}`);
  }
}
