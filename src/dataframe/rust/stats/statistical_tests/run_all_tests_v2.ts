#!/usr/bin/env -S deno run --allow-read --allow-run

/**
 * Enhanced Test Runner for Statistical Tests
 *
 * Features:
 * - Clean, modular architecture
 * - Easy to extend with new test categories
 * - Configurable test execution
 * - Better error handling and reporting
 * - Support for different test types and configurations
 */

import { printResults, runComparison, TestResult } from "./test-helpers.ts";

// ============================================================================
// CONFIGURATION & TYPES
// ============================================================================

export interface TestCategory {
  name: string;
  displayName: string;
  testFile: string;
  description?: string;
  enabled?: boolean;
  timeout?: number; // milliseconds
}

export interface TestSuite {
  name: string;
  description: string;
  categories: TestCategory[];
  globalTimeout?: number;
  parallel?: boolean;
}

export interface TestExecutionResult {
  category: TestCategory;
  results: TestResult[];
  errors: string[];
  executionTime: number;
  status: "SUCCESS" | "FAILED" | "ERROR" | "SKIPPED";
}

export interface TestSuiteResult {
  suite: TestSuite;
  categoryResults: TestExecutionResult[];
  totalExecutionTime: number;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    errors: number;
    skipped: number;
    successRate: number;
  };
}

// ============================================================================
// TEST CONFIGURATIONS
// ============================================================================

const STATISTICAL_TEST_CATEGORIES: TestCategory[] = [
  {
    name: "t_tests",
    displayName: "T-Tests",
    testFile: "t_tests.test.ts",
    description: "One-sample, two-sample, and paired t-tests",
    enabled: true,
    timeout: 30000,
  },
  {
    name: "z_tests",
    displayName: "Z-Tests",
    testFile: "z_tests.test.ts",
    description: "One-sample and two-sample z-tests",
    enabled: true,
    timeout: 30000,
  },
  {
    name: "proportion_tests",
    displayName: "Proportion Tests",
    testFile: "proportion_tests.test.ts",
    description: "One-sample and two-sample proportion tests",
    enabled: true,
    timeout: 30000,
  },
  {
    name: "anova_tests",
    displayName: "ANOVA Tests",
    testFile: "anova_tests.test.ts",
    description: "One-way analysis of variance",
    enabled: true,
    timeout: 30000,
  },
  {
    name: "chi_square_tests",
    displayName: "Chi-Square Tests",
    testFile: "chi_square_tests.test.ts",
    description: "Chi-square test of independence",
    enabled: true,
    timeout: 30000,
  },
  {
    name: "mann_whitney_tests",
    displayName: "Mann-Whitney Tests",
    testFile: "mann_whitney_tests.test.ts",
    description: "Mann-Whitney U test for independent samples",
    enabled: true,
    timeout: 30000,
  },
  {
    name: "wilcoxon_tests",
    displayName: "Wilcoxon Tests",
    testFile: "wilcoxon_tests.test.ts",
    description: "Wilcoxon signed-rank test for paired samples",
    enabled: true,
    timeout: 30000,
  },
  {
    name: "kruskal_wallis_tests",
    displayName: "Kruskal-Wallis Tests",
    testFile: "kruskal_wallis_tests.test.ts",
    description: "Kruskal-Wallis test for multiple independent samples",
    enabled: true,
    timeout: 30000,
  },
  {
    name: "fishers_exact_tests",
    displayName: "Fisher's Exact Tests",
    testFile: "fishers_exact_tests.test.ts",
    description: "Fisher's exact test for contingency tables",
    enabled: true,
    timeout: 30000,
  },
  {
    name: "shapiro_wilk_tests",
    displayName: "Shapiro-Wilk Tests",
    testFile: "shapiro_wilk_tests.test.ts",
    description: "Shapiro-Wilk test for normality",
    enabled: true,
    timeout: 30000,
  },
  {
    name: "correlation_tests",
    displayName: "Correlation Tests",
    testFile: "correlation_tests.test.ts",
    description: "Pearson and Spearman correlation tests",
    enabled: true,
    timeout: 30000,
  },
  {
    name: "post_hoc_tests",
    displayName: "Post-Hoc Tests",
    testFile: "post_hoc_tests.test.ts",
    description: "Tukey HSD, Games-Howell, and Dunn's tests",
    enabled: true,
    timeout: 30000,
  },
];

const DEFAULT_TEST_SUITE: TestSuite = {
  name: "statistical_tests",
  description: "Comprehensive statistical test validation suite",
  categories: STATISTICAL_TEST_CATEGORIES,
  globalTimeout: 300000, // 5 minutes
  parallel: false, // Run sequentially for better error isolation
};

// ============================================================================
// CORE TEST RUNNER
// ============================================================================

export class TestRunner {
  private suite: TestSuite;
  private results: TestExecutionResult[] = [];

  constructor(suite: TestSuite = DEFAULT_TEST_SUITE) {
    this.suite = suite;
  }

  /**
   * Run all enabled test categories
   */
  async runAll(): Promise<TestSuiteResult> {
    const startTime = Date.now();
    this.results = [];

    console.log(`\n${"=".repeat(80)}`);
    console.log(`🧪 RUNNING TEST SUITE: ${this.suite.name.toUpperCase()}`);
    console.log(`📝 ${this.suite.description}`);
    console.log(`${"=".repeat(80)}`);

    const enabledCategories = this.suite.categories.filter((cat) =>
      cat.enabled !== false
    );
    console.log(
      `📊 Found ${enabledCategories.length} enabled test categories\n`,
    );

    // Run tests (sequentially or in parallel based on configuration)
    if (this.suite.parallel) {
      await this.runParallel(enabledCategories);
    } else {
      await this.runSequential(enabledCategories);
    }

    const totalExecutionTime = Date.now() - startTime;
    const summary = this.calculateSummary();

    return {
      suite: this.suite,
      categoryResults: this.results,
      totalExecutionTime,
      summary,
    };
  }

  /**
   * Run test categories sequentially
   */
  private async runSequential(categories: TestCategory[]): Promise<void> {
    for (const category of categories) {
      const result = await this.runCategory(category);
      this.results.push(result);
    }
  }

  /**
   * Run test categories in parallel
   */
  private async runParallel(categories: TestCategory[]): Promise<void> {
    const promises = categories.map((category) => this.runCategory(category));
    const results = await Promise.all(promises);
    this.results.push(...results);
  }

  /**
   * Run a single test category
   */
  private async runCategory(
    category: TestCategory,
  ): Promise<TestExecutionResult> {
    const startTime = Date.now();
    const result: TestExecutionResult = {
      category,
      results: [],
      errors: [],
      executionTime: 0,
      status: "SUCCESS",
    };

    try {
      console.log(`\n${"-".repeat(60)}`);
      console.log(`🔬 Testing ${category.displayName}`);
      if (category.description) {
        console.log(`   ${category.description}`);
      }
      console.log(`${"-".repeat(60)}`);

      const testOutput = await this.executeTestFile(category);

      if (testOutput.success) {
        result.results = this.parseTestOutput(testOutput.output);
        result.status = result.results.length > 0 ? "SUCCESS" : "FAILED";

        if (result.results.length === 0) {
          result.errors.push("No test results found in output");
          result.status = "FAILED";
        }
      } else {
        result.errors.push(testOutput.error);
        result.status = "ERROR";
      }
    } catch (error) {
      result.errors.push(`Execution failed: ${(error as Error).message}`);
      result.status = "ERROR";
    }

    result.executionTime = Date.now() - startTime;
    this.printCategoryResult(result);

    return result;
  }

  /**
   * Execute a test file and return the output
   */
  private async executeTestFile(
    category: TestCategory,
  ): Promise<{ success: boolean; output: string; error: string }> {
    const scriptDir = new URL(".", import.meta.url).pathname;
    const timeout = category.timeout || this.suite.globalTimeout || 30000;

    const command = new Deno.Command("deno", {
      args: ["run", "--allow-read", "--allow-run", category.testFile],
      stdout: "piped",
      stderr: "piped",
      cwd: scriptDir,
    });

    try {
      const { code, stdout, stderr } = await command.output();
      const output = new TextDecoder().decode(stdout);
      const error = new TextDecoder().decode(stderr);

      if (code === 0) {
        return { success: true, output, error: "" };
      } else {
        return {
          success: false,
          output: "",
          error: `Exit code ${code}: ${error}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        output: "",
        error: `Command execution failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Parse test output to extract results
   */
  private parseTestOutput(output: string): TestResult[] {
    const lines = output.split("\n");
    const results: TestResult[] = [];
    let inTable = false;

    for (const line of lines) {
      // Look for table header
      if (
        line.includes("Test Name") && line.includes("R Result") &&
        line.includes("Rust Result")
      ) {
        inTable = true;
        continue;
      }

      // Skip separator lines
      if (
        inTable &&
        (line.includes("-".repeat(50)) || line.includes("=".repeat(50)))
      ) {
        continue;
      }

      // Parse table rows
      if (inTable && line.trim() && !line.includes("No results to display")) {
        // Split by single spaces and handle the table format
        const parts = line.trim().split(/\s+/).filter((part) =>
          part.length > 0
        );

        if (parts.length >= 5) {
          // Find where the results start (look for JSON objects)
          let resultStartIndex = 0;
          for (let i = 0; i < parts.length - 3; i++) {
            if (parts[i].includes("{")) {
              resultStartIndex = i;
              break;
            }
          }

          let testName = parts.slice(0, resultStartIndex).join(" ");
          let rResult = parts[resultStartIndex];
          let rustResult = parts[resultStartIndex + 1];
          let difference = parts[resultStartIndex + 2];
          let status = parts[resultStartIndex + 3];

          // Parse difference value properly
          let diffValue = parseFloat(difference);
          if (isNaN(diffValue)) {
            // Handle scientific notation like "4.36e-5"
            const scientificMatch = difference.match(/(\d+\.?\d*)e([+-]?\d+)/);
            if (scientificMatch) {
              const base = parseFloat(scientificMatch[1]);
              const exponent = parseInt(scientificMatch[2]);
              diffValue = base * Math.pow(10, exponent);
            } else {
              diffValue = 1.0; // Default for unparseable differences
            }
          }

          results.push({
            testName,
            rResult,
            rustResult,
            difference: diffValue,
            status: status as "PASS" | "FAIL" | "ERROR",
          });
        }
      }

      // Stop parsing at end of table
      if (inTable && line.trim() === "") {
        break;
      }
    }

    return results;
  }

  /**
   * Print result for a single category
   */
  private printCategoryResult(result: TestExecutionResult): void {
    const statusIcon = result.status === "SUCCESS"
      ? "✅"
      : result.status === "FAILED"
      ? "⚠️"
      : result.status === "ERROR"
      ? "❌"
      : "⏭️";

    console.log(
      `\n${statusIcon} ${result.category.displayName} (${result.executionTime}ms)`,
    );

    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.join(", ")}`);
    }

    if (result.results.length > 0) {
      const passed = result.results.filter((r) => r.status === "PASS").length;
      const failed = result.results.filter((r) => r.status === "FAIL").length;
      const errors = result.results.filter((r) => r.status === "ERROR").length;

      console.log(
        `   Results: ${passed} passed, ${failed} failed, ${errors} errors`,
      );

      // Show individual test results for failed tests
      const failedTests = result.results.filter((r) => r.status !== "PASS");
      if (failedTests.length > 0) {
        console.log(`   Failed tests:`);
        for (const test of failedTests) {
          console.log(
            `     - ${test.testName}: diff = ${
              test.difference.toExponential(2)
            }`,
          );
        }
      }
    }
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary() {
    let totalTests = 0;
    let passed = 0;
    let failed = 0;
    let errors = 0;
    let skipped = 0;

    for (const result of this.results) {
      if (result.status === "SKIPPED") {
        skipped++;
        continue;
      }

      for (const test of result.results) {
        totalTests++;
        if (test.status === "PASS") passed++;
        else if (test.status === "FAIL") failed++;
        else if (test.status === "ERROR") errors++;
      }
    }

    return {
      totalTests,
      passed,
      failed,
      errors,
      skipped,
      successRate: totalTests > 0 ? (passed / totalTests) * 100 : 0,
    };
  }

  /**
   * Print comprehensive summary
   */
  printSummary(suiteResult: TestSuiteResult): void {
    const { summary, categoryResults, totalExecutionTime } = suiteResult;

    console.log(`\n${"=".repeat(80)}`);
    console.log("📊 COMPREHENSIVE TEST SUITE SUMMARY");
    console.log(`${"=".repeat(80)}`);

    // Overall statistics
    console.log(`\n🎯 OVERALL STATISTICS:`);
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(
      `   Passed: ${summary.passed} (${summary.successRate.toFixed(1)}%)`,
    );
    console.log(`   Failed: ${summary.failed}`);
    console.log(`   Errors: ${summary.errors}`);
    console.log(`   Skipped: ${summary.skipped}`);
    console.log(`   Total Time: ${totalExecutionTime}ms`);

    // Category breakdown
    console.log(`\n📋 CATEGORY BREAKDOWN:`);
    for (const result of categoryResults) {
      const statusIcon = result.status === "SUCCESS"
        ? "✅"
        : result.status === "FAILED"
        ? "⚠️"
        : result.status === "ERROR"
        ? "❌"
        : "⏭️";

      const testCount = result.results.length;
      const passedCount = result.results.filter((r) =>
        r.status === "PASS"
      ).length;
      const successRate = testCount > 0 ? (passedCount / testCount) * 100 : 0;

      console.log(
        `   ${statusIcon} ${result.category.displayName}: ${passedCount}/${testCount} (${
          successRate.toFixed(1)
        }%) - ${result.executionTime}ms`,
      );
    }

    // Issues summary
    this.printIssuesSummary(categoryResults);

    console.log(`\n${"=".repeat(80)}`);
  }

  /**
   * Print detailed issues summary
   */
  private printIssuesSummary(categoryResults: TestExecutionResult[]): void {
    const issues: Array<{
      category: string;
      testName: string;
      difference: number;
      status: string;
      severity: "CRITICAL" | "WARNING" | "MINOR";
    }> = [];

    for (const result of categoryResults) {
      for (const test of result.results) {
        const hasIssues = test.status === "FAIL" || test.status === "ERROR" ||
          test.difference >= 0.1;

        if (hasIssues) {
          const severity = test.difference >= 1e-1
            ? "CRITICAL"
            : test.difference >= 1e-3
            ? "WARNING"
            : "MINOR";

          issues.push({
            category: result.category.displayName,
            testName: test.testName,
            difference: test.difference,
            status: test.status,
            severity,
          });
        }
      }
    }

    if (issues.length === 0) {
      console.log(
        `\n✅ No significant issues found - all tests within acceptable tolerance!`,
      );
    } else {
      console.log(`\n⚠️  Found ${issues.length} significant issues:`);

      // Group by category
      const issuesByCategory = issues.reduce((acc, issue) => {
        if (!acc[issue.category]) acc[issue.category] = [];
        acc[issue.category].push(issue);
        return acc;
      }, {} as Record<string, typeof issues>);

      for (
        const [category, categoryIssues] of Object.entries(issuesByCategory)
      ) {
        console.log(`\n   ${category}:`);
        for (const issue of categoryIssues) {
          const icon = issue.severity === "CRITICAL"
            ? "🔴"
            : issue.severity === "WARNING"
            ? "🟡"
            : "🟠";
          console.log(
            `     ${icon} ${issue.testName}: diff = ${
              issue.difference.toExponential(2)
            } (${issue.status})`,
          );
        }
      }
    }
  }
}

// ============================================================================
// RANDOM TEST GENERATORS
// ============================================================================

export interface RandomTestConfig {
  testCount: number;
  sampleSize: { min: number; max: number };
  valueRange: { min: number; max: number };
  seed?: number;
}

export class RandomTestGenerator {
  private seed: number;
  private rng: () => number;

  constructor(seed?: number) {
    this.seed = seed || Date.now();
    this.rng = this.createSeededRNG(this.seed);
  }

  private createSeededRNG(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 2 ** 32;
      return state / 2 ** 32;
    };
  }

  /**
   * Generate random normal data
   */
  generateNormalData(n: number, mean = 0, std = 1): number[] {
    const data: number[] = [];
    for (let i = 0; i < n; i++) {
      // Box-Muller transform
      const u1 = this.rng();
      const u2 = this.rng();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      data.push(mean + std * z0);
    }
    return data;
  }

  /**
   * Generate random uniform data
   */
  generateUniformData(n: number, min = 0, max = 1): number[] {
    const data: number[] = [];
    for (let i = 0; i < n; i++) {
      data.push(min + this.rng() * (max - min));
    }
    return data;
  }

  /**
   * Generate random integer data
   */
  generateIntegerData(n: number, min = 0, max = 10): number[] {
    const data: number[] = [];
    for (let i = 0; i < n; i++) {
      data.push(Math.floor(min + this.rng() * (max - min + 1)));
    }
    return data;
  }

  /**
   * Generate random boolean data (for proportion tests)
   */
  generateBooleanData(n: number, successRate = 0.5): boolean[] {
    const data: boolean[] = [];
    for (let i = 0; i < n; i++) {
      data.push(this.rng() < successRate);
    }
    return data;
  }

  /**
   * Generate random groups for ANOVA/post-hoc tests
   */
  generateGroups(
    groupCount: number,
    samplesPerGroup: number,
    config: RandomTestConfig,
  ): number[][] {
    const groups: number[][] = [];
    for (let i = 0; i < groupCount; i++) {
      const groupSize = Math.floor(
        config.sampleSize.min +
          this.rng() * (config.sampleSize.max - config.sampleSize.min),
      );
      const group = this.generateNormalData(
        groupSize,
        config.valueRange.min +
          (i * (config.valueRange.max - config.valueRange.min) / groupCount),
        1,
      );
      groups.push(group);
    }
    return groups;
  }

  /**
   * Generate random contingency table
   */
  generateContingencyTable(
    rows: number,
    cols: number,
    maxValue = 10,
  ): number[][] {
    const table: number[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        row.push(Math.floor(1 + this.rng() * maxValue));
      }
      table.push(row);
    }
    return table;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a custom test suite with specific categories
 */
export function createTestSuite(
  name: string,
  description: string,
  categoryNames: string[],
  options: Partial<TestSuite> = {},
): TestSuite {
  const categories = STATISTICAL_TEST_CATEGORIES.filter((cat) =>
    categoryNames.includes(cat.name)
  );

  return {
    name,
    description,
    categories,
    ...options,
  };
}

/**
 * Run a quick test of specific categories
 */
export async function runQuickTest(
  categoryNames: string[],
): Promise<TestSuiteResult> {
  const suite = createTestSuite(
    "quick_test",
    "Quick validation of specific test categories",
    categoryNames,
  );

  const runner = new TestRunner(suite);
  return await runner.runAll();
}

/**
 * Run all statistical tests (default behavior)
 */
export async function runAllStatisticalTests(): Promise<TestSuiteResult> {
  const runner = new TestRunner();
  return await runner.runAll();
}

/**
 * Run random tests for a specific category
 */
export async function runRandomTests(
  categoryName: string,
  testCount: number = 100,
  config?: Partial<RandomTestConfig>,
): Promise<TestSuiteResult> {
  const generator = new RandomTestGenerator(config?.seed);
  const defaultConfig: RandomTestConfig = {
    testCount,
    sampleSize: { min: 10, max: 50 },
    valueRange: { min: 0, max: 100 },
    ...config,
  };

  // Create a custom test file for random tests
  const randomTestFile = await createRandomTestFile(
    categoryName,
    generator,
    defaultConfig,
  );

  const customCategory: TestCategory = {
    name: `${categoryName}_random`,
    displayName: `${categoryName} (Random Tests)`,
    testFile: randomTestFile,
    description: `${testCount} random tests for ${categoryName}`,
    enabled: true,
    timeout: 120000, // 2 minutes for random tests
  };

  const suite: TestSuite = {
    name: "random_tests",
    description: `Random validation tests for ${categoryName}`,
    categories: [customCategory],
    globalTimeout: 300000,
    parallel: false,
  };

  const runner = new TestRunner(suite);
  const result = await runner.runAll();

  // Clean up temporary file
  try {
    await Deno.remove(randomTestFile);
  } catch {
    // Ignore cleanup errors
  }

  return result;
}

/**
 * Create a temporary test file with random data
 */
async function createRandomTestFile(
  categoryName: string,
  generator: RandomTestGenerator,
  config: RandomTestConfig,
): Promise<string> {
  const testCases = generateRandomTestCases(categoryName, generator, config);

  const testFileContent = `#!/usr/bin/env -S deno run --allow-read --allow-run

import { printResults, runComparison } from "./test-helpers.ts";

async function main() {
  console.log("Testing R vs Rust ${categoryName} with random data...\\n");

  const testCases = ${JSON.stringify(testCases, null, 2)};

  const results = await runComparison(testCases);
  printResults(results);
}

if (import.meta.main) {
  main().catch(console.error);
}`;

  const tempFile = `temp_${categoryName}_random_${Date.now()}.test.ts`;
  await Deno.writeTextFile(tempFile, testFileContent);
  return tempFile;
}

/**
 * Generate random test cases for a specific category
 */
function generateRandomTestCases(
  categoryName: string,
  generator: RandomTestGenerator,
  config: RandomTestConfig,
): Array<
  { testName: string; func: string; distribution: string; args: string[] }
> {
  const testCases: Array<
    { testName: string; func: string; distribution: string; args: string[] }
  > = [];

  for (let i = 0; i < config.testCount; i++) {
    const sampleSize = Math.floor(
      config.sampleSize.min +
        Math.random() * (config.sampleSize.max - config.sampleSize.min),
    );

    switch (categoryName) {
      case "t_tests": {
        const data1 = generator.generateNormalData(sampleSize, 0, 1);
        const data2 = generator.generateNormalData(sampleSize, 0.5, 1);
        const testType = i % 3; // Rotate through test types

        if (testType === 0) {
          testCases.push({
            testName: `Random One-sample t-test ${i + 1}`,
            func: "t.test.one",
            distribution: "t_test",
            args: [JSON.stringify(data1), "0", "two.sided", "0.05"],
          });
        } else if (testType === 1) {
          testCases.push({
            testName: `Random Two-sample t-test ${i + 1}`,
            func: "t.test.two",
            distribution: "t_test",
            args: [
              JSON.stringify(data1),
              JSON.stringify(data2),
              "two.sided",
              "0.05",
            ],
          });
        } else {
          testCases.push({
            testName: `Random Paired t-test ${i + 1}`,
            func: "t.test.paired",
            distribution: "t_test",
            args: [
              JSON.stringify(data1),
              JSON.stringify(data2),
              "two.sided",
              "0.05",
            ],
          });
        }
        break;
      }

      case "shapiro_wilk_tests": {
        const data = generator.generateNormalData(sampleSize, 0, 1);
        testCases.push({
          testName: `Random Shapiro-Wilk test ${i + 1}`,
          func: "shapiro.test.normality",
          distribution: "shapiro_wilk",
          args: [JSON.stringify(data)],
        });
        break;
      }

      case "proportion_tests": {
        const data1 = generator.generateBooleanData(sampleSize, 0.3);
        const data2 = generator.generateBooleanData(sampleSize, 0.7);
        const testType = i % 2;

        if (testType === 0) {
          testCases.push({
            testName: `Random One-sample proportion test ${i + 1}`,
            func: "prop.test.one",
            distribution: "proportion_test",
            args: [JSON.stringify(data1), "0.5", "two.sided", "0.05"],
          });
        } else {
          testCases.push({
            testName: `Random Two-sample proportion test ${i + 1}`,
            func: "prop.test.two",
            distribution: "proportion_test",
            args: [JSON.stringify(data1), JSON.stringify(data2)],
          });
        }
        break;
      }

      case "anova_tests": {
        const groups = generator.generateGroups(3, sampleSize, config);
        testCases.push({
          testName: `Random ANOVA test ${i + 1}`,
          func: "aov.one",
          distribution: "anova",
          args: [JSON.stringify(groups), "0.05"],
        });
        break;
      }

      case "chi_square_tests": {
        const table = generator.generateContingencyTable(2, 3, 20);
        testCases.push({
          testName: `Random Chi-square test ${i + 1}`,
          func: "chisq.test.independence",
          distribution: "chi_square",
          args: [JSON.stringify(table)],
        });
        break;
      }

      default:
        // Generic test for unsupported categories
        const data = generator.generateNormalData(sampleSize, 0, 1);
        testCases.push({
          testName: `Random ${categoryName} test ${i + 1}`,
          func: "t.test.one", // Fallback to t-test
          distribution: "t_test",
          args: [JSON.stringify(data), "0", "two.sided", "0.05"],
        });
    }
  }

  return testCases;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const args = Deno.args;

  if (args.length > 0 && args[0] === "--help") {
    console.log(`
🧪 Statistical Test Runner v2

Usage:
  deno run --allow-read --allow-run run_all_tests_v2.ts                           # Run all tests
  deno run --allow-read --allow-run run_all_tests_v2.ts --quick t_tests           # Run specific categories
  deno run --allow-read --allow-run --allow-write run_all_tests_v2.ts --random t_tests 50       # Run 50 random tests
  deno run --allow-read --allow-run --allow-write run_all_tests_v2.ts --random shapiro_wilk 100 # Run 100 random Shapiro-Wilk tests
  deno run --allow-read --allow-run run_all_tests_v2.ts --help                    # Show this help

Random Testing:
  --random <category> [count] [seed]  # Run random tests for a category
  Example: --random t_tests 100 12345

Available categories:
${
      STATISTICAL_TEST_CATEGORIES.map((cat) =>
        `  - ${cat.name}: ${cat.description || cat.displayName}`
      ).join("\n")
    }
`);
    return;
  }

  if (args.length > 1 && args[0] === "--quick") {
    const categories = args.slice(1);
    console.log(`🚀 Running quick test for: ${categories.join(", ")}`);
    const result = await runQuickTest(categories);
    const runner = new TestRunner();
    runner.printSummary(result);
  } else if (args.length > 1 && args[0] === "--random") {
    const category = args[1];
    const testCount = parseInt(args[2]) || 100;
    const seed = args[3] ? parseInt(args[3]) : undefined;

    console.log(
      `🎲 Running ${testCount} random tests for ${category}${
        seed ? ` (seed: ${seed})` : ""
      }...`,
    );
    const result = await runRandomTests(category, testCount, { seed });
    const runner = new TestRunner();
    runner.printSummary(result);
  } else {
    console.log(`🚀 Running comprehensive statistical test suite...`);
    const result = await runAllStatisticalTests();
    const runner = new TestRunner();
    runner.printSummary(result);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
