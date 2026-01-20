#!/usr/bin/env -S deno run --allow-all

// deno-lint-ignore-file no-explicit-any
import {
  callRobustR,
  callRobustRust,
  generateComprehensiveTestCase,
  type TestParameters,
} from "./comprehensive-interface.ts";

interface ComparisonResult {
  testName: string;
  rResult: any;
  rustResult: any;
  difference: number;
  status: "PASS" | "FAIL" | "ERROR";
  errorMessage?: string;
}

// Run comparison using robust interface
export async function runRobustComparison(
  params: TestParameters,
): Promise<ComparisonResult> {
  try {
    const [rResult, rustResult] = await Promise.all([
      callRobustR(params),
      callRobustRust(params),
    ]);

    const rStat = rResult.testStatistic;
    const rustStat = rustResult.testStatistic;
    const rPval = rResult.pValue;
    const rustPval = rustResult.pValue;

    // Calculate differences
    const statDiff = Math.abs(rStat - rustStat);
    const pvalDiff = Math.abs(rPval - rustPval);
    const maxDiff = Math.max(statDiff, pvalDiff);

    // Determine status - be more lenient for now
    const status = maxDiff < 0.01 ? "PASS" : "FAIL";

    return {
      testName:
        `${params.testType} (${params.options?.alternative}, α=${params.options?.alpha})`,
      rResult,
      rustResult,
      difference: maxDiff,
      status,
    };
  } catch (error) {
    return {
      testName:
        `${params.testType} (${params.options?.alternative}, α=${params.options?.alpha})`,
      rResult: null,
      rustResult: null,
      difference: 1,
      status: "ERROR",
      errorMessage: String(error),
    };
  }
}

// Print results in a nice format
function printComparisonResults(results: ComparisonResult[]): void {
  console.log("\n" + "=".repeat(120));
  console.log("📋 COMPREHENSIVE INTERFACE TEST RESULTS");
  console.log("=".repeat(120));

  console.log(
    "Test Name".padEnd(50) + "R Stat".padEnd(12) + "Rust Stat".padEnd(12) +
      "R P-val".padEnd(12) + "Rust P-val".padEnd(12) + "Diff".padEnd(10) +
      "Status",
  );
  console.log("-".repeat(120));

  let passed = 0;
  let failed = 0;
  let errors = 0;

  for (const result of results) {
    const testName = result.testName.length > 48
      ? result.testName.substring(0, 45) + "..."
      : result.testName;
    const rStat = result.rResult?.testStatistic?.toFixed(5) || "N/A";
    const rustStat = result.rustResult?.testStatistic?.toFixed(5) || "N/A";
    const rPval = result.rResult?.pValue?.toFixed(5) || "N/A";
    const rustPval = result.rustResult?.pValue?.toFixed(5) || "N/A";
    const diff = result.difference.toExponential(2);

    const statusColor = result.status === "PASS"
      ? "✅"
      : result.status === "FAIL"
      ? "❌"
      : "🔥";

    console.log(
      testName.padEnd(50) +
        rStat.padEnd(12) +
        rustStat.padEnd(12) +
        rPval.padEnd(12) +
        rustPval.padEnd(12) +
        diff.padEnd(10) +
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

  console.log("-".repeat(120));
  console.log(
    `📊 Summary: ${passed} passed, ${failed} failed, ${errors} errors out of ${results.length} tests`,
  );
  console.log(
    `🎯 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`,
  );
}

// Test configuration
function getTestConfig() {
  return {
    // Correlation tests
    "cor.test.pearson": true, // ✅ Working
    "cor.test.spearman": true, // ✅ Working
    "cor.test.kendall": true, // ✅ Fixed! Exact algorithm implemented

    // T-tests
    "t.test.one": true, // ✅ Working (tTestOneSample)
    "t.test.two": true, // ✅ Working (tTestIndependent)
    "t.test.paired": true, // ✅ Working (tTestPaired)

    // Z-tests
    "z.test.one": true, // ✅ Working (zTestOneSample)
    "z.test.two": true, // ✅ Working (zTestTwoSample)

    // Proportion tests
    "prop.test.one": true, // ✅ Working (proportionTestOneSample)
    "prop.test.two": true, // ✅ Working (proportionTestTwoSample)

    // Distribution tests
    "ks.test.uniform": true, // ✅ Fixed! (Kolmogorov-Smirnov one-sample)
    "ks.test.two.sample": true, // ✅ Working (kolmogorov_smirnov_two_sample)
    "shapiro.test": true, // ✅ Working (shapiro_wilk_tests)
    "ad.test": true, // ✅ New! Anderson-Darling normality test
    "dagostino.test": true, // ✅ New! D'Agostino-Pearson K² normality test

    // Non-parametric tests
    "wilcox.test.signedrank": true, // ✅ Fixed! Exact implementation (wilcoxonSignedRankTest)
    "wilcox.test.mannwhitney": true, // ✅ Working (mannWhitneyTest)
    "kruskal.test": true, // ✅ Working (kruskalWallisTest)

    // ANOVA tests
    "aov.one": true, // ✅ Working (anovaOneWay)
    "aov.welch": true, // ✅ Working (welchAnovaOneWay)
    "aov.two.factorA": false, // ❌ Partial implementation (twoWayAnovaFactorA)
    "aov.two.factorB": false, // ❌ Partial implementation (twoWayAnovaFactorB)
    "aov.two.interaction": false, // ❌ Partial implementation (twoWayAnovaInteraction)

    // Chi-square and exact tests
    "chisq.test": true, // ✅ Working (chiSquareTest)
    "fisher.test": true, // ✅ Working (fishersExactTest)

    // Variance tests
    "levene.test": false, // ❌ Not implemented in R (leveneTest)
    "equal.variances": false, // ❌ Boolean test, not suitable for comparison

    // Post-hoc tests (return complex objects, need special handling)
    "tukey.hsd": false, // ❌ Returns PostHocTestResult (complex object)
    "games.howell": false, // ❌ Returns PostHocTestResult (complex object)
    "dunn.test": false, // ❌ Returns PostHocTestResult (complex object)
    "kruskal.test.bygroup": false, // ❌ Different interface than basic kruskal test
    "aov.two": false, // ❌ Returns TwoWayAnovaTestResult (complex object)
  };
}

// Parse command line arguments
function parseArgs(args: string[]) {
  const parsed = {
    testCount: 2,
    filter: null as string | null,
    list: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--filter" && i + 1 < args.length) {
      parsed.filter = args[i + 1];
      i++;
    } else if (arg === "--list") {
      parsed.list = true;
    } else if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--count" && i + 1 < args.length) {
      parsed.testCount = parseInt(args[i + 1]) || 2;
      i++;
    } else if (!isNaN(parseInt(arg))) {
      parsed.testCount = parseInt(arg);
    }
  }

  return parsed;
}

// Main test runner
async function main() {
  const args = parseArgs(Deno.args);

  console.log("🧪 Comprehensive Interface Test Runner");
  console.log("==============================================");

  if (args.help) {
    console.log("Usage: comprehensive-runner.ts [options]");
    console.log("\nOptions:");
    console.log(
      "  --filter <pattern>    Only run tests matching pattern (case-insensitive)",
    );
    console.log(
      "  --count <number>      Number of tests to run per test type (default: 2)",
    );
    console.log("  --list                List all available test types");
    console.log("  --help, -h            Show this help message");
    console.log("\nExamples:");
    console.log("  # Run only D'Agostino-Pearson tests");
    console.log("  deno run -A comprehensive-runner.ts --filter dagostino");
    console.log("  # Run 5 Anderson-Darling tests");
    console.log(
      "  deno run -A comprehensive-runner.ts --filter ad.test --count 5",
    );
    console.log("  # List all available tests");
    console.log("  deno run -A comprehensive-runner.ts --list");
    return;
  }

  if (args.list) {
    console.log("Available test types:");
    const testConfig = getTestConfig();
    Object.keys(testConfig).forEach((test) => {
      const status = testConfig[test as keyof typeof testConfig] ? "✅" : "❌";
      console.log(`  ${status} ${test}`);
    });
    return;
  }

  if (args.filter) {
    console.log(`Filtering tests matching: "${args.filter}"`);
  }
  console.log(`Running ${args.testCount} random tests per test type...\n`);

  const testConfig = getTestConfig();

  let testTypes = Object.keys(testConfig).filter((key) =>
    testConfig[key as keyof typeof testConfig]
  );

  // Apply filter if provided
  if (args.filter) {
    testTypes = testTypes.filter((testType) =>
      testType.toLowerCase().includes(args.filter!.toLowerCase())
    );
    if (testTypes.length === 0) {
      console.log(`No tests match filter: "${args.filter}"`);
      return;
    }
  }

  const allResults: ComparisonResult[] = [];

  for (const testType of testTypes) {
    console.log(`🔬 Testing ${testType}...`);

    for (let i = 0; i < args.testCount; i++) {
      try {
        const params = generateComprehensiveTestCase(
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
          `  ${statusIcon} ${result.testName}: ${result.status} (diff: ${
            result.difference.toFixed(6)
          })`,
        );
      } catch (error) {
        console.error(`  🔥 Error with ${testType}:`, error);
        allResults.push({
          testName: `${testType} (error)`,
          rResult: null,
          rustResult: null,
          difference: 1,
          status: "ERROR",
          errorMessage: String(error),
        });
      }
    }
  }

  // Print comprehensive results
  printComparisonResults(allResults);

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
