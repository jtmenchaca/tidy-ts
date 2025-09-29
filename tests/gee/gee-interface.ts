#!/usr/bin/env -S deno run --allow-all

// GEE test interface for geeglm models

export interface GeeglmTestParameters {
  testType: string;
  data?: {
    x?: number[];
    y?: number[];
    id?: number[];
    waves?: number[];
    groups?: number[][];
    formula?: string;
    family?: string;
    weights?: number[];
    offset?: number[];
    // deno-lint-ignore no-explicit-any
    [key: string]: any; // Allow for predictor variables with any type
  };
  options?: {
    alpha?: number;
    family?: string;
    link?: string;
    corstr?: string;
    std_err?: string;
    scale_fix?: boolean;
    scale_value?: number;
    control?: {
      epsilon?: number;
      max_iter?: number;
      trace?: boolean;
    };
  };
}

// R-compatible parameters with dot notation for alternatives
interface RGeeglmTestParameters extends Omit<GeeglmTestParameters, "options"> {
  options?: Omit<GeeglmTestParameters["options"], "control"> & {
    control?: {
      epsilon?: number;
      max_iter?: number;
      trace?: boolean;
    };
  };
}

export interface GeeglmTestResult {
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
  rank?: number;
  method?: string;
  family?: string;
  call?: string;
  formula?: string;
  gee_info?: {
    working_correlation: {
      structure: string;
      parameters: number[];
    };
    cluster_info: {
      n_clusters: number;
      max_cluster_size: number;
      cluster_sizes: number[];
    };
    gee_params: {
      alpha: number[];
      gamma: number[];
    };
    robust_vcov?: number[][];
    iterations: number;
    converged: boolean;
  };
  correlation_structure?: string;
  cluster_ids?: number[];
  std_error_type?: string;
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

// =====================================================================================
// Data Generation Functions
// =====================================================================================

function generateNormalData(n: number, mean: number, std: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < n; i++) {
    // Box-Muller transform
    const u1 = random();
    const u2 = random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    result.push(z0 * std + mean);
  }
  return result;
}

function generateBinomialData(n: number, p: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < n; i++) {
    result.push(random() < p ? 1 : 0);
  }
  return result;
}

function generatePoissonData(n: number, lambda: number): number[] {
  const result: number[] = [];
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
    result.push(k);
  }
  return result;
}

function generateMultiPredictorData(sampleSize: number, numPredictors: number) {
  const predictors: { [key: string]: number[] } = {};
  let formula = "y ~ ";

  for (let i = 1; i <= numPredictors; i++) {
    const varName = `x${i}`;
    predictors[varName] = generateNormalData(sampleSize, 0, 1);
    if (i > 1) formula += " + ";
    formula += varName;
  }

  return { predictors, formula };
}

// =====================================================================================
// Test Case Generation (following regression pattern exactly)
// =====================================================================================

export function generateGeeglmTestCase(
  testType: string,
  sampleSize: number,
): GeeglmTestParameters {
  const alphas = [0.05, 0.01, 0.10];
  const alpha = alphas[Math.floor(random() * alphas.length)];

  // Generate random number of clusters (5-15)
  const numClusters = 5 + Math.floor(random() * 11);
  const clusterSize = Math.floor(sampleSize / numClusters);
  const actualSampleSize = clusterSize * numClusters;

  // Generate cluster IDs
  const id: number[] = [];
  for (let i = 0; i < numClusters; i++) {
    for (let j = 0; j < clusterSize; j++) {
      id.push(i + 1);
    }
  }

  // Generate predictor variables (2-3 predictors)
  const numPredictors = 2 + Math.floor(random() * 2);
  const { predictors, formula } = generateMultiPredictorData(
    actualSampleSize,
    numPredictors,
  );

  // Generate response variable based on test type
  const x1 = predictors.x1 || [];
  const x2 = predictors.x2 || [];
  const x3 = predictors.x3 || [];

  const y: number[] = [];
  for (let i = 0; i < actualSampleSize; i++) {
    let linearPredictor = 0.5 + 0.8 * x1[i] + 0.3 * x2[i];
    if (x3.length > 0) {
      linearPredictor += 0.2 * x3[i];
    }

    // Add cluster-level random effect
    const clusterId = id[i] - 1;
    const clusterEffect = (clusterId % 3 - 1) * 0.5; // Simple cluster effect
    linearPredictor += clusterEffect;

    let mu: number;
    let response: number;

    // Generate response based on test type
    if (testType.includes("gaussian")) {
      mu = linearPredictor;
      response = generateNormalData(1, mu, 0.5)[0];
    } else if (testType.includes("binomial")) {
      mu = 1 / (1 + Math.exp(-linearPredictor));
      response = generateBinomialData(1, mu)[0];
    } else if (testType.includes("poisson")) {
      mu = Math.exp(linearPredictor);
      response = generatePoissonData(1, mu)[0];
    } else {
      mu = linearPredictor;
      response = generateNormalData(1, mu, 0.5)[0];
    }

    y.push(response);
  }

  // Determine family and link from test type
  let family = "gaussian";
  let link = "identity";
  let corstr = "independence";

  if (testType.includes("binomial")) {
    family = "binomial";
    if (testType.includes("logit")) {
      link = "logit";
    } else if (testType.includes("probit")) {
      link = "probit";
    } else {
      link = "logit";
    }
  } else if (testType.includes("poisson")) {
    family = "poisson";
    if (testType.includes("log")) {
      link = "log";
    } else if (testType.includes("identity")) {
      link = "identity";
    } else {
      link = "log";
    }
  } else if (testType.includes("gaussian")) {
    family = "gaussian";
    if (testType.includes("identity")) {
      link = "identity";
    } else if (testType.includes("log")) {
      link = "log";
    } else {
      link = "identity";
    }
  }

  // Determine correlation structure
  if (testType.includes("independence")) {
    corstr = "independence";
  } else if (testType.includes("exchangeable")) {
    corstr = "exchangeable";
  } else if (testType.includes("ar1")) {
    corstr = "ar1";
  } else {
    corstr = "independence";
  }

  return {
    testType,
    data: {
      ...predictors,
      y,
      id,
      formula,
    },
    options: {
      family,
      link,
      corstr,
      alpha,
    },
  };
}

// =====================================================================================
// R and Rust Call Functions
// =====================================================================================

// Call R geeglm implementation
export async function callRobustR(
  params: GeeglmTestParameters,
): Promise<GeeglmTestResult> {
  // Convert parameters to R format
  const rParams = structuredClone(params) as RGeeglmTestParameters;

  const paramJson = JSON.stringify(rParams);

  // Get the directory of the current file using import.meta.url
  const currentDir = new URL(".", import.meta.url).pathname;
  const rScriptPath = `${currentDir}gee-test-runner.R`;

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
      // deno-lint-ignore no-explicit-any
      (parsed as any).warnings = warnings;
    }
    return parsed;
  } catch (parseError) {
    console.error("JSON parse error:", parseError);
    console.error("R stdout:", output);
    console.error("R stderr:", stderrText);
    const errorMessage = parseError instanceof Error
      ? parseError.message
      : String(parseError);
    throw new Error(`Failed to parse R output: ${errorMessage}`);
  }
}

// Call Rust GEE implementation
export async function callRobustRust(
  params: GeeglmTestParameters,
): Promise<GeeglmTestResult> {
  try {
    // Import the GEE functions from WASM bindings
    const { geeglmFit } = await import(
      "../../src/dataframe/ts/wasm/stats-functions.ts"
    );

    const data = params.data || {};
    const options = params.options || {};

    // Prepare data for Rust
    const dataMap: { [key: string]: number[] } = {};
    Object.keys(data).forEach((key) => {
      if (Array.isArray(data[key]) && key !== "id" && key !== "waves") {
        dataMap[key] = data[key] as number[];
      }
    });

    // Call the Rust geeglm function
    const result = geeglmFit(
      data.formula || "y ~ x1",
      options.family || "gaussian",
      options.link || "identity",
      dataMap,
      data.id || [],
      data.waves || null,
      // deno-lint-ignore no-explicit-any
      (options.corstr || "independence") as any,
      // deno-lint-ignore no-explicit-any
      (options.std_err || "san.se") as any,
      options.control
        ? {
          epsilon: options.control.epsilon,
          max_iter: options.control.max_iter,
          trace: options.control.trace,
        }
        : undefined,
    );

    // Convert to our expected format
    return {
      coefficients: result.coefficients,
      residuals: result.residuals,
      fitted_values: result.fitted_values,
      deviance: 0, // Not available in current interface
      aic: 0, // Not available in current interface
      r_squared: 0, // Not available in current interface
      df_residual: 0, // Not available in current interface
      df_null: 0, // Not available in current interface
      rank: result.coefficients.length,
      gee_info: {
        working_correlation: {
          structure: result.correlation_structure,
          parameters: [],
        },
        cluster_info: {
          n_clusters: result.cluster_info.n_clusters,
          max_cluster_size: result.cluster_info.max_cluster_size,
          cluster_sizes: [],
        },
        gee_params: {
          alpha: [],
          gamma: [1.0],
        },
        robust_vcov: result.vcov || undefined,
        iterations: 0,
        converged: true,
      },
      correlation_structure: result.correlation_structure,
      cluster_ids: data.id || [],
      std_error_type: result.std_err,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Rust GEE call failed: ${errorMessage}`);
  }
}

// Legacy function names for compatibility
export const callRGeeglm = callRobustR;
export const callRustGeeglm = callRobustRust;
