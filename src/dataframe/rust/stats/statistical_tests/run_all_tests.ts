#!/usr/bin/env -S deno run --allow-read --allow-run

// Comprehensive test runner for all statistical test functions
// Usage: deno run --allow-read --allow-run run_all_tests.ts

const statisticalTests = [
  "t_tests",
  "z_tests",
  "proportion_tests",
  "anova_tests",
  "chi_square_tests",
  "mann_whitney_tests",
  "wilcoxon_tests",
  "kruskal_wallis_tests",
  "fishers_exact_tests",
  "shapiro_wilk_tests",
  "correlation_tests",
];

interface TestResult {
  testName: string;
  // deno-lint-ignore no-explicit-any
  rResult: any;
  // deno-lint-ignore no-explicit-any
  rustResult: any;
  difference: number;
  status: "PASS" | "FAIL" | "ERROR";
  errorMessage?: string;
}

interface TestCategoryResults {
  category: string;
  results: TestResult[];
  errors: string[];
}

function parseTestOutput(output: string): TestResult[] {
  const lines = output.split("\n");
  const results: TestResult[] = [];

  // Look for the test results table
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

    // Skip separator lines (both dashes and equals)
    if (
      inTable &&
      (line.includes("-".repeat(50)) || line.includes("=".repeat(50)))
    ) {
      continue;
    }

    // Parse table rows
    if (inTable && line.trim() && !line.includes("No results to display")) {
      // Split by whitespace and filter out empty strings
      const parts = line.trim().split(/\s+/).filter((part) => part.length > 0);

      if (parts.length >= 5) {
        // Handle test names that might have spaces (take everything before the results)
        let testName = parts[0];
        let rResult = parts[1];
        let rustResult = parts[2];
        let difference = parts[3];
        let status = parts[4];

        // If there are more parts, the test name might be multi-word
        if (parts.length > 5) {
          // Find where the results start (look for patterns like {"test_stati... or numbers)
          let resultStartIndex = 1;
          for (let i = 1; i < parts.length - 3; i++) {
            if (
              parts[i].includes("{") || parts[i].match(/^\d/) ||
              parts[i].includes("e-")
            ) {
              resultStartIndex = i;
              break;
            }
          }

          if (resultStartIndex > 1) {
            testName = parts.slice(0, resultStartIndex).join(" ");
            rResult = parts[resultStartIndex];
            rustResult = parts[resultStartIndex + 1];
            difference = parts[resultStartIndex + 2];
            status = parts[resultStartIndex + 3];
          }
        }

        let diffValue = parseFloat(difference);
        // Handle NaN as a special case for failed tests
        if (isNaN(diffValue)) {
          diffValue = 1.0; // Default high difference for parsing errors
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

    // Stop parsing when we hit the end of the table (empty line or next section)
    if (inTable && line.trim() === "") {
      break;
    }
  }

  return results;
}

async function runTestCategory(category: string): Promise<TestCategoryResults> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing ${category.toUpperCase().replace(/_/g, " ")}`);
  console.log(`${"=".repeat(60)}`);

  const categoryResults: TestCategoryResults = {
    category,
    results: [],
    errors: [],
  };

  try {
    // Get the directory where this script is located
    const scriptDir = new URL(".", import.meta.url).pathname;

    const command = new Deno.Command("deno", {
      args: ["run", "--allow-read", "--allow-run", `${category}.test.ts`],
      stdout: "piped",
      stderr: "piped",
      cwd: scriptDir, // Set working directory to where the test files are
    });

    const { code, stdout, stderr } = await command.output();

    if (code === 0) {
      const output = new TextDecoder().decode(stdout);
      console.log(output);

      // Parse test results from output
      const parsedResults = parseTestOutput(output);
      categoryResults.results = parsedResults;
    } else {
      const error = new TextDecoder().decode(stderr);
      console.error(`Error running ${category} test:`, error);
      categoryResults.errors.push(`Test failed: ${error}`);
    }
  } catch (error) {
    console.error(`Failed to run ${category} test:`, error);
    categoryResults.errors.push(
      `Execution failed: ${(error as Error).message}`,
    );
  }

  return categoryResults;
}

function printSummary(allResults: TestCategoryResults[]): void {
  console.log(`\n${"=".repeat(80)}`);
  console.log("COMPREHENSIVE STATISTICAL TESTS SUMMARY");
  console.log(`${"=".repeat(80)}`);

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalErrors = 0;
  let maxDifference = 0;
  let totalDifference = 0;

  for (const categoryResult of allResults) {
    console.log(
      `\n${categoryResult.category.toUpperCase().replace(/_/g, " ")}:`,
    );

    if (categoryResult.errors.length > 0) {
      console.log(`  ❌ Errors: ${categoryResult.errors.join(", ")}`);
      totalErrors += categoryResult.errors.length;
    }

    if (categoryResult.results.length > 0) {
      console.log(`  📊 ${categoryResult.results.length} test comparisons:`);

      for (const result of categoryResult.results) {
        const status = result.status === "PASS"
          ? "✓"
          : result.status === "FAIL"
          ? "⚠"
          : "❌";
        console.log(
          `    ${status} ${result.testName}: diff = ${
            result.difference.toExponential(2)
          } (${result.status})`,
        );

        totalTests++;
        if (result.status === "PASS") totalPassed++;
        if (result.status === "FAIL") totalFailed++;
        if (result.status === "ERROR") totalErrors++;
        maxDifference = Math.max(maxDifference, result.difference);
        totalDifference += result.difference;
      }
    } else if (categoryResult.errors.length === 0) {
      console.log(`  ⚠️  No test results found`);
    }
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("OVERALL STATISTICS:");
  console.log(`  Total tests: ${totalTests}`);
  console.log(
    `  Passed: ${totalPassed} (${
      totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0
    }%)`,
  );
  console.log(
    `  Failed: ${totalFailed} (${
      totalTests > 0 ? ((totalFailed / totalTests) * 100).toFixed(1) : 0
    }%)`,
  );
  console.log(`  Errors: ${totalErrors}`);
  console.log(`  Maximum difference: ${maxDifference.toExponential(2)}`);
  console.log(
    `  Average difference: ${
      totalTests > 0 ? (totalDifference / totalTests).toExponential(2) : "N/A"
    }`,
  );
  console.log(`${"=".repeat(80)}`);

  // Summary of issues
  console.log(`\n${"=".repeat(80)}`);
  console.log("ISSUES SUMMARY");
  console.log(`${"=".repeat(80)}`);

  const issues: Array<
    { category: string; testName: string; difference: number; status: string }
  > = [];

  for (const categoryResult of allResults) {
    for (const result of categoryResult.results) {
      if (result.status === "FAIL" || result.status === "ERROR") {
        issues.push({
          category: categoryResult.category,
          testName: result.testName,
          difference: result.difference,
          status: result.status,
        });
      }
    }
  }

  if (issues.length === 0) {
    console.log(
      "✅ No significant issues found - all statistical tests within acceptable tolerance!",
    );
  } else {
    console.log(`⚠️  Found ${issues.length} significant issues:`);
    console.log();

    // Group by category
    const issuesByCategory = issues.reduce((acc, issue) => {
      if (!acc[issue.category]) {
        acc[issue.category] = [];
      }
      acc[issue.category].push(issue);
      return acc;
    }, {} as Record<string, typeof issues>);

    for (
      const [category, categoryIssues] of Object.entries(issuesByCategory)
    ) {
      console.log(`${category.toUpperCase().replace(/_/g, " ")}:`);
      for (const issue of categoryIssues) {
        const severity = issue.difference >= 1e-1
          ? "🔴 CRITICAL"
          : issue.difference >= 1e-3
          ? "🟡 WARNING"
          : "🟠 MINOR";
        console.log(
          `  ${severity} ${issue.testName}: diff = ${
            issue.difference.toExponential(2)
          } (${issue.status})`,
        );
      }
      console.log();
    }
  }

  console.log(`${"=".repeat(80)}`);
}

async function main() {
  console.log("Running comprehensive statistical tests...");
  console.log(`Testing ${statisticalTests.length} test categories`);

  const allResults: TestCategoryResults[] = [];

  for (const category of statisticalTests) {
    const result = await runTestCategory(category);
    allResults.push(result);
  }

  printSummary(allResults);
}

if (import.meta.main) {
  main().catch(console.error);
}
