#!/usr/bin/env -S deno run --allow-read --allow-run

/**
 * Example: Custom Test Runner
 *
 * This demonstrates how to create custom test suites and extend the runner
 * for different testing scenarios.
 */

import {
  createTestSuite,
  TestCategory,
  TestRunner,
} from "./run_all_tests_v2.ts";

// ============================================================================
// EXAMPLE 1: Custom Test Suite with Specific Categories
// ============================================================================

async function runBasicTests() {
  console.log("🔬 Running basic statistical tests...\n");

  const basicSuite = createTestSuite(
    "basic_tests",
    "Essential statistical tests for core functionality",
    ["t_tests", "z_tests", "proportion_tests"],
    {
      parallel: true, // Run in parallel for faster execution
      globalTimeout: 60000, // 1 minute timeout
    },
  );

  const runner = new TestRunner(basicSuite);
  const result = await runner.runAll();
  runner.printSummary(result);
}

// ============================================================================
// EXAMPLE 2: Custom Test Suite with Custom Categories
// ============================================================================

async function runCustomTestSuite() {
  console.log("🧪 Running custom test suite...\n");

  // Define custom test categories
  const customCategories: TestCategory[] = [
    {
      name: "t_tests",
      displayName: "T-Tests (Custom)",
      testFile: "t_tests.test.ts",
      description: "Custom t-test validation with extended timeout",
      enabled: true,
      timeout: 60000, // Extended timeout
    },
    {
      name: "anova_tests",
      displayName: "ANOVA (Custom)",
      testFile: "anova_tests.test.ts",
      description: "Custom ANOVA validation",
      enabled: true,
      timeout: 45000,
    },
    {
      name: "shapiro_wilk_tests",
      displayName: "Normality Tests (Custom)",
      testFile: "shapiro_wilk_tests.test.ts",
      description: "Custom normality testing",
      enabled: false, // Disabled for this example
      timeout: 30000,
    },
  ];

  const customSuite = {
    name: "custom_validation",
    description: "Custom test suite for specific validation needs",
    categories: customCategories,
    globalTimeout: 120000, // 2 minutes
    parallel: false, // Sequential execution for better debugging
  };

  const runner = new TestRunner(customSuite);
  const result = await runner.runAll();
  runner.printSummary(result);
}

// ============================================================================
// EXAMPLE 3: Performance Testing Suite
// ============================================================================

async function runPerformanceTests() {
  console.log("⚡ Running performance-focused tests...\n");

  const performanceSuite = createTestSuite(
    "performance_tests",
    "Tests optimized for performance validation",
    ["t_tests", "anova_tests", "post_hoc_tests"],
    {
      parallel: true,
      globalTimeout: 30000, // Shorter timeout for performance testing
    },
  );

  const runner = new TestRunner(performanceSuite);
  const result = await runner.runAll();

  // Custom performance analysis
  console.log("\n⚡ PERFORMANCE ANALYSIS:");
  for (const categoryResult of result.categoryResults) {
    const avgTimePerTest = categoryResult.results.length > 0
      ? categoryResult.executionTime / categoryResult.results.length
      : 0;
    console.log(
      `   ${categoryResult.category.displayName}: ${
        avgTimePerTest.toFixed(1)
      }ms per test`,
    );
  }

  runner.printSummary(result);
}

// ============================================================================
// EXAMPLE 4: Regression Testing Suite
// ============================================================================

async function runRegressionTests() {
  console.log("🔄 Running regression tests...\n");

  // Focus on tests that are most likely to have regressions
  const regressionSuite = createTestSuite(
    "regression_tests",
    "Tests for detecting regressions in statistical accuracy",
    [
      "t_tests",
      "z_tests",
      "proportion_tests",
      "anova_tests",
      "chi_square_tests",
      "mann_whitney_tests",
      "wilcoxon_tests",
    ],
    {
      parallel: false, // Sequential for better error isolation
      globalTimeout: 180000, // 3 minutes
    },
  );

  const runner = new TestRunner(regressionSuite);
  const result = await runner.runAll();

  // Custom regression analysis
  const criticalFailures = result.categoryResults
    .flatMap((cr) => cr.results)
    .filter((r) => r.difference >= 0.1); // High difference threshold

  if (criticalFailures.length > 0) {
    console.log("\n🚨 REGRESSION DETECTED:");
    console.log(
      `   Found ${criticalFailures.length} tests with significant differences`,
    );
    for (const failure of criticalFailures) {
      console.log(
        `   - ${failure.testName}: diff = ${
          failure.difference.toExponential(2)
        }`,
      );
    }
  } else {
    console.log(
      "\n✅ No regressions detected - all tests within acceptable tolerance",
    );
  }

  runner.printSummary(result);
}

// ============================================================================
// EXAMPLE 5: CI/CD Pipeline Integration
// ============================================================================

async function runCIPipeline() {
  console.log("🚀 Running CI/CD pipeline tests...\n");

  // Quick validation for CI/CD
  const ciSuite = createTestSuite(
    "ci_pipeline",
    "Fast validation suite for continuous integration",
    ["t_tests", "z_tests", "proportion_tests", "anova_tests"],
    {
      parallel: true,
      globalTimeout: 60000, // 1 minute max for CI
    },
  );

  const runner = new TestRunner(ciSuite);
  const result = await runner.runAll();

  // CI-specific exit codes
  const exitCode = result.summary.failed > 0 || result.summary.errors > 0
    ? 1
    : 0;

  if (exitCode === 0) {
    console.log("\n✅ CI Pipeline: All tests passed");
  } else {
    console.log("\n❌ CI Pipeline: Tests failed - build should fail");
  }

  runner.printSummary(result);

  // In a real CI environment, you would exit with this code
  // Deno.exit(exitCode);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const args = Deno.args;

  if (args.length === 0) {
    console.log(`
🧪 Custom Test Runner Examples

Usage:
  deno run example_custom_runner.ts basic        # Basic tests
  deno run example_custom_runner.ts custom      # Custom suite
  deno run example_custom_runner.ts performance # Performance tests
  deno run example_custom_runner.ts regression  # Regression tests
  deno run example_custom_runner.ts ci          # CI pipeline tests
  deno run example_custom_runner.ts all         # Run all examples
`);
    return;
  }

  const command = args[0].toLowerCase();

  switch (command) {
    case "basic":
      await runBasicTests();
      break;
    case "custom":
      await runCustomTestSuite();
      break;
    case "performance":
      await runPerformanceTests();
      break;
    case "regression":
      await runRegressionTests();
      break;
    case "ci":
      await runCIPipeline();
      break;
    case "all":
      console.log("🚀 Running all example test suites...\n");
      await runBasicTests();
      await runCustomTestSuite();
      await runPerformanceTests();
      await runRegressionTests();
      await runCIPipeline();
      break;
    default:
      console.log(`❌ Unknown command: ${command}`);
      console.log(
        "Available commands: basic, custom, performance, regression, ci, all",
      );
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
