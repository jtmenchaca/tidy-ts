#!/usr/bin/env -S deno run --allow-read --allow-run

/**
 * Simple Test Runner v3
 *
 * Just run tests. No complexity.
 */

import { printResults, runComparison, TestResult } from "./test-helpers.ts";
import {
  createRandomTestFile,
  generateRandomTestCases,
  RandomTestConfig,
} from "./random-test-generator.ts";

// Simple test configuration - Individual test functions
const TESTS = [
  // T-tests
  {
    name: "tTestOneSample_v3",
    file: "tTestOneSample_v3.test.ts",
    description: "One-sample t-test",
  },
  {
    name: "tTestIndependent_v3",
    file: "tTestIndependent_v3.test.ts",
    description: "Independent t-test",
  },
  {
    name: "tTestPaired_v3",
    file: "tTestPaired_v3.test.ts",
    description: "Paired t-test",
  },
  // Z-tests
  {
    name: "zTestOneSample_v3",
    file: "zTestOneSample_v3.test.ts",
    description: "One-sample z-test",
  },
  {
    name: "zTestTwoSample_v3",
    file: "zTestTwoSample_v3.test.ts",
    description: "Two-sample z-test",
  },
  // Proportion tests
  {
    name: "proportionTestOneSample_v3",
    file: "proportionTestOneSample_v3.test.ts",
    description: "One-sample proportion test",
  },
  {
    name: "proportionTestTwoSample_v3",
    file: "proportionTestTwoSample_v3.test.ts",
    description: "Two-sample proportion test",
  },
  // ANOVA
  {
    name: "anovaOneWay_v3",
    file: "anovaOneWay_v3.test.ts",
    description: "One-way ANOVA",
  },
  {
    name: "welchAnovaOneWay_v3",
    file: "welchAnovaOneWay_v3.test.ts",
    description: "Welch's one-way ANOVA",
  },
  {
    name: "twoWayAnovaFactorA_v3",
    file: "twoWayAnovaFactorA_v3.test.ts",
    description: "Two-way ANOVA Factor A",
  },
  {
    name: "twoWayAnovaFactorB_v3",
    file: "twoWayAnovaFactorB_v3.test.ts",
    description: "Two-way ANOVA Factor B",
  },
  {
    name: "twoWayAnovaInteraction_v3",
    file: "twoWayAnovaInteraction_v3.test.ts",
    description: "Two-way ANOVA Interaction",
  },
  {
    name: "twoWayAnova_v3",
    file: "twoWayAnova_v3.test.ts",
    description: "Two-way ANOVA",
  },
  // Chi-square
  {
    name: "chiSquareTest_v3",
    file: "chiSquareTest_v3.test.ts",
    description: "Chi-square test",
  },
  // Non-parametric
  {
    name: "mannWhitneyTest_v3",
    file: "mannWhitneyTest_v3.test.ts",
    description: "Mann-Whitney U test",
  },
  {
    name: "wilcoxonSignedRankTest_v3",
    file: "wilcoxonSignedRankTest_v3.test.ts",
    description: "Wilcoxon signed-rank test",
  },
  {
    name: "kruskalWallisTest_v3",
    file: "kruskalWallisTest_v3.test.ts",
    description: "Kruskal-Wallis test",
  },
  {
    name: "kruskalWallisTestByGroup_v3",
    file: "kruskalWallisTestByGroup_v3.test.ts",
    description: "Kruskal-Wallis test by group",
  },
  // Exact tests
  {
    name: "fishersExactTest_v3",
    file: "fishersExactTest_v3.test.ts",
    description: "Fisher's exact test",
  },
  // Correlation
  {
    name: "pearsonTest_v3",
    file: "pearsonTest_v3.test.ts",
    description: "Pearson correlation test",
  },
  {
    name: "spearmanTest_v3",
    file: "spearmanTest_v3.test.ts",
    description: "Spearman correlation test",
  },
  {
    name: "kendallTest_v3",
    file: "kendallTest_v3.test.ts",
    description: "Kendall correlation test",
  },
  // Normality
  {
    name: "shapiro_wilk_tests_v3",
    file: "shapiro_wilk_tests_v3.test.ts",
    description: "Shapiro-Wilk normality test",
  },
  // Variance tests
  {
    name: "leveneTest_v3",
    file: "leveneTest_v3.test.ts",
    description: "Levene's test",
  },
  {
    name: "hasEqualVariances_v3",
    file: "hasEqualVariances_v3.test.ts",
    description: "Equal variances test",
  },
  // Post-hoc tests
  {
    name: "tukeyHSD_v3",
    file: "tukeyHSD_v3.test.ts",
    description: "Tukey HSD test",
  },
  {
    name: "gamesHowellTest_v3",
    file: "gamesHowellTest_v3.test.ts",
    description: "Games-Howell test",
  },
  {
    name: "dunnTest_v3",
    file: "dunnTest_v3.test.ts",
    description: "Dunn's test",
  },
];

// Map test names to their corresponding function names
function getTestFunctionName(testName: string): string {
  const testNameMap: Record<string, string> = {
    "tTestOneSample_v3": "t.test.one",
    "tTestIndependent_v3": "t.test.two",
    "tTestPaired_v3": "t.test.paired",
    "zTestOneSample_v3": "z.test.one",
    "zTestTwoSample_v3": "z.test.two",
    "proportionTestOneSample_v3": "prop.test.one",
    "proportionTestTwoSample_v3": "prop.test.two",
    "anovaOneWay_v3": "aov.one",
    "welchAnovaOneWay_v3": "aov.welch",
    "twoWayAnovaFactorA_v3": "aov.two.factorA",
    "twoWayAnovaFactorB_v3": "aov.two.factorB",
    "twoWayAnovaInteraction_v3": "aov.two.interaction",
    "twoWayAnova_v3": "aov.two",
    "chiSquareTest_v3": "chisq.test.independence",
    "mannWhitneyTest_v3": "wilcox.test.mannwhitney",
    "wilcoxonSignedRankTest_v3": "wilcox.test.signedrank",
    "kruskalWallisTest_v3": "kruskal.test.one",
    "kruskalWallisTestByGroup_v3": "kruskal.test.bygroup",
    "fishersExactTest_v3": "fisher.test.exact",
    "pearsonTest_v3": "cor.test.pearson",
    "spearmanTest_v3": "cor.test.spearman",
    "kendallTest_v3": "cor.test.kendall",
    "shapiro_wilk_tests_v3": "shapiro.test.normality",
    "leveneTest_v3": "levene.test",
    "hasEqualVariances_v3": "levene.test.equalvar",
    "tukeyHSD_v3": "tukey.hsd",
    "gamesHowellTest_v3": "games.howell",
    "dunnTest_v3": "dunn.test",
  };

  return testNameMap[testName] || "t.test.one"; // fallback
}

// Create random test file using the comprehensive generator
async function createRandomTest(
  testName: string,
  testCount: number,
  options: Partial<RandomTestConfig> = {},
): Promise<string> {
  const config: RandomTestConfig = {
    testCount,
    minSampleSize: 10,
    maxSampleSize: 30,
    includeAllTests: true,
    ...options,
  };

  const testCases = generateRandomTestCases(config);
  return await createRandomTestFile(testCases, testName);
}

async function runTest(
  testName: string,
  testFile: string,
): Promise<TestResult[]> {
  console.log(`\n🔬 Running ${testName}...`);

  const command = new Deno.Command("deno", {
    args: ["run", "--allow-read", "--allow-run", testFile],
    stdout: "piped",
    stderr: "piped",
    cwd: new URL(".", import.meta.url).pathname,
  });

  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    const error = new TextDecoder().decode(stderr);
    console.error(`❌ Error running ${testName}:`, error);
    return [];
  }

  const output = new TextDecoder().decode(stdout);
  console.log(output);

  // Parse results (improved version)
  const lines = output.split("\n");
  const results: TestResult[] = [];
  let inTable = false;

  for (const line of lines) {
    if (line.includes("Test Name") && line.includes("R Stat")) {
      inTable = true;
      continue;
    }

    if (inTable && line.includes("-".repeat(50))) {
      continue;
    }

    if (inTable && line.trim() && !line.includes("No results")) {
      // Split by multiple spaces and extract fields
      const fields = line.trim().split(/\s+/);

      if (fields.length >= 7) {
        // Find the last few fields which should be the status
        const status = fields[fields.length - 1];
        const diff = fields[fields.length - 2];
        const rustPVal = fields[fields.length - 3];
        const rPVal = fields[fields.length - 4];
        const rustStat = fields[fields.length - 5];
        const rStat = fields[fields.length - 6];

        // Everything before the last 6 fields is the test name
        const testName = fields.slice(0, fields.length - 6).join(" ");

        // Handle N/A values
        const parseValue = (val: string) => {
          if (val === "N/A" || val === "" || val === "undefined") return 0;
          const num = parseFloat(val);
          return isNaN(num) ? 0 : num;
        };

        const result = {
          testName: testName,
          rResult: {
            test_statistic: parseValue(rStat),
            p_value: parseValue(rPVal),
          },
          rustResult: {
            test_statistic: parseValue(rustStat),
            p_value: parseValue(rustPVal),
          },
          difference: parseValue(diff) || 1.0,
          status: status as "PASS" | "FAIL" | "ERROR",
        };

        results.push(result);
      }
    }

    if (inTable && line.trim() === "") {
      break;
    }
  }

  return results;
}

async function main() {
  const args = Deno.args;

  if (args.length > 0 && args[0] === "--help") {
    console.log(`
🧪 Simple Test Runner v3

Usage:
  deno run --allow-read --allow-run --allow-write run_all_tests_v3.ts                    # Run normal tests
  deno run --allow-read --allow-run --allow-write run_all_tests_v3.ts --random 1         # Run each test type once with random data
  deno run --allow-read --allow-run --allow-write run_all_tests_v3.ts --random 5 15 50  # Run each test type 5 times with random data (sample size 15-50)
  deno run --allow-read --allow-run --allow-write run_all_tests_v3.ts --help             # Show this help
`);
    return;
  }

  console.log("🧪 Simple Test Runner v3");
  console.log("=".repeat(50));

  let totalTests = 0;
  let totalPassed = 0;

  if (args.length > 1 && args[0] === "--random") {
    // Random tests - run each test type multiple times with random data
    const iterations = parseInt(args[1]) || 1;
    const minSample = parseInt(args[2]) || 10;
    const maxSample = parseInt(args[3]) || 30;

    console.log(
      `🎲 Running each test type ${iterations} time${
        iterations > 1 ? "s" : ""
      } with random data...`,
    );
    console.log(`📊 Sample size range: ${minSample}-${maxSample}\n`);

    // Track results for each test type
    const testResults: Array<
      { name: string; passed: number; total: number; description: string }
    > = [];

    for (const test of TESTS) {
      console.log(
        `\n🔬 Running ${test.name} ${iterations} time${
          iterations > 1 ? "s" : ""
        } with random data...`,
      );

      // Create a test file with multiple random test cases for this specific test type
      const randomFile = await createRandomTest(test.name, iterations, {
        minSampleSize: minSample,
        maxSampleSize: maxSample,
        testTypes: [getTestFunctionName(test.name)],
      });

      const results = await runTest(`${test.name}_random`, randomFile);

      const passed = results.filter((r) => r.status === "PASS").length;
      totalTests += results.length;
      totalPassed += passed;

      // Store results for summary
      testResults.push({
        name: test.name,
        passed: passed,
        total: results.length,
        description: test.description,
      });

      console.log(`📊 ${test.name}: ${passed}/${results.length} passed`);

      await Deno.remove(randomFile).catch(() => {});
    }

    // Print detailed summary
    console.log("\n" + "=".repeat(80));
    console.log("📋 DETAILED TEST RESULTS SUMMARY");
    console.log("=".repeat(80));
    console.log(
      "Test Name".padEnd(35),
      "Description".padEnd(25),
      "Results".padEnd(12),
      "Status".padEnd(8),
    );
    console.log("-".repeat(80));

    for (const result of testResults) {
      let status: string;
      let resultsStr: string;

      if (result.total === 0) {
        status = "⏭️  SKIP";
        resultsStr = "0/0";
      } else if (result.passed === result.total) {
        status = "✅ PASS";
        resultsStr = `${result.passed}/${result.total}`;
      } else if (result.passed === 0) {
        status = "❌ FAIL";
        resultsStr = `${result.passed}/${result.total}`;
      } else {
        status = "⚠️  PARTIAL";
        resultsStr = `${result.passed}/${result.total}`;
      }

      console.log(
        result.name.padEnd(35),
        result.description.padEnd(25),
        resultsStr.padEnd(12),
        status.padEnd(8),
      );
    }

    console.log("-".repeat(80));
    const allPassed = testResults.filter((r) =>
      r.passed === r.total && r.total > 0
    ).length;
    const allFailed = testResults.filter((r) =>
      r.passed === 0 && r.total > 0
    ).length;
    const partial =
      testResults.filter((r) =>
        r.passed > 0 && r.passed < r.total && r.total > 0
      ).length;
    const skipped = testResults.filter((r) => r.total === 0).length;

    console.log(
      `📊 Summary: ${allPassed} fully passed, ${partial} partially passed, ${allFailed} failed, ${skipped} skipped`,
    );
    console.log(
      `🎯 Overall: ${totalPassed}/${totalTests} individual tests passed`,
    );
  } else {
    // Normal tests
    for (const test of TESTS) {
      const results = await runTest(test.name, test.file);
      const passed = results.filter((r) => r.status === "PASS").length;
      totalTests += results.length;
      totalPassed += passed;
      console.log(`\n📊 ${test.name}: ${passed}/${results.length} passed`);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`🎯 SUMMARY: ${totalPassed}/${totalTests} tests passed`);
  console.log(
    totalPassed === totalTests
      ? "✅ All tests passed!"
      : "⚠️  Some tests failed",
  );
}

if (import.meta.main) {
  main().catch(console.error);
}
