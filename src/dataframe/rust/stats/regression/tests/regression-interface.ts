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
  return JSON.parse(output);
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

      // Convert data to the format expected by WASM GLM
      // For multiple predictors, we need to create a matrix format
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

    case "glm.poisson": {
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

    case "glm.gamma": {
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
  const alpha = alphas[Math.floor(Math.random() * alphas.length)];

  // Generate random number of predictors (3-5) to ensure we have enough for + and * operations
  const numPredictors = 3 + Math.floor(Math.random() * 3);

  // Helper to generate formula and data for multiple predictors
  function generateMultiPredictorData(sampleSize: number, numPreds: number) {
    const predictors: { [key: string]: number[] } = {};
    const predictorNames: string[] = [];

    for (let i = 0; i < numPreds; i++) {
      // Use x1, x2, x3, etc. to avoid conflicts with response variable 'y'
      const name = `x${i + 1}`;
      predictors[name] = generateNormalData(sampleSize);
      predictorNames.push(name);
    }

    // Generate formula with random combination of + and * operators
    const formula = generateRandomFormula(predictorNames);
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

    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
    return randomPattern();
  }

  // Helper to generate normal data
  function generateNormalData(n: number, mean = 0, stdDev = 1): number[] {
    const data: number[] = [];
    for (let i = 0; i < n; i++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      data.push(mean + stdDev * z);
    }
    return data;
  }

  // Helper to generate binomial data
  function generateBinomialData(n: number, p = 0.5): number[] {
    const data: number[] = [];
    for (let i = 0; i < n; i++) {
      data.push(Math.random() < p ? 1 : 0);
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
      const u = Math.random();
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
      return {
        testType,
        data: {
          ...predictors,
          y: generateBinomialData(sampleSize, 0.3),
          formula,
        },
        options: {
          family: "binomial",
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
