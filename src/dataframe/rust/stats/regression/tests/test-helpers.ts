// Shared test helper functions for regression and GEE test runners

export interface TestResult {
  testName: string;
  // deno-lint-ignore no-explicit-any
  rResult: any;
  // deno-lint-ignore no-explicit-any
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
    numPredictors?: number;
    numClusters?: number;
    formula: string;
    family: string;
    corstr?: string;
    alpha: number;
  };
  generatedData?: {
    y: number[];
    predictors: { [key: string]: number[] };
    formula: string;
    id?: number[];
    weights?: number[];
    offset?: number[];
  };
}

// Print test parameters table
export function printTestParameters(results: TestResult[]): void {
  console.log("\n" + "=".repeat(120));
  console.log("📋 TEST PARAMETERS");
  console.log("=".repeat(120));

  console.log(
    "Test Name".padEnd(25) + "Sample Size".padEnd(12) +
      "Predictors".padEnd(12) + "Clusters".padEnd(12) +
      "Formula".padEnd(20) + "Family".padEnd(12) + "Corstr".padEnd(12) +
      "Alpha".padEnd(8),
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
          "N/A".padEnd(12) +
          "N/A".padEnd(20) +
          "N/A".padEnd(12) +
          "N/A".padEnd(12) +
          "N/A".padEnd(8),
      );
      continue;
    }

    console.log(
      testName.padEnd(25) +
        params.sampleSize.toString().padEnd(12) +
        (params.numPredictors?.toString() || "N/A").padEnd(12) +
        (params.numClusters?.toString() || "N/A").padEnd(12) +
        params.formula.padEnd(20) +
        params.family.padEnd(12) +
        (params.corstr || "N/A").padEnd(12) +
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

    if (result.generatedData.id) {
      console.log(
        `Clusters: ${
          result.generatedData.id.length > 0
            ? Math.max(...result.generatedData.id)
            : 0
        }`,
      );
    }

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
      // deno-lint-ignore no-explicit-any
      const formattedValues = values.map((v: any) =>
        typeof v === "number" ? v.toFixed(4) : `"${v}"`
      );
      console.log(
        `  ${varName}: [${formattedValues.join(", ")}]`,
      );
    }

    // Print cluster IDs if present
    if (result.generatedData.id) {
      console.log(`\nCluster IDs:`);
      console.log(
        `  [${result.generatedData.id.join(", ")}]`,
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
export function printDetailedCoefficients(results: TestResult[]): void {
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
export function printComparisonResults(results: TestResult[]): void {
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

// Print summary by test type
export function printSummaryByType(results: TestResult[]): void {
  console.log("\n" + "=".repeat(80));
  console.log("📈 SUMMARY BY TEST TYPE");
  console.log("=".repeat(80));

  const summaryByType: { [key: string]: { passed: number; total: number } } =
    {};

  for (const result of results) {
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

// Check if a case is pathological and should be retried
export function isPathologicalCase(result: TestResult): boolean {
  const huge = (x: number) => !isFinite(x) || x > 1e3; // lower threshold to catch big instabilities
  // deno-lint-ignore no-explicit-any
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
  const stepSizeFailure = Boolean(
    (result.rError &&
      /cannot correct step size/i.test(result.rError)) ||
      (result.rustError &&
        /cannot correct step size/i.test(result.rustError)),
  );

  return result.status !== "PASS" && (
    huge(result.aicDiff) || huge(result.coefficientDiff) ||
    indicatesSeparation || stepSizeFailure
  );
}

// Check if an error is a statistical failure (both R and Rust should fail the same way)
export function isStatisticalFailure(error: string): boolean {
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
}

// Check if an error is a system error (panic, WebAssembly, etc.)
export function hasSystemError(error: string | null): boolean {
  if (!error) return false;
  return /unreachable|RuntimeError|panic|thread 'main' panicked|WebAssembly/i
    .test(error) ||
    /inner loop .* cannot correct step size/i.test(error);
}
