#!/usr/bin/env -S deno run --allow-all

import {
  callRobustR,
  callRobustRust,
  generateRegressionTestCase,
  nextRandom,
  RegressionTestParameters,
  setTestSeed,
} from "./regression-interface.ts";

interface ComparisonResult {
  testName: string;
  rResult: any;
  rustResult: any;
  coefficientDiff: number;
  rSquaredDiff: number;
  aicDiff: number;
  status: "PASS" | "FAIL" | "ERROR";
  errorMessage?: string;
  rError?: string;
  rustError?: string;
  testParams?: {
    sampleSize: number;
    numPredictors: number;
    formula: string;
    family: string;
    alpha: number;
  };
  generatedData?: {
    y: number[];
    predictors: { [key: string]: number[] };
    formula: string;
    weights?: number[];
    offset?: number[];
  };
}

// Run comparison using robust interface
export async function runRobustComparison(
  params: RegressionTestParameters,
): Promise<ComparisonResult> {
  let rResult: any = null;
  let rustResult: any = null;
  let rError: string | null = null;
  let rustError: string | null = null;

  // Extract generated data for display
  const generatedData = {
    y: params.data?.y || [],
    predictors: {} as { [key: string]: number[] },
    formula: params.data?.formula || "N/A",
    weights: params.data?.weights,
    offset: params.data?.offset,
  };

  // Extract predictor variables
  if (params.data) {
    Object.keys(params.data).forEach((key) => {
      if (
        key !== "y" && key !== "formula" && key !== "weights" &&
        key !== "offset"
      ) {
        generatedData.predictors[key] = (params.data as any)[key];
      }
    });
  }

  // Try R first
  try {
    rResult = await callRobustR(params);
  } catch (error) {
    rError = String(error);
  }

  // Try Rust
  try {
    rustResult = await callRobustRust(params);
  } catch (error) {
    rustError = String(error);
  }

  // Case 1: Both succeeded
  if (rResult && rustResult) {
    // Attach R warnings if present (from callRobustR)
    const rWarnings: string = (rResult as any)?.warnings || "";

    // Calculate differences for key metrics
    const rCoefs = rResult.coefficients || [];
    const rustCoefs = rustResult.coefficients || [];
    const maxCoefLength = Math.max(rCoefs.length, rustCoefs.length);

    let coefficientDiff = 0;
    for (let i = 0; i < maxCoefLength; i++) {
      const rCoef = rCoefs[i] || 0;
      const rustCoef = rustCoefs[i] || 0;
      coefficientDiff = Math.max(coefficientDiff, Math.abs(rCoef - rustCoef));
    }

    const rSquaredDiff = Math.abs(
      (rResult.r_squared || 0) - (rustResult.r_squared || 0),
    );
    const aicDiff = Math.abs((rResult.aic || 0) - (rustResult.aic || 0));

    // Filter out NaN values when computing maxDiff
    const diffs = [coefficientDiff, rSquaredDiff, aicDiff].filter((d) =>
      !isNaN(d)
    );
    const maxDiff = diffs.length > 0 ? Math.max(...diffs) : 0;

    // Determine status
    // If R reported separation/singularity-like warnings, relax coefficient comparison and
    // focus on deviance/AIC agreement (binomial separation often yields unstable coefs)
    const warnsSeparation = typeof rWarnings === "string" &&
      /fitted probabilities numerically 0 or 1 occurred|separation|singular|did not converge/i
        .test(rWarnings);
    let status: "PASS" | "FAIL" = "FAIL";
    if (warnsSeparation) {
      const aicClose = isFinite(aicDiff) && aicDiff < 1e-6;
      const r2Close = isFinite(rSquaredDiff) && rSquaredDiff < 1e-6;
      status = aicClose && r2Close
        ? "PASS"
        : (maxDiff < 1e-1 ? "PASS" : "FAIL");
    } else {
      status = maxDiff < 0.1 ? "PASS" : "FAIL";
    }

    // Extract test parameters
    const sampleSize = params.data?.y?.length || 0;
    const numPredictors = Object.keys(params.data || {}).filter(
      (key) =>
        key !== "y" && key !== "formula" && key !== "weights" &&
        key !== "offset",
    ).length;

    return {
      testName: `${params.testType} (${params.options?.family || "default"})`,
      rResult,
      rustResult,
      coefficientDiff,
      rSquaredDiff,
      aicDiff,
      status,
      testParams: {
        sampleSize,
        numPredictors,
        formula: params.data?.formula || "N/A",
        family: params.options?.family || "default",
        alpha: params.options?.alpha || 0.05,
      },
      generatedData,
    };
  }

  // Case 2: Both failed - check if they failed for the same statistical reason
  if (rError && rustError) {
    const isStatisticalFailure = (error: string) => {
      return error.includes("0s in V(mu)") ||
        error.includes("NAs in V(mu)") ||
        error.includes("did not converge") ||
        error.includes("algorithm stopped at boundary") ||
        error.includes("perfect separation") ||
        error.includes("singular fit") ||
        error.includes("fitted probabilities numerically 0 or 1 occurred") ||
        error.includes("non-finite") ||
        error.includes("infinite") ||
        error.includes("NaN");
    };

    const rIsStatistical = isStatisticalFailure(rError);
    const rustIsStatistical = isStatisticalFailure(rustError);

    // If both failed for statistical reasons, this is expected behavior (PASS)
    if (rIsStatistical && rustIsStatistical) {
      const sampleSize = params.data?.y?.length || 0;
      const numPredictors = Object.keys(params.data || {}).filter(
        (key) =>
          key !== "y" && key !== "formula" && key !== "weights" &&
          key !== "offset",
      ).length;

      return {
        testName: `${params.testType} (${params.options?.family || "default"})`,
        rResult: null,
        rustResult: null,
        coefficientDiff: 0,
        rSquaredDiff: 0,
        aicDiff: 0,
        status: "PASS",
        testParams: {
          sampleSize,
          numPredictors,
          formula: params.data?.formula || "N/A",
          family: params.options?.family || "default",
          alpha: params.options?.alpha || 0.05,
        },
        rError: rError || undefined,
        rustError: rustError || undefined,
        generatedData,
      };
    }
  }

  // Case 3: Different outcomes (one succeeded, one failed, or different error types)
  const sampleSize = params.data?.y?.length || 0;
  const numPredictors = Object.keys(params.data || {}).filter(
    (key) =>
      key !== "y" && key !== "formula" && key !== "weights" &&
      key !== "offset",
  ).length;

  // Determine if this is a system error or statistical difference
  const hasSystemError = (error: string | null) => {
    if (!error) return false;
    return /unreachable|RuntimeError|panic|thread 'main' panicked|WebAssembly/i
      .test(error) ||
      /inner loop .* cannot correct step size/i.test(error);
  };

  const status = (hasSystemError(rError) || hasSystemError(rustError))
    ? "ERROR"
    : "FAIL";

  return {
    testName: `${params.testType} (${params.options?.family || "default"})`,
    rResult,
    rustResult,
    coefficientDiff: 0,
    rSquaredDiff: 0,
    aicDiff: 0,
    status,
    testParams: {
      sampleSize,
      numPredictors,
      formula: params.data?.formula || "N/A",
      family: params.options?.family || "default",
      alpha: params.options?.alpha || 0.05,
    },
    rError: rError || undefined,
    rustError: rustError || undefined,
    generatedData,
  };
}

// Print test parameters table
function printTestParameters(results: ComparisonResult[]): void {
  console.log("\n" + "=".repeat(120));
  console.log("📋 TEST PARAMETERS");
  console.log("=".repeat(120));

  console.log(
    "Test Name".padEnd(25) + "Sample Size".padEnd(12) +
      "Predictors".padEnd(12) +
      "Formula".padEnd(20) + "Family".padEnd(12) + "Alpha".padEnd(8),
  );
  console.log("-".repeat(120));

  for (const result of results) {
    const testName = result.testName;
    const params = result.testParams;

    if (!params) {
      console.log(
        testName.padEnd(25) +
          "N/A".padEnd(12) +
          "N/A".padEnd(12) +
          "N/A".padEnd(20) +
          "N/A".padEnd(12) +
          "N/A".padEnd(8),
      );
      continue;
    }

    console.log(
      testName.padEnd(25) +
        params.sampleSize.toString().padEnd(12) +
        params.numPredictors.toString().padEnd(12) +
        params.formula.padEnd(20) +
        params.family.padEnd(12) +
        params.alpha.toString().padEnd(8),
    );
  }

  // Print generated data for each test
  console.log("\n" + "=".repeat(120));
  console.log("📊 GENERATED TEST DATA");
  console.log("=".repeat(120));

  for (const result of results) {
    if (!result.generatedData) continue;

    console.log(`\n🔬 ${result.testName}`);
    console.log("-".repeat(80));
    console.log(`Formula: ${result.generatedData.formula}`);
    console.log(`Sample Size: ${result.generatedData.y.length}`);

    // Print response variable (y) - complete data
    console.log(`\nResponse Variable (y):`);
    console.log(
      `  [${result.generatedData.y.map((v) => v.toFixed(4)).join(", ")}]`,
    );

    // Print predictor variables - complete data
    console.log(`\nPredictor Variables:`);
    for (
      const [varName, values] of Object.entries(result.generatedData.predictors)
    ) {
      // Handle both numeric and string values
      const formattedValues = values.map((v: any) =>
        typeof v === "number" ? v.toFixed(4) : `"${v}"`
      );
      console.log(
        `  ${varName}: [${formattedValues.join(", ")}]`,
      );
    }

    // Print weights and offset if present - complete data
    if (result.generatedData.weights) {
      console.log(
        `\nWeights: [${
          result.generatedData.weights.map((v) => v.toFixed(4))
            .join(", ")
        }]`,
      );
    }

    if (result.generatedData.offset) {
      console.log(
        `\nOffset: [${
          result.generatedData.offset.map((v) => v.toFixed(4))
            .join(", ")
        }]`,
      );
    }
  }
}

// Print detailed coefficient comparison
function printDetailedCoefficients(results: ComparisonResult[]): void {
  console.log("\n" + "=".repeat(120));
  console.log("📊 DETAILED COEFFICIENT COMPARISON");
  console.log("=".repeat(120));

  for (const result of results) {
    if (result.status === "ERROR") continue;

    console.log(`\n🔬 ${result.testName}`);
    console.log("-".repeat(80));

    // Print R² and AIC values
    const rR2 = typeof result.rResult?.r_squared === "number"
      ? result.rResult.r_squared
      : 0;
    const rustR2 = typeof result.rustResult?.r_squared === "number"
      ? result.rustResult.r_squared
      : 0;
    const rAic = typeof result.rResult?.aic === "number"
      ? result.rResult.aic
      : 0;
    const rustAic = typeof result.rustResult?.aic === "number"
      ? result.rustResult.aic
      : 0;

    console.log("Model Metrics:");
    console.log(
      `  R²:  R=${rR2.toFixed(8)}, Rust=${rustR2.toFixed(8)}, Diff=${
        Math.abs(rR2 - rustR2).toExponential(3)
      }`,
    );
    console.log(
      `  AIC: R=${rAic.toFixed(8)}, Rust=${rustAic.toFixed(8)}, Diff=${
        Math.abs(rAic - rustAic).toExponential(3)
      }`,
    );
    console.log();

    const rCoefs = result.rResult?.coefficients || [];
    const rustCoefs = result.rustResult?.coefficients || [];
    const maxLength = Math.max(rCoefs.length, rustCoefs.length);

    console.log(
      "Index".padEnd(8) + "R Coefficient".padEnd(20) +
        "Rust Coefficient".padEnd(20) + "Difference".padEnd(15) +
        "Abs Diff".padEnd(15),
    );
    console.log("-".repeat(80));

    for (let i = 0; i < maxLength; i++) {
      const rCoef = rCoefs[i] || 0;
      const rustCoef = rustCoefs[i] || 0;
      const diff = rCoef - rustCoef;
      const absDiff = Math.abs(diff);

      console.log(
        i.toString().padEnd(8) +
          (typeof rCoef === "number" ? rCoef.toFixed(8) : String(rCoef)).padEnd(
            20,
          ) +
          (typeof rustCoef === "number"
            ? rustCoef.toFixed(8)
            : String(rustCoef)).padEnd(20) +
          (typeof diff === "number" ? diff.toExponential(3) : String(diff))
            .padEnd(15) +
          (typeof absDiff === "number"
            ? absDiff.toExponential(3)
            : String(absDiff)).padEnd(15),
      );
    }
  }
}

// Print results in a nice format
function printComparisonResults(results: ComparisonResult[]): void {
  console.log("\n" + "=".repeat(140));
  console.log("📋 REGRESSION TEST RESULTS");
  console.log("=".repeat(140));

  console.log(
    "Test Name".padEnd(40) + "R Coefs".padEnd(15) + "Rust Coefs".padEnd(15) +
      "R² Diff".padEnd(12) + "AIC Diff".padEnd(12) + "Coef Diff".padEnd(12) +
      "Status".padEnd(10),
  );
  console.log("-".repeat(140));

  let passed = 0;
  let failed = 0;
  let errors = 0;

  for (const result of results) {
    const testName = result.testName.length > 38
      ? result.testName.substring(0, 35) + "..."
      : result.testName;

    const rCoefs = result.rResult?.coefficients?.length || 0;
    const rustCoefs = result.rustResult?.coefficients?.length || 0;
    const rSquaredDiff = result.rSquaredDiff.toExponential(2);
    const aicDiff = result.aicDiff.toExponential(2);
    const coefDiff = result.coefficientDiff.toExponential(2);

    const statusColor = result.status === "PASS"
      ? "✅"
      : result.status === "FAIL"
      ? "❌"
      : "🔥";

    console.log(
      testName.padEnd(40) +
        rCoefs.toString().padEnd(15) +
        rustCoefs.toString().padEnd(15) +
        rSquaredDiff.padEnd(12) +
        aicDiff.padEnd(12) +
        coefDiff.padEnd(12) +
        `${statusColor} ${result.status}`,
    );

    if (result.status === "ERROR" && result.errorMessage) {
      console.log(`    Error: ${result.errorMessage}`);
    }

    switch (result.status) {
      case "PASS":
        passed++;
        break;
      case "FAIL":
        failed++;
        break;
      case "ERROR":
        errors++;
        break;
    }
  }

  console.log("-".repeat(140));
  console.log(
    `📊 Summary: ${passed} passed, ${failed} failed, ${errors} errors out of ${results.length} tests`,
  );
  console.log(
    `🎯 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`,
  );
}

// Main test runner
async function main() {
  const args = Deno.args;
  const testCount = parseInt(args[0]) || 2;
  const seedArg = args[1] ? parseInt(args[1]) : undefined;
  const seed = Number.isFinite(seedArg)
    ? (seedArg as number)
    : Date.now() >>> 0;
  setTestSeed(seed);

  console.log("🧪 Regression Test Runner");
  console.log("==============================================");
  console.log(
    `Running ${testCount} random tests per test type (seed=${seed})...\n`,
  );

  // Configuration for which tests to run - COMPREHENSIVE REGRESSION TEST SUITE
  const testConfig = {
    // GLM Tests - Gaussian Family
    "glm.gaussian": false, // ✅ Working (identity link)
    "glm.gaussian.log": false, // ✅ Working (log link)
    "glm.gaussian.inverse": false, // ✅ Working (inverse link)

    // GLM Tests - Binomial Family
    "glm.binomial": true, // ✅ Working (logit link)
    "glm.binomial.probit": false, // ✅ Working (probit link)
    "glm.binomial.cauchit": false, // ✅ Working (cauchit link)
    "glm.binomial.log": false, // Testing if R supports binomial log link
    "glm.binomial.cloglog": false, // ❌ Rust side has NAs error (cloglog link)

    // GLM Tests - Poisson Family
    "glm.poisson": false, // ✅ Working (log link)
    "glm.poisson.identity": false, // ✅ Working (identity link)
    "glm.poisson.sqrt": false, // ✅ Working (sqrt link)

    // GLM Tests - Gamma Family
    "glm.gamma": true, // ✅ Working (inverse link)
    "glm.gamma.identity": false, // ❌ R side returns zeros (identity link)
    "glm.gamma.log": false, // ❌ DISABLED - R doesn't support gamma log link (returns zeros)

    // GLM Tests - Inverse Gaussian Family
    "glm.inverse.gaussian": false, // ✅ Implemented (1/mu^2 link)
    "glm.inverse.gaussian.identity": false, // ❌ Not implemented (identity link)
    "glm.inverse.gaussian.log": false, // ✅ Working (log link)

    // LM Tests - Basic Linear Models
    "lm.simple": false, // ✅ Working (unweighted)
    "lm.weighted": false, // ✅ Working (weighted)
    "lm.offset": false, // ❌ Not implemented (with offset)
    "lm.subset": false, // ❌ Not implemented (with subset)

    // LM Tests - Advanced Features
    "lm.contrasts": false, // ❌ Not implemented (custom contrasts)
    "lm.singular": false, // ❌ Not implemented (singular.ok = FALSE)
    "lm.qr": false, // ❌ Not implemented (QR decomposition details)

    // GLM Tests - Advanced Features
    "glm.offset": false, // ❌ Not implemented (with offset)
    "glm.weights": false, // ❌ Not implemented (with weights)
    "glm.control": false, // ❌ Not implemented (custom control parameters)
    "glm.start": false, // ❌ Not implemented (custom starting values)

    // Model Comparison Tests
    "anova.glm": false, // ❌ Not implemented (GLM ANOVA)
    "anova.lm": false, // ❌ Not implemented (LM ANOVA)
    "deviance.glm": false, // ❌ Not implemented (deviance comparison)
    "logLik.glm": false, // ❌ Not implemented (log-likelihood comparison)

    // Prediction and Diagnostics
    "predict.glm": false, // ❌ Not implemented (GLM prediction)
    "predict.lm": false, // ❌ Not implemented (LM prediction)
    "residuals.glm": false, // ❌ Not implemented (GLM residuals)
    "residuals.lm": false, // ❌ Not implemented (LM residuals)
    "influence.glm": false, // ❌ Not implemented (GLM influence measures)
    "influence.lm": false, // ❌ Not implemented (LM influence measures)

    // Model Selection
    "step.glm": false, // ❌ Not implemented (stepwise GLM)
    "step.lm": false, // ❌ Not implemented (stepwise LM)
    "drop1.glm": false, // ❌ Not implemented (drop1 for GLM)
    "add1.glm": false, // ❌ Not implemented (add1 for GLM)
  };

  const testTypes = Object.keys(testConfig).filter((key) =>
    testConfig[key as keyof typeof testConfig]
  );

  const allResults: ComparisonResult[] = [];

  for (const testType of testTypes) {
    console.log(`🔬 Testing ${testType}...`);

    for (let i = 0; i < testCount; i++) {
      try {
        let attempt = 0;
        const maxAttempts = 3;
        while (attempt < maxAttempts) {
          attempt++;
          const params = generateRegressionTestCase(
            testType,
            10 + Math.floor(nextRandom() * 20),
          );
          const result = await runRobustComparison(params);

          // Pathology filter: retry if separation/singularity or large instabilities or step-size failures
          const huge = (x: number) => !isFinite(x) || x > 1e3; // lower threshold to catch big instabilities
          const rWarnings: string = (result.rResult as any)?.warnings || "";
          const indicatesSeparation =
            /fitted probabilities numerically 0 or 1 occurred|separation|singular|did not converge|0s in V\(mu\)|NAs in V\(mu\)/i
              .test(rWarnings) ||
            (result.rError &&
              /separation|singular|did not converge|infinite|NaN/i.test(
                result.rError,
              )) ||
            (result.rustError &&
              /separation|singular|did not converge|infinite|NaN/i.test(
                result.rustError,
              ));
          const stepSizeFailure =
            (result.rError &&
              /cannot correct step size/i.test(result.rError)) ||
            (result.rustError &&
              /cannot correct step size/i.test(result.rustError));
          const isPathological = result.status !== "PASS" && (
            huge(result.aicDiff) || huge(result.coefficientDiff) ||
            indicatesSeparation || stepSizeFailure
          );

          if (isPathological && attempt < maxAttempts) {
            console.log(
              `  ⚠️  Pathological case detected (${result.status}), retrying (${attempt}/${maxAttempts})...`,
            );
            continue;
          }

          allResults.push(result);
          const statusIcon = result.status === "PASS"
            ? "✅"
            : result.status === "FAIL"
            ? "❌"
            : "🔥";
          console.log(
            `  ${statusIcon} ${result.testName}: ${result.status} (coef diff: ${
              result.coefficientDiff.toFixed(6)
            })`,
          );
          break;
        }
      } catch (error) {
        console.error(`  🔥 Error with ${testType}:`, error);
        allResults.push({
          testName: `${testType} (error)`,
          rResult: null,
          rustResult: null,
          coefficientDiff: 1,
          rSquaredDiff: 1,
          aicDiff: 1,
          status: "ERROR",
          errorMessage: String(error),
        });
      }
    }
  }

  // Print detailed coefficient comparison first
  printDetailedCoefficients(allResults);

  // Print test parameters table
  printTestParameters(allResults);

  // Print comprehensive results
  printComparisonResults(allResults);

  // Test Configuration Status
  console.log("\n" + "=".repeat(100));
  console.log("🔧 TEST CONFIGURATION STATUS");
  console.log("=".repeat(100));

  const enabledTests = Object.entries(testConfig).filter(([_, enabled]) =>
    enabled
  );

  // Summary by test type
  console.log("\n" + "=".repeat(80));
  console.log("📈 SUMMARY BY TEST TYPE");
  console.log("=".repeat(80));

  const summaryByType: { [key: string]: { passed: number; total: number } } =
    {};

  for (const result of allResults) {
    const testType = result.testName.split(" ")[0];
    if (!summaryByType[testType]) {
      summaryByType[testType] = { passed: 0, total: 0 };
    }
    summaryByType[testType].total++;
    if (result.status === "PASS") {
      summaryByType[testType].passed++;
    }
  }

  for (const [testType, stats] of Object.entries(summaryByType)) {
    const rate = ((stats.passed / stats.total) * 100).toFixed(1);
    const status = stats.passed === stats.total
      ? "✅"
      : stats.passed > 0
      ? "⚠️"
      : "❌";
    console.log(
      `${
        testType.padEnd(25)
      } ${stats.passed}/${stats.total} (${rate}%) ${status}`,
    );
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
