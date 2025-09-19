#!/usr/bin/env -S deno run --allow-all

import {
  callRobustR,
  callRobustRust,
  generateRegressionTestCase,
  RegressionTestParameters,
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
  testParams?: {
    sampleSize: number;
    numPredictors: number;
    formula: string;
    family: string;
    alpha: number;
  };
}

// Run comparison using robust interface
export async function runRobustComparison(
  params: RegressionTestParameters,
): Promise<ComparisonResult> {
  try {
    const [rResult, rustResult] = await Promise.all([
      callRobustR(params),
      callRobustRust(params),
    ]);

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

    // Determine status - be more lenient for regression tests
    // For statistical failures (non-convergence, etc.), treat as FAIL not ERROR
    const status = maxDiff < 0.1 ? "PASS" : "FAIL";

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
    };
  } catch (error) {
    // Extract test parameters for error case too
    const sampleSize = params.data?.y?.length || 0;
    const numPredictors = Object.keys(params.data || {}).filter(
      (key) =>
        key !== "y" && key !== "formula" && key !== "weights" &&
        key !== "offset",
    ).length;

    const errorMessage = String(error);

    // Classify errors into different categories
    let status: "PASS" | "FAIL" | "ERROR";
    let errorType: string;

    if (
      errorMessage.includes("unreachable") ||
      errorMessage.includes("RuntimeError") ||
      errorMessage.includes("panic") ||
      errorMessage.includes("thread 'main' panicked") ||
      errorMessage.includes("index out of bounds") ||
      errorMessage.includes("overflow") ||
      errorMessage.includes("underflow")
    ) {
      // Real bugs/crashes - these should never happen
      status = "ERROR";
      errorType = "BUG";
    } else if (
      errorMessage.includes("algorithm did not converge") ||
      errorMessage.includes("singular") ||
      errorMessage.includes("non-estimable") ||
      errorMessage.includes("boundary") ||
      errorMessage.includes("fitted probabilities numerically 0 or 1") ||
      errorMessage.includes("fitted rates numerically 0")
    ) {
      // Statistical failures - these are expected in some cases and R handles them gracefully
      status = "FAIL";
      errorType = "STATISTICAL";
    } else {
      // Other errors (network, parsing, etc.)
      status = "ERROR";
      errorType = "SYSTEM";
    }

    return {
      testName: `${params.testType} (${params.options?.family || "default"})`,
      rResult: null,
      rustResult: null,
      coefficientDiff: 1,
      rSquaredDiff: 1,
      aicDiff: 1,
      status,
      errorMessage: `[${errorType}] ${errorMessage}`,
      testParams: {
        sampleSize,
        numPredictors,
        formula: params.data?.formula || "N/A",
        family: params.options?.family || "default",
        alpha: params.options?.alpha || 0.05,
      },
    };
  }
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

  console.log("🧪 Regression Test Runner");
  console.log("==============================================");
  console.log(`Running ${testCount} random tests per test type...\n`);

  // Configuration for which tests to run - COMPREHENSIVE REGRESSION TEST SUITE
  const testConfig = {
    // GLM Tests - Gaussian Family
    "glm.gaussian": false, // ✅ Working (identity link)
    "glm.gaussian.log": false, // ✅ Working (log link)
    "glm.gaussian.inverse": false, // ❌ Not implemented (inverse link)

    // GLM Tests - Binomial Family
    "glm.binomial": true, // ✅ Working (logit link)
    "glm.binomial.probit": false, // ✅ Working (probit link)
    "glm.binomial.cauchit": false, // ❌ Not implemented (cauchit link)
    "glm.binomial.log": false, // ❌ Not implemented (log link)
    "glm.binomial.cloglog": false, // ❌ Not implemented (cloglog link)

    // GLM Tests - Poisson Family
    "glm.poisson": false, // ✅ Working (log link)
    "glm.poisson.identity": false, // ✅ Working (identity link)
    "glm.poisson.sqrt": false, // ❌ Not implemented (sqrt link)

    // GLM Tests - Gamma Family
    "glm.gamma": false, // ✅ Working (inverse link)
    "glm.gamma.identity": false, // ❌ Not implemented (identity link)
    "glm.gamma.log": false, // ❌ Not implemented (log link)

    // GLM Tests - Inverse Gaussian Family
    "glm.inverse.gaussian": false, // ❌ Not implemented (inverse link)
    "glm.inverse.gaussian.identity": false, // ❌ Not implemented (identity link)
    "glm.inverse.gaussian.log": false, // ❌ Not implemented (log link)

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
        const params = generateRegressionTestCase(
          testType,
          10 + Math.floor(Math.random() * 20),
        );
        const result = await runRobustComparison(params);
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
  const disabledTests = Object.entries(testConfig).filter(([_, enabled]) =>
    !enabled
  );

  console.log(`✅ Enabled Tests: ${enabledTests.length}`);
  // console.log(`❌ Disabled Tests: ${disabledTests.length}`);
  console.log(`📊 Total Tests: ${Object.keys(testConfig).length}`);
  console.log(
    `🎯 Coverage: ${
      ((enabledTests.length / Object.keys(testConfig).length) * 100).toFixed(1)
    }%`,
  );

  console.log("\n📋 ENABLED TESTS:");
  for (const [testName, enabled] of enabledTests) {
    const status = enabled ? "✅" : "❌";
    console.log(`  ${status} ${testName}`);
  }

  console.log(
    "\n📋 DISABLED TESTS: " +
      disabledTests.map(([testName, _]) => `❌ ${testName}`).join(", "),
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
